// src/background/services/blocking.js
/**
 * Blocking Service
 *
 * Manages site-level blocking using declarativeNetRequest.
 * Functional module pattern.
 *
 * @module background/services/blocking
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import {
  getBlockedSites,
  containsBlockedSite,
  isFilterEnabled,
} from "./settings";
import { incrementStats } from "./stats";
import { showContentBlockedNotification } from "./notifications";
import { getRedirectUrl, redirectTab, redirectBlockedTabs } from "./redirect";

const logger = createLogger("BlockingService");

const TAB_BLOCKING_DEBOUNCE = 2000;
const blockedTabIds = new Set();

/**
 * Check if URL is an extension page that should be excluded from blocking
 */
function isExcludedUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('chrome-extension://') ||
    url.startsWith('chrome://') ||
    url.startsWith('about:')
  );
}

export async function initBlocking() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  try {
    logger.info("Initializing blocking service");

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionContextValid()) return;

      if (namespace === "sync") {
        if (
          changes.blockedSites ||
          changes.redirectUrl ||
          changes.enableFilter ||
          changes.useCustomUrl
        ) {
          updateBlockingRules();
        }
      }
    });

    await updateBlockingRules();
    setupBlockedRequestListener();

    logger.info("Blocking service initialized");
  } catch (error) {
    logger.safeError("Error during init", error);
  }
}

export async function updateBlockingRules() {
  if (!isExtensionContextValid()) return;

  try {
    if (!isFilterEnabled()) {
      logger.info("Filter disabled, clearing all blocking rules");
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: [],
      });

      logger.info("All blocking rules cleared");
      return;
    }

    const blockedSites = getBlockedSites();
    const redirectUrl = getRedirectUrl();

    logger.info(`Updating rules for ${blockedSites.length} sites`);
    logger.info(`Using redirect URL: ${redirectUrl}`);

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    const rules = [];
    let ruleId = 1;

    for (const site of blockedSites) {
      const cleanSite = site.replace(/^https?:\/\//, "").replace(/\/$/, "");

      // Rule 1: Block site with path
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "redirect", redirect: { url: redirectUrl } },
        condition: {
          urlFilter: `*://${cleanSite}/*`,
          resourceTypes: ["main_frame"],
        },
      });

      // Rule 2: Block www variant
      if (!cleanSite.startsWith("www.")) {
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: "redirect", redirect: { url: redirectUrl } },
          condition: {
            urlFilter: `*://www.${cleanSite}/*`,
            resourceTypes: ["main_frame"],
          },
        });
      }

      // Rule 3: Block all subdomains for root domains
      if (cleanSite.split(".").length === 2) {
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: "redirect", redirect: { url: redirectUrl } },
          condition: {
            urlFilter: `*://*.${cleanSite}/*`,
            resourceTypes: ["main_frame"],
          },
        });
      }

      // Rule 4: Block exact domain without path
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "redirect", redirect: { url: redirectUrl } },
        condition: {
          urlFilter: `*://${cleanSite}`,
          resourceTypes: ["main_frame"],
        },
      });
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules,
    });

    logger.info(`Updated blocking rules: ${rules.length} rules active`);

    // ✅ NEW: Redirect any tabs currently on blocked sites
    const redirectedCount = await redirectBlockedTabs();
    if (redirectedCount > 0) {
      logger.info(`Auto-redirected ${redirectedCount} tab(s) after rules update`);
    }
  } catch (error) {
    logger.error("Error updating rules", error);
  }
}

function setupBlockedRequestListener() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      if (!isFilterEnabled()) return;
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      if (isExcludedUrl(url)) {
        logger.debug(`Excluded URL (extension page): ${url}`);
        return;
      }

      if (containsBlockedSite(url)) {
        logger.debug(`BEFORE navigate - Blocked site detected: ${url}`);

        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          await showContentBlockedNotification();
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        await redirectTab(tabId, url);
      }
    });

    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      if (!isFilterEnabled()) return;
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      if (isExcludedUrl(url)) {
        logger.debug(`Excluded URL (extension page): ${url}`);
        return;
      }

      if (containsBlockedSite(url)) {
        logger.debug(`COMMITTED - Blocked site detected: ${url}`);

        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        await redirectTab(tabId, url);
      }
    });

    chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      if (!isFilterEnabled()) return;
      if (details.frameId !== 0) return;

      const redirectUrl = details.redirectUrl;

      if (isExcludedUrl(redirectUrl)) {
        logger.debug(`Excluded redirect URL (extension page): ${redirectUrl}`);
        return;
      }

      if (containsBlockedSite(redirectUrl)) {
        logger.debug(`Server redirect to blocked site: ${redirectUrl}`);
      }
    });

    logger.info("Navigation listeners setup complete");
  } catch (error) {
    logger.safeError("Error setting up listeners", error);
  }
}