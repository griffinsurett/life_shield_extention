export class MessageHandler {
  constructor(settingsManager, statsManager, notificationManager, badgeManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
    this.badgeManager = badgeManager;
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((message, sender) => {
      this.handleMessage(message, sender);
    });
  }

  async handleMessage(message, sender) {
    console.log('[Message Handler] Message received:', message, 
                'SHOW_ALERTS:', this.settingsManager.shouldShowAlerts());
    
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

  async handleShowNotification(message) {
    await this.notificationManager.showCustomNotification(
      message.title,
      message.message
    );
  }

  async handleContentFiltered(message) {
    // Update badge when content is filtered
    await this.badgeManager.updateBadge();
    
    // Show notification
    await this.notificationManager.showContentFilteredNotification(message.count);
  }
}