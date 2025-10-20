/**
 * Blocking Service
 *
 * Manages declarativeNetRequest rules for site blocking.
 * NOTE: declarativeNetRequest doesn't work with hashed sites.
 * We rely on navigation.js for blocking hashed sites.
 *
 * @module background/services/blocking
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { getBlockedSites, getRedirectUrl } from "./settings";

const logger = createLogger("BlockingService");

export function initBlocking() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Initializing blocking service");
  
  // Clear any existing declarativeNetRequest rules
  // Since sites are now hashed, we can't use declarativeNetRequest
  // We rely on navigation.js for blocking
  clearBlockingRules();
  
  setupBlockedRequestListener();
  setupStorageListener();
  
  logger.info("Blocking service initialized (using navigation-based blocking for hashed sites)");
}

async function clearBlockingRules() {
  if (!isExtensionContextValid()) return;

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
      });
      logger.info(`Cleared ${existingRuleIds.length} existing blocking rules`);
    }
  } catch (error) {
    logger.error("Error clearing rules", error);
  }
}

function setupBlockedRequestListener() {
  if (!isExtensionContextValid()) return;

  try {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
      if (isExtensionContextValid()) {
        logger.debug("Request blocked by rule", {
          url: details.request.url,
          ruleId: details.rule.ruleId,
        });
      }
    });
  } catch (error) {
    logger.debug("onRuleMatchedDebug not available (expected in production)");
  }
}

function setupStorageListener() {
  if (!isExtensionContextValid()) return;

  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync" && changes.blockedSites) {
        logger.info("Blocked sites changed - navigation service will handle blocking");
      }
    });
  } catch (error) {
    logger.safeError("Error setting up storage listener", error);
  }
}