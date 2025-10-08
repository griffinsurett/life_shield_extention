/**
 * Notification Manager
 * 
 * Manages browser notifications for the extension.
 * Shows alerts when content is blocked, filtered, or on startup/welcome.
 * 
 * Notifications are only shown if the user has enabled the "Show Alerts" setting.
 * 
 * Notification types:
 * - Startup: Confirms extension is active
 * - Welcome: Shows on first installation
 * - Content Blocked: URL/site was blocked
 * - URL Blocked: URL contains blocked content
 * - Search Blocked: Search query contains blocked content
 * - Content Filtered: Text was filtered on page
 * - Custom: Generic notification with custom title/message
 * 
 * @class NotificationManager
 */
export class NotificationManager {
  /**
   * @param {SettingsManager} settingsManager - For checking if alerts are enabled
   */
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    // Get extension icon URL for notifications
    this.iconUrl = chrome.runtime.getURL('icons/icon48.png');
  }

  /**
   * Show startup notification
   * Displayed when extension loads to confirm it's active
   * Always shown (not controlled by showAlerts setting)
   * 
   * @async
   * @returns {Promise<string|null>} Notification ID or null if failed
   */
  async showStartupNotification() {
    await this.createNotification('test-startup', {
      title: '🌿 Wellness Filter Active',
      message: 'Extension loaded successfully!',
      priority: 2
    });
  }

  /**
   * Show welcome notification
   * Displayed on first installation
   * Always shown (not controlled by showAlerts setting)
   * 
   * @async
   * @returns {Promise<string|null>} Notification ID or null if failed
   */
  async showWelcomeNotification() {
    await this.createNotification('welcome', {
      title: '🌿 Welcome to Wellness Filter!',
      message: 'Your extension is now active and protecting your browsing experience.',
      priority: 2
    });
  }

  /**
   * Show content blocked notification
   * Displayed when a URL or site is blocked
   * Only shown if showAlerts is enabled
   * 
   * @async
   * @returns {Promise<string|null>} Notification ID or null if not shown
   */
  async showContentBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Content Blocked',
      message: 'Redirecting to a healthier page...',
      priority: 1
    });
  }

  /**
   * Show URL blocked notification
   * Displayed when URL contains blocked content
   * Only shown if showAlerts is enabled
   * 
   * @async
   * @returns {Promise<string|null>} Notification ID or null if not shown
   */
  async showUrlBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 URL Blocked',
      message: 'This URL contains blocked content',
      priority: 1
    });
  }

  /**
   * Show search blocked notification
   * Displayed when search query contains blocked content
   * Only shown if showAlerts is enabled
   * 
   * @async
   * @returns {Promise<string|null>} Notification ID or null if not shown
   */
  async showSearchBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Search Blocked',
      message: 'Your search contained blocked content',
      priority: 1
    });
  }

  /**
   * Show content filtered notification
   * Displayed when text content is filtered on a page
   * Only shown if showAlerts is enabled
   * 
   * @async
   * @param {number} count - Number of items filtered
   * @returns {Promise<string|null>} Notification ID or null if not shown
   */
  async showContentFilteredNotification(count) {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Content Filtered',
      message: `Blocked ${count} item(s) on this page`,
      priority: 0
    });
  }

  /**
   * Show custom notification
   * Generic notification with custom title and message
   * Only shown if showAlerts is enabled
   * 
   * @async
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @returns {Promise<string|null>} Notification ID or null if not shown
   */
  async showCustomNotification(title, message) {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: title || '🌿 Wellness Filter',
      message: message || 'Content filtered',
      priority: 1
    });
  }

  /**
   * Create a browser notification
   * Low-level method that actually creates the notification
   * 
   * @async
   * @param {string|null} id - Optional notification ID for tracking
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {number} options.priority - Priority level (0-2)
   * @returns {Promise<string|null>} Notification ID or null if failed
   */
  async createNotification(id, options) {
    return new Promise((resolve) => {
      // Prepare notification options
      const notificationOptions = {
        type: 'basic',
        iconUrl: this.iconUrl,
        ...options
      };

      // Callback for when notification is created
      const callback = (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          console.log('Notification created:', notificationId);
          resolve(notificationId);
        }
      };

      // Create notification with or without specific ID
      if (id) {
        chrome.notifications.create(id, notificationOptions, callback);
      } else {
        chrome.notifications.create(notificationOptions, callback);
      }
    });
  }
}