/**
 * Blocking Manager
 * 
 * Manages site-level blocking using Chrome's declarativeNetRequest API.
 * Blocks entire sites by redirecting to a safe URL.
 * 
 * Features:
 * - Dynamic rule updates when blocked sites change
 * - Handles www and non-www variants
 * - Handles subdomains
 * - Updates statistics when sites are blocked
 * - Shows notifications for blocked sites
 * 
 * @class BlockingManager
 */
export class BlockingManager {
  /**
   * @param {SettingsManager} settingsManager - For accessing blocked sites
   * @param {StatsManager} statsManager - For updating statistics
   * @param {NotificationManager} notificationManager - For showing notifications
   */
  constructor(settingsManager, statsManager, notificationManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
    
    // Track tabs we've already blocked to prevent duplicate stats
    this.blockedTabIds = new Set();
    
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
   * Initialize blocking manager
   * Sets up listeners and updates initial rules
   * 
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.isContextValid()) {
      console.log('[Blocking Manager] Extension context invalid, skipping init');
      return;
    }

    try {
      // Listen for settings changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!this.isContextValid()) return;
        
        if (namespace === 'sync') {
          // Update rules when blocked sites or redirect URL changes
          if (changes.blockedSites || changes.redirectUrl) {
            this.updateBlockingRules();
          }
        }
      });

      // Update rules on initialization
      await this.updateBlockingRules();
      
      // Set up navigation listeners
      this.setupBlockedRequestListener();
    } catch (error) {
      console.log('[Blocking Manager] Error during init:', error);
    }
  }

  /**
   * Update declarativeNetRequest rules based on blocked sites
   * Creates rules for blocking sites and redirecting to safe URL
   * 
   * @async
   * @returns {Promise<void>}
   */
  async updateBlockingRules() {
    if (!this.isContextValid()) return;

    try {
      const blockedSites = this.settingsManager.getBlockedSites();
      const redirectUrl = this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com';
      
      console.log('[Blocking Manager] Updating rules for sites:', blockedSites);

      // Get existing dynamic rules and remove them
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map(rule => rule.id);

      // Create new rules array
      const rules = [];
      let ruleId = 1;

      // Create rules for each blocked site
      for (const site of blockedSites) {
        // Clean the site URL (remove protocol and trailing slash)
        const cleanSite = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
        
        // Rule 1: Block site with path
        rules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: { url: redirectUrl }
          },
          condition: {
            urlFilter: `*://${cleanSite}/*`,
            resourceTypes: ['main_frame']
          }
        });

        // Rule 2: Block www variant if not already www
        if (!cleanSite.startsWith('www.')) {
          rules.push({
            id: ruleId++,
            priority: 1,
            action: {
              type: 'redirect',
              redirect: { url: redirectUrl }
            },
            condition: {
              urlFilter: `*://www.${cleanSite}/*`,
              resourceTypes: ['main_frame']
            }
          });
        }

        // Rule 3: Block all subdomains for root domains
        if (cleanSite.split('.').length === 2) {
          rules.push({
            id: ruleId++,
            priority: 1,
            action: {
              type: 'redirect',
              redirect: { url: redirectUrl }
            },
            condition: {
              urlFilter: `*://*.${cleanSite}/*`,
              resourceTypes: ['main_frame']
            }
          });
        }

        // Rule 4: Block exact domain without path
        rules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: { url: redirectUrl }
          },
          condition: {
            urlFilter: `*://${cleanSite}`,
            resourceTypes: ['main_frame']
          }
        });
      }

      // Update dynamic rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: rules
      });

      console.log('[Blocking Manager] Updated blocking rules:', rules.length, 'rules active');
    } catch (error) {
      console.error('[Blocking Manager] Error updating rules:', error);
    }
  }

  /**
   * Set up navigation listeners for blocked sites
   * Provides additional layer of protection beyond declarativeNetRequest
   * Updates statistics when sites are blocked
   */
  setupBlockedRequestListener() {
    if (!this.isContextValid()) {
      console.log('[Blocking Manager] Extension context invalid, skipping listeners');
      return;
    }

    try {
      // Listen for navigation attempts before they happen
      chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
        if (!this.isContextValid()) return;
        
        // Only check main frame navigation
        if (details.frameId !== 0) return;

        const url = details.url;
        const tabId = details.tabId;

        // Check if URL matches a blocked site
        if (this.settingsManager.containsBlockedSite(url)) {
          console.log('[Blocking Manager] BEFORE navigate - Blocked site detected:', url);
          
          // Only increment stats once per tab
          if (!this.blockedTabIds.has(tabId)) {
            this.blockedTabIds.add(tabId);
            await this.statsManager.incrementStats(1);
            await this.notificationManager.showUrlBlockedNotification();
            
            // Clear the tab ID after 2 seconds to allow re-blocking
            setTimeout(() => this.blockedTabIds.delete(tabId), 2000);
          }

          // Redirect to safe page
          chrome.tabs.update(tabId, {
            url: this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com'
          });
        }
      });

      // Listen for committed navigation (after redirect)
      chrome.webNavigation.onCommitted.addListener(async (details) => {
        if (!this.isContextValid()) return;
        
        if (details.frameId !== 0) return;

        const url = details.url;
        const tabId = details.tabId;

        // Double-check after navigation commits
        if (this.settingsManager.containsBlockedSite(url)) {
          console.log('[Blocking Manager] COMMITTED - Blocked site detected after redirect:', url);
          
          if (!this.blockedTabIds.has(tabId)) {
            this.blockedTabIds.add(tabId);
            await this.statsManager.incrementStats(1);
            setTimeout(() => this.blockedTabIds.delete(tabId), 2000);
          }

          chrome.tabs.update(tabId, {
            url: this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com'
          });
        }
      });

      // Listen for server redirects to blocked sites
      chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
        if (!this.isContextValid()) return;
        
        if (details.frameId !== 0) return;

        const redirectUrl = details.redirectUrl;

        // Check if redirect target is blocked
        if (this.settingsManager.containsBlockedSite(redirectUrl)) {
          console.log('[Blocking Manager] Server redirect to blocked site detected:', redirectUrl);
        }
      });
    } catch (error) {
      console.log('[Blocking Manager] Error setting up listeners:', error);
    }
  }
}