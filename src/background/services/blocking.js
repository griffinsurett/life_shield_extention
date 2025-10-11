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
  getRedirectUrl,
  containsBlockedSite,
  isFilterEnabled,
  shouldUseCustomUrl,
} from "./settings";
import { incrementStats } from "./stats";
import { showUrlBlockedNotification } from "./notifications";
import {
  getBlockedPageUrl,
  getRedirectUrlWithFallback,
} from "../../utils/builders";

const logger = createLogger("BlockingService");

// Local timing constant
const TAB_BLOCKING_DEBOUNCE = 2000; // 2 seconds

// Track blocked tabs to prevent duplicate stats
const blockedTabIds = new Set();

/**
 * Initialize blocking service
 *
 * @async
 * @returns {Promise<void>}
 */
export async function initBlocking() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  try {
    logger.info("Initializing blocking service");

    // Listen for settings changes
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

    // Update rules on initialization
    await updateBlockingRules();

    // Set up navigation listeners
    setupBlockedRequestListener();

    logger.info("Blocking service initialized");
  } catch (error) {
    logger.safeError("Error during init", error);
  }
}

/**
 * Update declarativeNetRequest rules
 *
 * @async
 * @returns {Promise<void>}
 */
export async function updateBlockingRules() {
  if (!isExtensionContextValid()) return;

  try {
    // CHECK IF FILTER IS ENABLED
    if (!isFilterEnabled()) {
      logger.info("Filter disabled, clearing all blocking rules");

      // Get existing rules and remove them all
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: [],
      });

      logger.info("All blocking rules cleared");
      return;
    }

    const blockedSites = getBlockedSites();
    const useCustom = shouldUseCustomUrl();
    const redirectUrl = useCustom
      ? getRedirectUrlWithFallback(getRedirectUrl())
      : getBlockedPageUrl();

    logger.info(`Updating rules for ${blockedSites.length} sites`);
    logger.info(
      `Using ${useCustom ? "custom URL" : "blocked page"}: ${redirectUrl}`
    );

    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    // Create new rules
    const rules = [];
    let ruleId = 1;

    for (const site of blockedSites) {
      // Clean site URL
      const cleanSite = site.replace(/^https?:\/\//, "").replace(/\/$/, "");

      // Rule 1: Block site with path
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: redirectUrl },
        },
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
          action: {
            type: "redirect",
            redirect: { url: redirectUrl },
          },
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
          action: {
            type: "redirect",
            redirect: { url: redirectUrl },
          },
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
        action: {
          type: "redirect",
          redirect: { url: redirectUrl },
        },
        condition: {
          urlFilter: `*://${cleanSite}`,
          resourceTypes: ["main_frame"],
        },
      });
    }

    // Update rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules,
    });

    logger.info(`Updated blocking rules: ${rules.length} rules active`);
  } catch (error) {
    logger.error("Error updating rules", error);
  }
}

/**
 * Set up navigation listeners for blocked sites
 */
function setupBlockedRequestListener() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    // Listen for navigation attempts before they happen
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (!isExtensionContextValid()) return;

      // CHECK IF FILTER IS ENABLED
      if (!isFilterEnabled()) return;

      // Only check main frame
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // Check if URL matches blocked site
      if (containsBlockedSite(url)) {
        logger.debug(`BEFORE navigate - Blocked site detected: ${url}`);

        // Only increment stats once per tab
        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          await showUrlBlockedNotification();

          // Clear after debounce period
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        // Redirect to appropriate page
        const useCustom = shouldUseCustomUrl();
        const redirectUrl = useCustom
          ? getRedirectUrlWithFallback(getRedirectUrl())
          : getBlockedPageUrl(url);

        chrome.tabs.update(tabId, { url: redirectUrl });
      }
    });

    // Listen for committed navigation
    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (!isExtensionContextValid()) return;

      // CHECK IF FILTER IS ENABLED
      if (!isFilterEnabled()) return;

      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // Double-check after navigation commits
      if (containsBlockedSite(url)) {
        logger.debug(`COMMITTED - Blocked site detected: ${url}`);

        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        const useCustom = shouldUseCustomUrl();
        const redirectUrl = useCustom
          ? getRedirectUrlWithFallback(getRedirectUrl())
          : getBlockedPageUrl(url);

        chrome.tabs.update(tabId, { url: redirectUrl });
      }
    });

    // Listen for server redirects
    chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
      if (!isExtensionContextValid()) return;

      // CHECK IF FILTER IS ENABLED
      if (!isFilterEnabled()) return;

      if (details.frameId !== 0) return;

      const redirectUrl = details.redirectUrl;

      if (containsBlockedSite(redirectUrl)) {
        logger.debug(`Server redirect to blocked site: ${redirectUrl}`);
      }
    });

    logger.info("Navigation listeners setup complete");
  } catch (error) {
    logger.safeError("Error setting up listeners", error);
  }
}