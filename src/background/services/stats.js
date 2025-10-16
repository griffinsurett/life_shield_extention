/**
 * Stats Service
 *
 * Manages statistics tracking for the extension.
 * Tracks total blocks and daily blocks with automatic daily reset.
 * 
 * Statistics tracked:
 * - filterCount: Total items blocked since install (all-time)
 * - todayCount: Items blocked today (resets daily at midnight)
 * - lastResetDate: Date of last daily reset
 * - installDate: Date extension was installed
 * 
 * Storage:
 * - Uses chrome.storage.local (not synced across devices)
 * - Statistics are device-specific
 * 
 * Daily Reset:
 * - Checks every hour if date changed
 * - Resets todayCount to 0 at midnight
 * - Preserves filterCount (all-time total)
 * 
 * @module background/services/stats
 */

import {
  isExtensionContextValid,
  safeChromeAsync,
} from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { updateBadge } from "./badge";

const logger = createLogger("StatsService");

// Local timing constant
const STATS_CHECK_INTERVAL = 3600000; // 1 hour (60 * 60 * 1000 ms)

/**
 * Initialize stats service
 * 
 * Sets up daily reset checking.
 * Runs immediately on startup and then every hour.
 * 
 * Why every hour?
 * - Catches midnight reset even if extension reloads
 * - Low overhead (just a date comparison)
 * - Ensures reset happens reliably
 * 
 * @returns {void}
 */
export function initStats() {
  logger.info("Initializing stats service");

  // Check daily reset immediately on startup
  checkDailyReset();

  // Check every hour for date change
  setInterval(() => {
    if (isExtensionContextValid()) {
      checkDailyReset();
    }
  }, STATS_CHECK_INTERVAL);
}

/**
 * Check if daily count should be reset
 * 
 * Compares stored lastResetDate with current date.
 * If different, resets todayCount to 0 and updates lastResetDate.
 * 
 * Uses toLocaleDateString() for date comparison:
 * - "1/15/2025" vs "1/16/2025"
 * - Automatically handles timezone
 * - Resets at local midnight
 * 
 * Also updates badge after reset to show 0.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function checkDailyReset() {
  if (!isExtensionContextValid()) return;

  try {
    // Get last reset date from storage
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["lastResetDate"]),
      { lastResetDate: "" }
    );

    // Get today's date as string
    const today = new Date().toLocaleDateString();

    // If dates don't match, it's a new day
    if (result.lastResetDate !== today) {
      // Reset today count and update last reset date
      await safeChromeAsync(() =>
        chrome.storage.local.set({
          todayCount: 0,              // Reset today's count
          lastResetDate: today,       // Update reset date
        })
      );

      // Update badge to show 0
      updateBadge();
      
      logger.info("Daily count reset");
    }
  } catch (error) {
    logger.safeError("Failed to check daily reset", error);
  }
}

/**
 * Increment statistics counters
 * 
 * Adds to both filterCount (all-time) and todayCount (daily).
 * Used whenever content is blocked or filtered.
 * 
 * Called from:
 * - Blocking service (site blocked)
 * - Navigation service (URL blocked)
 * - Content script (text filtered)
 * 
 * Flow:
 * 1. Read current counts from storage
 * 2. Add count to both totals
 * 3. Write updated counts back to storage
 * 4. Update badge to reflect new todayCount
 * 
 * Why both counters?
 * - filterCount: Shows lifetime effectiveness
 * - todayCount: Shows current day activity (more meaningful)
 *
 * @async
 * @param {number} count - Number to add (default: 1)
 * @returns {Promise<void>}
 */
export async function incrementStats(count = 1) {
  if (!isExtensionContextValid()) return;

  try {
    // Get current counts from storage
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["filterCount", "todayCount"]),
      { filterCount: 0, todayCount: 0 }
    );

    // Calculate new counts
    const newFilterCount = (result.filterCount || 0) + count;
    const newTodayCount = (result.todayCount || 0) + count;

    // Save updated counts
    await safeChromeAsync(() =>
      chrome.storage.local.set({
        filterCount: newFilterCount,
        todayCount: newTodayCount,
      })
    );

    // Update badge to show new today count
    updateBadge();
    
    logger.debug(
      `Stats incremented: filter=${newFilterCount}, today=${newTodayCount}`
    );
  } catch (error) {
    logger.safeError("Failed to increment stats", error);
  }
}

/**
 * Initialize statistics on first install
 * 
 * Called from onInstalled handler in background/index.js.
 * Sets up initial statistics structure.
 * 
 * Creates:
 * - filterCount: 0 (total blocks)
 * - todayCount: 0 (today's blocks)
 * - installDate: Current date
 * - lastResetDate: Current date (for daily reset tracking)
 * 
 * Only called once when extension first installed.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function initializeStats() {
  if (!isExtensionContextValid()) return;

  try {
    // Set initial stats values
    await safeChromeAsync(() =>
      chrome.storage.local.set({
        filterCount: 0,
        todayCount: 0,
        installDate: new Date().toLocaleDateString(),
        lastResetDate: new Date().toLocaleDateString(),
      })
    );
    
    logger.info("Stats initialized");
  } catch (error) {
    logger.safeError("Failed to initialize stats", error);
  }
}