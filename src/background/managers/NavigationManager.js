/**
 * Navigation Manager
 * 
 * Intercepts browser navigation to block URLs containing forbidden words.
 * Works alongside BlockingManager but focuses on blocking based on:
 * - Blocked words in URLs (not entire sites)
 * - Blocked words in search query parameters
 * 
 * Note: Entire site blocking is handled by BlockingManager using declarativeNetRequest.
 * This manager only handles word-based URL filtering.
 * 
 * Events monitored:
 * - onBeforeNavigate: Catches URLs before navigation starts
 * - onCommitted: Catches search query parameters after navigation
 * 
 * @class NavigationManager
 */
export class NavigationManager {
  /**
   * @param {SettingsManager} settingsManager - For checking blocked words
   * @param {StatsManager} statsManager - For incrementing block statistics
   * @param {NotificationManager} notificationManager - For showing alerts
   */
  constructor(settingsManager, statsManager, notificationManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
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
   * Initialize navigation manager
   * Sets up webNavigation event listeners
   */
  init() {
    if (!this.isContextValid()) {
      console.log('[Navigation Manager] Extension context invalid, skipping init');
      return;
    }

    this.setupNavigationListeners();
  }

  /**
   * Set up listeners for navigation events
   * Registers handlers for before and after navigation
   */
  setupNavigationListeners() {
    if (!this.isContextValid()) {
      console.log('[Navigation Manager] Extension context invalid, skipping listeners');
      return;
    }

    try {
      // Handle navigation before it starts
      chrome.webNavigation.onBeforeNavigate.addListener((details) => {
        if (this.isContextValid()) {
          this.handleBeforeNavigate(details);
        }
      });

      // Handle navigation after it commits (for query parameters)
      chrome.webNavigation.onCommitted.addListener((details) => {
        if (this.isContextValid()) {
          this.handleCommitted(details);
        }
      });
    } catch (error) {
      console.log('[Navigation Manager] Error setting up listeners:', error);
    }
  }

  /**
   * Handle navigation before it starts
   * Checks if URL contains blocked words and redirects if found
   * 
   * Note: Site blocking is handled by BlockingManager, this only checks for words
   * 
   * @async
   * @param {Object} details - Navigation details from webNavigation API
   * @param {number} details.tabId - ID of the tab
   * @param {string} details.url - URL being navigated to
   * @param {number} details.frameId - Frame ID (0 for main frame)
   * @returns {Promise<void>}
   */
  async handleBeforeNavigate(details) {
    if (!this.isContextValid()) return;
    
    // Only process main frame navigation (not iframes)
    if (details.frameId !== 0) return;
    
    const url = details.url;
    
    // Check for blocked words in URL (not sites - those are handled by BlockingManager)
    if (this.settingsManager.containsBlockedWord(url)) {
      console.log('[Navigation Manager] Intercepted navigation with blocked word:', url);
      
      // Update statistics
      await this.statsManager.incrementStats(1);
      
      // Show notification
      await this.notificationManager.showUrlBlockedNotification();
      
      // Redirect to safe page
      chrome.tabs.update(details.tabId, { 
        url: this.settingsManager.getRedirectUrl() 
      });
    }
  }

  /**
   * Handle navigation after it commits
   * Checks search query parameters for blocked words
   * 
   * Common search parameter names:
   * - q: Google, Bing, DuckDuckGo
   * - query: Some search engines
   * - p: Yahoo
   * 
   * @async
   * @param {Object} details - Navigation details from webNavigation API
   * @param {number} details.tabId - ID of the tab
   * @param {string} details.url - URL after navigation
   * @param {number} details.frameId - Frame ID (0 for main frame)
   * @returns {Promise<void>}
   */
  async handleCommitted(details) {
    if (!this.isContextValid()) return;
    
    // Only process main frame
    if (details.frameId !== 0) return;
    
    try {
      // Parse URL to extract query parameters
      const urlObj = new URL(details.url);
      
      // Check common search parameter names
      const query = urlObj.searchParams.get('q') || 
                   urlObj.searchParams.get('query') || 
                   urlObj.searchParams.get('p') || '';
      
      // If query contains blocked words, redirect
      if (this.settingsManager.containsBlockedWord(query)) {
        console.log('[Navigation Manager] Blocked query parameter detected');
        
        // Update stats
        await this.statsManager.incrementStats(1);
        
        // Show search-specific notification
        await this.notificationManager.showSearchBlockedNotification();
        
        // Redirect to safe page
        chrome.tabs.update(details.tabId, { 
          url: this.settingsManager.getRedirectUrl() 
        });
      }
    } catch {
      console.log('[Navigation Manager] Error parsing URL:', details.url);
    }
  }
}