// src/background/services/badge.js
/**
 * Badge Service
 *
 * Manages the extension badge (icon badge counter).
 * Now respects the showAlerts setting.
 *
 * @module background/services/badge
 */

import {
  isExtensionContextValid,
  safeChrome,
  safeChromeAsync,
} from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { shouldShowAlerts } from "./settings";
import { BRAND } from "../../config";

const logger = createLogger("BadgeService");

// Local timing constant
const BADGE_UPDATE_INTERVAL = 60000; // 1 minute

/**
 * Initialize badge service
 * Sets up periodic updates
 */
export function initBadge() {
  logger.info("Initializing badge service");

  // Initial update
  updateBadge();

  // Update every minute
  setInterval(() => {
    if (isExtensionContextValid()) {
      updateBadge();
    }
  }, BADGE_UPDATE_INTERVAL);

  // Listen for showAlerts changes to immediately update badge
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && changes.showAlerts !== undefined) {
      logger.info(`Show alerts changed, updating badge`);
      updateBadge();
    }
  });
}

/**
 * Update badge with current today count
 * Now checks showAlerts setting before displaying
 *
 * @async
 * @returns {Promise<void>}
 */
export async function updateBadge() {
  if (!isExtensionContextValid()) {
    logger.debug("Context invalid, skipping badge update");
    return;
  }

  try {
    // Check if alerts should be shown
    const showAlerts = shouldShowAlerts();

    // If alerts are disabled, clear the badge
    if (!showAlerts) {
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      logger.debug("Alerts disabled, badge cleared");
      return;
    }

    // Alerts are enabled, show the count
    logger.chromeAPI("storage.local.get", ["todayCount"]);
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["todayCount"]),
      { todayCount: 0 }
    );

    const count = result.todayCount || 0;

    if (count > 0) {
      safeChrome(() => {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: BRAND.BADGE_COLOR });
      });
      logger.debug(`Badge updated: ${count}`);
    } else {
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      logger.debug("Badge cleared (count is 0)");
    }
  } catch (error) {
    logger.safeError("Failed to update badge", error);
  }
}

/**
 * Set badge to specific count
 * Respects showAlerts setting
 *
 * @async
 * @param {number} count - Count to display
 * @returns {Promise<void>}
 */
export async function setBadgeCount(count) {
  if (!isExtensionContextValid()) {
    return;
  }

  try {
    // Check if alerts should be shown
    const showAlerts = shouldShowAlerts();

    if (!showAlerts) {
      // Alerts disabled, don't show badge
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      return;
    }

    // Alerts enabled, show the count
    if (count > 0) {
      safeChrome(() => {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: BRAND.BADGE_COLOR });
      });
    } else {
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
    }
    logger.debug(`Badge count set: ${count}`);
  } catch (error) {
    logger.safeError("Failed to set badge count", error);
  }
}