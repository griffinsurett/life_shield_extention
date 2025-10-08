export class NavigationManager {
  constructor(settingsManager, statsManager, notificationManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
    this.init();
  }

  init() {
    this.setupNavigationListeners();
  }

  setupNavigationListeners() {
    // Listen for navigation attempts
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      this.handleBeforeNavigate(details);
    });

    // Check URL parameters after navigation
    chrome.webNavigation.onCommitted.addListener((details) => {
      this.handleCommitted(details);
    });
  }

  async handleBeforeNavigate(details) {
    if (details.frameId !== 0) return;
    
    const url = details.url;
    
    if (this.settingsManager.containsBlockedWord(url)) {
      console.log('[Navigation Manager] Intercepted navigation to blocked URL:', url);
      
      // Increment stats for blocked navigation
      await this.statsManager.incrementStats(1);
      
      // Show notification
      await this.notificationManager.showUrlBlockedNotification();
      
      // Redirect
      chrome.tabs.update(details.tabId, { 
        url: this.settingsManager.getRedirectUrl() 
      });
    }
  }

  async handleCommitted(details) {
    if (details.frameId !== 0) return;
    
    try {
      const urlObj = new URL(details.url);
      const query = urlObj.searchParams.get('q') || 
                   urlObj.searchParams.get('query') || 
                   urlObj.searchParams.get('p') || '';
      
      if (this.settingsManager.containsBlockedWord(query)) {
        console.log('[Navigation Manager] Blocked query parameter detected');
        
        // Increment stats for blocked search
        await this.statsManager.incrementStats(1);
        
        // Show notification
        await this.notificationManager.showSearchBlockedNotification();
        
        // Redirect
        chrome.tabs.update(details.tabId, { 
          url: this.settingsManager.getRedirectUrl() 
        });
      }
    } catch (_error) {
      // Invalid URL, ignore
    }
  }
}