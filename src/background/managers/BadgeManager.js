/**
 * Badge Manager
 * 
 * Manages the extension badge (icon badge counter).
 * Updates the badge to show today's filter count.
 * 
 * @class BadgeManager
 */

import { isExtensionContextValid, safeChrome, safeChromeAsync } from '../../utils/chrome';
import { BADGE_UPDATE_INTERVAL } from '../../utils/timing';

export class BadgeManager {
  constructor() {
    this.init();
  }

  /**
   * Initialize badge manager
   * Updates badge immediately and sets up periodic updates
   */
  init() {
    // Initial update
    this.updateBadge();
    
    // Update every minute to keep badge current
    setInterval(() => {
      if (isExtensionContextValid()) {
        this.updateBadge();
      }
    }, BADGE_UPDATE_INTERVAL);
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
    if (!isExtensionContextValid()) {
      console.log('[Badge Manager] Extension context invalid, skipping badge update');
      return;
    }

    try {
      // Get today's count from local storage
      const result = await safeChromeAsync(
        () => chrome.storage.local.get(['todayCount']),
        { todayCount: 0 }
      );
      
      const count = result.todayCount || 0;

      // Show count on badge if > 0
      if (count > 0) {
        safeChrome(() => {
          chrome.action.setBadgeText({ text: count.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#dc2626' }); // Red
        });
      } else {
        // Clear badge if count is 0
        safeChrome(() => chrome.action.setBadgeText({ text: '' }));
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
    if (!isExtensionContextValid()) {
      return;
    }

    try {
      if (count > 0) {
        safeChrome(() => {
          chrome.action.setBadgeText({ text: count.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
        });
      } else {
        safeChrome(() => chrome.action.setBadgeText({ text: '' }));
      }
    } catch (error) {
      console.log('[Badge Manager] Error setting badge count:', error);
    }
  }
}