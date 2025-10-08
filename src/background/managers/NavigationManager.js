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
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      this.handleBeforeNavigate(details);
    });

    chrome.webNavigation.onCommitted.addListener((details) => {
      this.handleCommitted(details);
    });
  }

  async handleBeforeNavigate(details) {
    if (details.frameId !== 0) return;
    
    const url = details.url;
    
    // Check for blocked words in URL (not sites - those are handled by BlockingManager)
    if (this.settingsManager.containsBlockedWord(url)) {
      console.log('[Navigation Manager] Intercepted navigation with blocked word:', url);
      
      await this.statsManager.incrementStats(1);
      await this.notificationManager.showUrlBlockedNotification();
      
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
        
        await this.statsManager.incrementStats(1);
        await this.notificationManager.showSearchBlockedNotification();
        
        chrome.tabs.update(details.tabId, { 
          url: this.settingsManager.getRedirectUrl() 
        });
      }
    } catch (_error) {
      // Invalid URL, ignore
    }
  }
}