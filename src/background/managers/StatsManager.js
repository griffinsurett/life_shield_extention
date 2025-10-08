/**
 * Stats Manager
 * 
 * Manages statistics tracking for the extension.
 * Tracks two main counters:
 * - filterCount: Total items blocked since installation
 * - todayCount: Items blocked today (resets daily at midnight)
 * 
 * @class StatsManager
 */

import { isExtensionContextValid, safeChromeAsync } from '../../utils/chrome';
import { STATS_CHECK_INTERVAL } from '../../utils/timing';

export class StatsManager {
  /**
   * @param {BadgeManager} badgeManager - For updating badge when stats change
   */
  constructor(badgeManager) {
    this.badgeManager = badgeManager;
    this.init();
  }

  /**
   * Initialize stats manager
   * Checks for daily reset and sets up periodic checks
   */
  init() {
    if (!isExtensionContextValid()) {
      console.log('[Stats Manager] Extension context invalid, skipping init');
      return;
    }

    // Check if today's count needs to be reset
    this.checkDailyReset();
    
    // Check for daily reset every hour
    setInterval(() => {
      if (isExtensionContextValid()) {
        this.checkDailyReset();
      }
    }, STATS_CHECK_INTERVAL);
  }

  /**
   * Check if daily count should be reset
   * Compares current date with lastResetDate
   * If different, resets todayCount to 0
   * 
   * @async
   * @returns {Promise<void>}
   */
  async checkDailyReset() {
    if (!isExtensionContextValid()) return;

    try {
      const result = await safeChromeAsync(
        () => chrome.storage.local.get(['lastResetDate']),
        { lastResetDate: '' }
      );
      
      const today = new Date().toLocaleDateString();
      
      // If last reset was on a different day, reset today's count
      if (result.lastResetDate !== today) {
        await safeChromeAsync(() => 
          chrome.storage.local.set({
            todayCount: 0,
            lastResetDate: today
          })
        );
        
        // Update badge to show 0
        this.badgeManager.updateBadge();
        
        console.log('[Background] Daily count reset');
      }
    } catch (error) {
      console.log('[Stats Manager] Error checking daily reset:', error);
    }
  }

  /**
   * Increment statistics counters
   * Adds to both filterCount (all-time) and todayCount (daily)
   * Automatically updates badge to reflect new count
   * 
   * @async
   * @param {number} count - Number to add to counters (default: 1)
   * @returns {Promise<void>}
   */
  async incrementStats(count = 1) {
    if (!isExtensionContextValid()) return;

    try {
      // Read current counts
      const result = await safeChromeAsync(
        () => chrome.storage.local.get(['filterCount', 'todayCount']),
        { filterCount: 0, todayCount: 0 }
      );
      
      // Calculate new counts
      const newFilterCount = (result.filterCount || 0) + count;
      const newTodayCount = (result.todayCount || 0) + count;
      
      // Save updated counts
      await safeChromeAsync(() =>
        chrome.storage.local.set({
          filterCount: newFilterCount,
          todayCount: newTodayCount
        })
      );
      
      // Update badge to show new today count
      this.badgeManager.updateBadge();
      
      console.log('[Background] Stats incremented:', { newFilterCount, newTodayCount });
    } catch (error) {
      console.log('[Stats Manager] Error incrementing stats:', error);
    }
  }

  /**
   * Initialize statistics on first install
   * Sets all counters to 0 and records installation date
   * 
   * @async
   * @returns {Promise<void>}
   */
  async initializeStats() {
    if (!isExtensionContextValid()) return;

    try {
      await safeChromeAsync(() =>
        chrome.storage.local.set({
          filterCount: 0,
          todayCount: 0,
          installDate: new Date().toLocaleDateString(),
          lastResetDate: new Date().toLocaleDateString()
        })
      );
    } catch (error) {
      console.log('[Stats Manager] Error initializing stats:', error);
    }
  }
}