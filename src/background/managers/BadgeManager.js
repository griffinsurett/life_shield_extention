/**
 * Badge Manager
 * 
 * Manages the extension badge (icon badge counter).
 * Updates the badge to show today's filter count.
 * 
 * Features:
 * - Updates badge on initialization
 * - Updates badge every minute to stay current
 * - Shows red badge when count > 0
 * - Clears badge when count = 0
 * - Context validation for all operations
 * 
 * @class BadgeManager
 */
export class BadgeManager {
  constructor() {
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
   * Initialize badge manager
   * Updates badge immediately and sets up periodic updates
   */
  init() {
    // Initial update
    this.updateBadge();
    
    // Update every minute to keep badge current
    // Uses setInterval which persists across service worker restarts
    setInterval(() => {
      if (this.isContextValid()) {
        this.updateBadge();
      }
    }, 60000);
  }

  /**
   * Update badge with current today count
   * Reads count from storage and updates badge
   * Shows count if > 0, clears badge if 0
   * 
   * @async
   * @returns {Promise<void>}
   */
  async updateBadge() {
    // Validate context before proceeding
    if (!this.isContextValid()) {
      console.log('[Badge Manager] Extension context invalid, skipping badge update');
      return;
    }

    try {
      // Get today's count from local storage
      const result = await chrome.storage.local.get(['todayCount']);
      const count = result.todayCount || 0;

      // Show count on badge if > 0
      if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#dc2626' }); // Red
      } else {
        // Clear badge if count is 0
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.log('[Badge Manager] Error updating badge:', error);
    }
  }

  /**
   * Set badge to specific count
   * Used by other managers to manually set count
   * 
   * @async
   * @param {number} count - Count to display on badge
   * @returns {Promise<void>}
   */
  async setBadgeCount(count) {
    // Validate context before proceeding
    if (!this.isContextValid()) {
      return;
    }

    try {
      if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.log('[Badge Manager] Error setting badge count:', error);
    }
  }
}