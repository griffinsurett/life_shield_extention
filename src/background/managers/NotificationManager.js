export class NotificationManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.iconUrl = chrome.runtime.getURL('icons/icon48.png');
  }

  async showStartupNotification() {
    await this.createNotification('test-startup', {
      title: '🌿 Wellness Filter Active',
      message: 'Extension loaded successfully!',
      priority: 2
    });
  }

  async showWelcomeNotification() {
    await this.createNotification('welcome', {
      title: '🌿 Welcome to Wellness Filter!',
      message: 'Your extension is now active and protecting your browsing experience.',
      priority: 2
    });
  }

  async showContentBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Content Blocked',
      message: 'Redirecting to a healthier page...',
      priority: 1
    });
  }

  async showUrlBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 URL Blocked',
      message: 'This URL contains blocked content',
      priority: 1
    });
  }

  async showSearchBlockedNotification() {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Search Blocked',
      message: 'Your search contained blocked content',
      priority: 1
    });
  }

  async showContentFilteredNotification(count) {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: '🌿 Content Filtered',
      message: `Blocked ${count} item(s) on this page`,
      priority: 0
    });
  }

  async showCustomNotification(title, message) {
    if (!this.settingsManager.shouldShowAlerts()) return;
    
    await this.createNotification(null, {
      title: title || '🌿 Wellness Filter',
      message: message || 'Content filtered',
      priority: 1
    });
  }

  async createNotification(id, options) {
    return new Promise((resolve) => {
      const notificationOptions = {
        type: 'basic',
        iconUrl: this.iconUrl,
        ...options
      };

      const callback = (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
          resolve(null);
        } else {
          console.log('Notification created:', notificationId);
          resolve(notificationId);
        }
      };

      if (id) {
        chrome.notifications.create(id, notificationOptions, callback);
      } else {
        chrome.notifications.create(notificationOptions, callback);
      }
    });
  }
}