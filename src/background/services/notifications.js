/**
 * Notifications Service
 *
 * Handles browser notifications for blocked content and other events.
 * Functional module pattern.
 *
 * @module background/services/notifications
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { shouldShowAlerts } from "./settings";
import { BRAND } from "../../config/brand";
import { iconManager } from "./iconManager";

const logger = createLogger("NotificationsService");

/**
 * Get the current active icon URL for notifications
 */
async function getCurrentIconUrl() {
  try {
    const activeIconId = iconManager.getActiveIconId();
    
    if (activeIconId === 'default') {
      // Use default icon from extension
      return chrome.runtime.getURL('assets/icon.png');
    }
    
    // Get custom icon from storage
    const icons = iconManager.getIcons();
    const activeIcon = icons.find(icon => icon.id === activeIconId);
    
    if (activeIcon && activeIcon.sizes && activeIcon.sizes[128]) {
      // Use the 128px version for notifications
      return activeIcon.sizes[128];
    }
    
    // Fallback to default
    return chrome.runtime.getURL('assets/icon.png');
  } catch (error) {
    logger.error('Failed to get current icon URL', error);
    return chrome.runtime.getURL('assets/icon.png');
  }
}

/**
 * Show content blocked notification
 *
 * @async
 * @returns {Promise<void>}
 */
export async function showContentBlockedNotification() {
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping notification - context invalid or alerts disabled");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create("blocked-content", {
      type: "basic",
      iconUrl: iconUrl,
      title: `${BRAND.ICON} URL Blocked`,
      message: "This URL contains blocked content",
      priority: 1,
    });

    logger.debug("Notification created: blocked-content");
  } catch (error) {
    logger.safeError("Error creating blocked notification", error);
  }
}

/**
 * Show URL blocked notification (alias for backward compatibility)
 *
 * @async
 * @returns {Promise<void>}
 */
export async function showUrlBlockedNotification() {
  return showContentBlockedNotification();
}

/**
 * Show search blocked notification
 *
 * @async
 * @returns {Promise<void>}
 */
export async function showSearchBlockedNotification() {
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping notification - context invalid or alerts disabled");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create("blocked-search", {
      type: "basic",
      iconUrl: iconUrl,
      title: `${BRAND.ICON} Search Blocked`,
      message: "This search contains blocked content",
      priority: 1,
    });

    logger.debug("Notification created: blocked-search");
  } catch (error) {
    logger.safeError("Error creating search blocked notification", error);
  }
}

/**
 * Show content filtered notification
 *
 * @async
 * @param {number} count - Number of items filtered
 * @returns {Promise<void>}
 */
export async function showContentFilteredNotification(count = 1) {
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping notification - context invalid or alerts disabled");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create("filtered-content", {
      type: "basic",
      iconUrl: iconUrl,
      title: `${BRAND.ICON} Content Filtered`,
      message: `${count} blocked ${count === 1 ? "word" : "words"} replaced`,
      priority: 1,
    });

    logger.debug("Notification created: filtered-content");
  } catch (error) {
    logger.safeError("Error creating filtered notification", error);
  }
}

/**
 * Show custom notification
 *
 * @async
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<void>}
 */
export async function showCustomNotification(title, message) {
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping notification - context invalid or alerts disabled");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create({
      type: "basic",
      iconUrl: iconUrl,
      title: title,
      message: message,
      priority: 1,
    });

    logger.debug("Custom notification created");
  } catch (error) {
    logger.safeError("Error creating custom notification", error);
  }
}

/**
 * Show startup notification
 *
 * @async
 * @returns {Promise<void>}
 */
export async function showStartupNotification() {
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping startup notification");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create("test-startup", {
      type: "basic",
      iconUrl: iconUrl,
      title: `${BRAND.ICON} ${BRAND.NAME} Active`,
      message: `${BRAND.TAGLINE}`,
      priority: 0,
    });

    logger.debug("Notification created: test-startup");
  } catch (error) {
    logger.safeError("Error creating startup notification", error);
  }
}

/**
 * Show welcome notification (on first install)
 *
 * @async
 * @returns {Promise<void>}
 */
export async function showWelcomeNotification() {
  if (!isExtensionContextValid()) {
    logger.debug("Skipping welcome notification - context invalid");
    return;
  }

  try {
    const iconUrl = await getCurrentIconUrl();
    
    await chrome.notifications.create("welcome", {
      type: "basic",
      iconUrl: iconUrl,
      title: `${BRAND.HEART} Welcome to ${BRAND.NAME}!`,
      message:
        "Thank you for installing! Click the extension icon to configure your settings.",
      priority: 2,
    });

    logger.debug("Notification created: welcome");
  } catch (error) {
    logger.safeError("Error creating welcome notification", error);
  }
}