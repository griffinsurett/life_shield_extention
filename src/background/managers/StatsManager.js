/**
 * Stats Manager
 * 
 * Manages statistics tracking for the extension.
 * Tracks two main counters:
 * - filterCount: Total items blocked since installation
 * - todayCount: Items blocked today (resets daily at midnight)
 * 
 * Also tracks:
 * - installDate: When extension was installed
 * - lastResetDate: Last date when todayCount was reset
 * 
 * Features:
 * - Automatic daily reset of todayCount
 * - Automatic badge updates when stats change
 * - Persistent storage in chrome.storage.local
 * - Context validation for all operations
 * 
 * @class StatsManager
 */
export class StatsManager {
  /**
   * @param {BadgeManager} badgeManager - For updating badge when stats change
   */
  constructor(badgeManager) {
    this.badgeManager = badgeManager;
    this.init();
  }

  /**
   * Check if extension context is still valid
   * 
   * @returns {boolean} True if context is valid
   */
  isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Initialize stats manager
   * Checks for daily reset and sets up periodic checks
   */
  init() {
    if (!this.isContextValid()) {
      console.log('[Stats Manager] Extension context invalid, skipping init');
      return;
    }

    // Check if today's count needs to be reset
    this.checkDailyReset();
    
    // Check for daily reset every hour
    // This ensures todayCount resets even if browser runs continuously
    setInterval(() => {
      if (this.isContextValid()) {
        this.checkDailyReset();
      }
    }, 3600000); // 1 hour in ms
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
    if (!this.isContextValid()) return;

    try {
      const result = await chrome.storage.local.get(['lastResetDate']);
      const today = new Date().toLocaleDateString();
      
      // If last reset was on a different day, reset today's count
      if (result.lastResetDate !== today) {
        await chrome.storage.local.set({
          todayCount: 0,
          lastResetDate: today
        });
        
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
    if (!this.isContextValid()) return;

    try {
      // Read current counts
      const result = await chrome.storage.local.get(['filterCount', 'todayCount']);
      
      // Calculate new counts
      const newFilterCount = (result.filterCount || 0) + count;
      const newTodayCount = (result.todayCount || 0) + count;
      
      // Save updated counts
      await chrome.storage.local.set({
        filterCount: newFilterCount,
        todayCount: newTodayCount
      });
      
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
    if (!this.isContextValid()) return;

    try {
      await chrome.storage.local.set({
        filterCount: 0,
        todayCount: 0,
        installDate: new Date().toLocaleDateString(),
        lastResetDate: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.log('[Stats Manager] Error initializing stats:', error);
    }
  }
}