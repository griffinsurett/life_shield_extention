/**
 * Notifications Service
 *
 * Manages all browser notifications for the extension.
 * Handles different notification types with appropriate icons and messages.
 * 
 * Notification Types:
 * - Content blocked (URL/site blocked)
 * - Search blocked (search query blocked)
 * - Content filtered (text replaced on page)
 * - Custom (generic notification)
 * - Startup (extension loaded)
 * - Welcome (first install)
 * 
 * Smart Icon Selection:
 * - Uses custom icon if user has set one
 * - Falls back to default icon if not
 * - Icons are managed by iconManager service
 * 
 * Respects User Settings:
 * - Only shows notifications if showAlerts is enabled
 * - Except welcome notification (always shown on install)
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
 * 
 * Smart icon selection:
 * 1. Check if user has custom icon set
 * 2. If yes, use 128px version of custom icon
 * 3. If no, use default extension icon
 * 4. If any error, fall back to default
 * 
 * Why 128px? Chrome notifications look best with larger icons.
 * 
 * @async
 * @returns {Promise<string>} Icon URL (data URL for custom, chrome-extension:// for default)
 */
async function getCurrentIconUrl() {
  try {
    // Get active icon ID from icon manager
    const activeIconId = iconManager.getActiveIconId();
    
    // If using default icon
    if (activeIconId === 'default') {
      // Return path to default icon file
      return chrome.runtime.getURL('assets/icon.png');
    }
    
    // Get custom icons list
    const icons = iconManager.getIcons();
    
    // Find the active custom icon
    const activeIcon = icons.find(icon => icon.id === activeIconId);
    
    // If found and has 128px size
    if (activeIcon && activeIcon.sizes && activeIcon.sizes[128]) {
      // Use the 128px version (data URL)
      return activeIcon.sizes[128];
    }
    
    // Fallback to default if custom icon not found
    return chrome.runtime.getURL('assets/icon.png');
  } catch (error) {
    // If any error occurs, use default icon
    logger.error('Failed to get current icon URL', error);
    return chrome.runtime.getURL('assets/icon.png');
  }
}

/**
 * Show content blocked notification
 * 
 * Displayed when:
 * - User navigates to blocked URL
 * - User tries to access blocked site
 * - URL contains blocked words
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function showContentBlockedNotification() {
  // Check if we should show notifications
  if (!isExtensionContextValid() || !shouldShowAlerts()) {
    logger.debug("Skipping notification - context invalid or alerts disabled");
    return;
  }

  try {
    // Get appropriate icon (custom or default)
    const iconUrl = await getCurrentIconUrl();
    
    // Create notification
    await chrome.notifications.create("blocked-content", {
      type: "basic",                    // Simple text notification
      iconUrl: iconUrl,                 // Extension icon
      title: `${BRAND.ICON} URL Blocked`, // Include brand emoji
      message: "This URL contains blocked content",
      priority: 1,                      // Normal priority
    });

    logger.debug("Notification created: blocked-content");
  } catch (error) {
    logger.safeError("Error creating blocked notification", error);
  }
}

/**
 * Show URL blocked notification (alias for backward compatibility)
 * 
 * Some parts of codebase may call this instead of showContentBlockedNotification.
 * Just redirects to the main function.
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
 * Displayed when:
 * - User searches for blocked terms
 * - Search query contains blocked words
 * - Navigation service intercepts search parameters
 * 
 * Different message from content blocked to be more specific.
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
 * Displayed when:
 * - Text is replaced on a page (blocked words → replacement phrases)
 * - Content script successfully filters content
 * 
 * Includes count of items filtered for user feedback.
 * 
 * @async
 * @param {number} count - Number of items filtered (default: 1)
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
      // Pluralize message based on count
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
 * Generic notification function for custom messages.
 * Used by other parts of extension to show arbitrary notifications.
 * 
 * Called via chrome.runtime.sendMessage with action 'showNotification'.
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
    
    // Create notification with auto-generated ID
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
 * Displayed when:
 * - Extension loads (browser starts or extension reloads)
 * - After initialization is complete
 * 
 * Confirms to user that extension is active and working.
 * Shows brand name and tagline.
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
      priority: 0,  // Low priority (less intrusive)
    });

    logger.debug("Notification created: test-startup");
  } catch (error) {
    logger.safeError("Error creating startup notification", error);
  }
}

/**
 * Show welcome notification (on first install)
 * 
 * Displayed when:
 * - Extension is installed for the first time
 * - Called from onInstalled handler in background/index.js
 * 
 * Special notification that ALWAYS shows (ignores showAlerts setting)
 * because user needs to know extension was installed successfully.
 * 
 * Includes call-to-action to configure settings.
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function showWelcomeNotification() {
  // Only check context validity, not showAlerts
  // Welcome notification should always show
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
      message: "Thank you for installing! Click the extension icon to configure your settings.",
      priority: 2,  // High priority (important first-time message)
    });

    logger.debug("Notification created: welcome");
  } catch (error) {
    logger.safeError("Error creating welcome notification", error);
  }
}