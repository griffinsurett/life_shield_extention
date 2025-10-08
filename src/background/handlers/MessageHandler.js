/**
 * Message Handler
 * 
 * Handles messages from content scripts and popup.
 * Acts as a central router for inter-component communication.
 * 
 * Message types handled:
 * - blockedUrl: Content script detected blocked URL
 * - showNotification: Request to show a notification
 * - contentFiltered: Content was filtered on page
 * - updateBadge: Request to update badge
 * 
 * @class MessageHandler
 */
export class MessageHandler {
  /**
   * @param {SettingsManager} settingsManager - For accessing settings
   * @param {StatsManager} statsManager - For updating statistics
   * @param {NotificationManager} notificationManager - For showing notifications
   * @param {BadgeManager} badgeManager - For updating badge
   */
  constructor(settingsManager, statsManager, notificationManager, badgeManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
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
   * Initialize message handler
   * Sets up listener for runtime messages
   */
  init() {
    if (!this.isContextValid()) {
      console.log('[Message Handler] Extension context invalid, skipping init');
      return;
    }

    try {
      chrome.runtime.onMessage.addListener((message, sender) => {
        if (this.isContextValid()) {
          this.handleMessage(message, sender);
        }
      });
    } catch (error) {
      console.log('[Message Handler] Error setting up listener:', error);
    }
  }

  /**
   * Handle incoming message
   * Routes message to appropriate handler based on action type
   * 
   * @async
   * @param {Object} message - Message object
   * @param {string} message.action - Action type
   * @param {Object} sender - Message sender info
   * @returns {Promise<void>}
   */
  async handleMessage(message, sender) {
    if (!this.isContextValid()) return;

    console.log('[Message Handler] Message received:', message, 
                'SHOW_ALERTS:', this.settingsManager.shouldShowAlerts());
    
    // Route to appropriate handler
    switch (message.action) {
      case 'blockedUrl':
        await this.handleBlockedUrl(message, sender);
        break;
        
      case 'showNotification':
        await this.handleShowNotification(message);
        break;
        
      case 'contentFiltered':
        await this.handleContentFiltered(message);
        break;
        
      case 'updateBadge':
        await this.badgeManager.updateBadge();
        break;
        
      default:
        console.log('[Message Handler] Unknown action:', message.action);
    }
  }

  /**
   * Handle blocked URL message
   * Sent by content script when it detects a blocked URL
   * 
   * Actions:
   * - Increment statistics
   * - Show notification
   * - Redirect tab to safe page
   * 
   * @async
   * @param {Object} message - Message data
   * @param {string} message.url - The blocked URL
   * @param {Object} sender - Message sender (includes tab info)
   * @returns {Promise<void>}
   */
  async handleBlockedUrl(message, sender) {
    console.log('[Message Handler] Blocked URL detected:', message.url);
    
    // Increment stats for URL block
    await this.statsManager.incrementStats(1);
    
    // Show notification
    await this.notificationManager.showContentBlockedNotification();
    
    // Redirect if we have a tab
    if (sender.tab && sender.tab.id) {
      chrome.tabs.update(sender.tab.id, { 
        url: this.settingsManager.getRedirectUrl() 
      });
    }
  }

  /**
   * Handle show notification request
   * Generic notification request with custom title and message
   * 
   * @async
   * @param {Object} message - Message data
   * @param {string} message.title - Notification title
   * @param {string} message.message - Notification message
   * @returns {Promise<void>}
   */
  async handleShowNotification(message) {
    await this.notificationManager.showCustomNotification(
      message.title,
      message.message
    );
  }

  /**
   * Handle content filtered message
   * Sent by content script when it filters text on a page
   * 
   * Actions:
   * - Update badge
   * - Show notification with count
   * 
   * @async
   * @param {Object} message - Message data
   * @param {number} message.count - Number of items filtered
   * @returns {Promise<void>}
   */
  async handleContentFiltered(message) {
    // Update badge when content is filtered
    await this.badgeManager.updateBadge();
    
    // Show notification with count
    await this.notificationManager.showContentFilteredNotification(message.count);
  }
}