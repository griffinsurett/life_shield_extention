/**
 * Stats Service
 *
 * Manages statistics tracking.
 * Functional module pattern.
 *
 * @module background/services/stats
 */

import {
  isExtensionContextValid,
  safeChromeAsync,
} from "../../utils/chromeApi";
import { STATS_CHECK_INTERVAL } from "../../utils/timing";
import { createLogger } from "../../utils/logger";
import { updateBadge } from "./badge";

const logger = createLogger("StatsService");

/**
 * Initialize stats service
 */
export function initStats() {
  logger.info("Initializing stats service");

  // Check daily reset
  checkDailyReset();

  // Check every hour
  setInterval(() => {
    if (isExtensionContextValid()) {
      checkDailyReset();
    }
  }, STATS_CHECK_INTERVAL);
}

/**
 * Check if daily count should be reset
 *
 * @async
 * @returns {Promise<void>}
 */
export async function checkDailyReset() {
  if (!isExtensionContextValid()) return;

  try {
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["lastResetDate"]),
      { lastResetDate: "" }
    );

    const today = new Date().toLocaleDateString();

    if (result.lastResetDate !== today) {
      await safeChromeAsync(() =>
        chrome.storage.local.set({
          todayCount: 0,
          lastResetDate: today,
        })
      );

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
 * @async
 * @param {number} count - Number to add
 * @returns {Promise<void>}
 */
export async function incrementStats(count = 1) {
  if (!isExtensionContextValid()) return;

  try {
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(["filterCount", "todayCount"]),
      { filterCount: 0, todayCount: 0 }
    );

    const newFilterCount = (result.filterCount || 0) + count;
    const newTodayCount = (result.todayCount || 0) + count;

    await safeChromeAsync(() =>
      chrome.storage.local.set({
        filterCount: newFilterCount,
        todayCount: newTodayCount,
      })
    );

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
 * @async
 * @returns {Promise<void>}
 */
export async function initializeStats() {
  if (!isExtensionContextValid()) return;

  try {
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
