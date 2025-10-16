/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BADGE SERVICE - The Extension Icon Counter
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service manages the little number badge that appears on the extension icon
 * in the browser toolbar. It shows users how many items were blocked today.
 * 
 * WHAT IT DOES:
 * - Displays the "today count" on the extension icon
 * - Updates automatically when content is blocked
 * - Respects the "Show Alerts" setting (hides if user turns off alerts)
 * - Updates periodically to stay current
 * - Listens for setting changes to show/hide immediately
 * 
 * BADGE BEHAVIOR:
 * - Shows a red number when count > 0
 * - Shows nothing when count = 0 or alerts disabled
 * - Updates every minute (in case count changes while user away)
 * - Updates immediately on storage changes
 * 
 * WHY EVERY MINUTE:
 * The badge updates every 60 seconds as a fallback to catch any missed updates.
 * Most of the time, updates happen immediately when content is blocked, but
 * this interval ensures we never show stale data.
 * 
 * PERFORMANCE NOTE:
 * The 1-minute interval is lightweight but could be optimized to only update
 * when needed (e.g., when count actually changes). This is a known area for
 * potential improvement.
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

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════
const logger = createLogger("BadgeService");

// ═══════════════════════════════════════════════════════════════════════════
// TIMING CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
// Update interval for the badge. We check every minute to ensure the badge
// stays in sync with the actual count, even if we somehow miss a storage update.
const BADGE_UPDATE_INTERVAL = 60000; // 1 minute

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INITIALIZE BADGE SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sets up the badge service with two update mechanisms:
 * 1. Periodic updates every minute (fallback)
 * 2. Immediate updates on settings changes (responsive)
 * 
 * INITIALIZATION PROCESS:
 * - Performs initial update to show current count immediately
 * - Starts interval timer for periodic updates
 * - Sets up listener for showAlerts setting changes
 * 
 * WHY TWO UPDATE MECHANISMS:
 * - Periodic: Catches any missed updates, ensures consistency
 * - Listener: Provides immediate feedback when settings change
 * 
 * @export
 */
export function initBadge() {
  logger.info("Initializing badge service");

  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL UPDATE
  // ───────────────────────────────────────────────────────────────────────────
  // Update the badge right away so users see the correct count immediately
  // when the extension starts
  updateBadge();

  // ───────────────────────────────────────────────────────────────────────────
  // PERIODIC UPDATES
  // ───────────────────────────────────────────────────────────────────────────
  // Set up interval to update badge every minute
  // This acts as a safety net to catch any missed updates and ensure the
  // badge always shows accurate data
  setInterval(() => {
    // Always check context validity in intervals
    // The extension might have been reloaded since the interval started
    if (isExtensionContextValid()) {
      updateBadge();
    }
  }, BADGE_UPDATE_INTERVAL);

  // ───────────────────────────────────────────────────────────────────────────
  // SETTINGS CHANGE LISTENER
  // ───────────────────────────────────────────────────────────────────────────
  // Listen for changes to the showAlerts setting
  // When user toggles alerts on/off, we need to immediately show/hide the badge
  chrome.storage.onChanged.addListener((changes, namespace) => {
    // Only react to sync storage changes (where settings are stored)
    if (namespace === "sync" && changes.showAlerts !== undefined) {
      logger.info(`Show alerts changed, updating badge`);
      updateBadge();
    }
  });
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UPDATE BADGE WITH CURRENT TODAY COUNT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the main function that updates the badge display.
 * It checks the showAlerts setting and the current count, then decides
 * whether to show a number or hide the badge.
 * 
 * BADGE DISPLAY LOGIC:
 * 1. Check if alerts are enabled (if not, clear badge and return)
 * 2. Get today's count from storage
 * 3. If count > 0, show the number with red background
 * 4. If count = 0, clear the badge (show nothing)
 * 
 * WHY CHECK showAlerts FIRST:
 * If the user has disabled alerts, they don't want to see any notifications
 * or indicators. We respect this preference by hiding the badge immediately.
 * 
 * ERROR HANDLING:
 * - Checks extension context before doing anything
 * - Uses safe Chrome API wrappers that handle errors gracefully
 * - Falls back to 0 if count is missing from storage
 * 
 * @async
 * @export
 * @returns {Promise<void>}
 */
export async function updateBadge() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  // Verify extension context is valid before accessing Chrome APIs
  // If context is invalid (extension was reloaded), skip update
  if (!isExtensionContextValid()) {
    logger.debug("Context invalid, skipping badge update");
    return;
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK ALERTS SETTING
    // ─────────────────────────────────────────────────────────────────────────
    // Get the user's preference for showing alerts
    // This is a synchronous check against the settings service's cached state
    const showAlerts = shouldShowAlerts();

    // If alerts are disabled, clear the badge and exit early
    // No need to fetch count from storage if we're not going to show it
    if (!showAlerts) {
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      logger.debug("Alerts disabled, badge cleared");
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH TODAY'S COUNT
    // ─────────────────────────────────────────────────────────────────────────
    // Alerts are enabled, so fetch the count from storage
    logger.chromeAPI("storage.local.get", ["todayCount"]);
    
    // Use safeChromeAsync to handle errors and provide fallback
    // If storage read fails or key doesn't exist, default to { todayCount: 0 }
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["todayCount"]),
      { todayCount: 0 }
    );

    // Extract count from result, default to 0 if undefined
    // The || 0 is a safety net in case storage returns null/undefined
    const count = result.todayCount || 0;

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE BADGE DISPLAY
    // ─────────────────────────────────────────────────────────────────────────
    if (count > 0) {
      // Count is positive, show the number on the badge
      safeChrome(() => {
        // Set the badge text to the count (converted to string)
        chrome.action.setBadgeText({ text: count.toString() });
        
        // Set the badge background color to brand red
        // This color is defined in config/brand.js
        chrome.action.setBadgeBackgroundColor({ color: BRAND.BADGE_COLOR });
      });
      logger.debug(`Badge updated: ${count}`);
    } else {
      // Count is 0, clear the badge (show nothing)
      // This keeps the UI clean when nothing has been blocked
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      logger.debug("Badge cleared (count is 0)");
    }
  } catch (error) {
    // If anything goes wrong during the update, log it
    // safeError suppresses context invalidation errors
    logger.safeError("Failed to update badge", error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SET BADGE TO SPECIFIC COUNT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is a utility function to manually set the badge to a specific count.
 * It's not currently used in the codebase but is provided for future use.
 * 
 * USE CASES:
 * - Testing badge display
 * - Manually setting count from other services
 * - Debugging badge behavior
 * 
 * BEHAVIOR:
 * - Respects showAlerts setting (won't show if alerts disabled)
 * - Shows count with red background if > 0
 * - Clears badge if count is 0
 * 
 * NOTE: Most code should NOT call this directly. Instead, update todayCount
 * in storage and let the storage listener trigger updateBadge().
 * 
 * @async
 * @export
 * @param {number} count - Count to display on badge
 * @returns {Promise<void>}
 */
export async function setBadgeCount(count) {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExtensionContextValid()) {
    return;
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK ALERTS SETTING
    // ─────────────────────────────────────────────────────────────────────────
    const showAlerts = shouldShowAlerts();

    // If alerts disabled, don't show the badge
    if (!showAlerts) {
      safeChrome(() => chrome.action.setBadgeText({ text: "" }));
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SET BADGE
    // ─────────────────────────────────────────────────────────────────────────
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