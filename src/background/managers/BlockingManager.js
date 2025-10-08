export class BlockingManager {
  constructor(settingsManager, statsManager, notificationManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
    this.blockedTabIds = new Set(); // Track tabs we've already blocked to avoid duplicates
    this.init();
  }

  async init() {
    // Update rules when settings change
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.blockedSites || changes.redirectUrl) {
          this.updateBlockingRules();
        }
      }
    });

    // Set initial rules
    await this.updateBlockingRules();

    // Listen for blocked requests to update stats
    this.setupBlockedRequestListener();
  }

  async updateBlockingRules() {
    const blockedSites = this.settingsManager.getBlockedSites();
    const redirectUrl = this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com';

    console.log('[Blocking Manager] Updating rules for sites:', blockedSites);

    // Remove all existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);

    // Create rules for each blocked site
    const newRules = [];
    let ruleId = 1;

    for (const site of blockedSites) {
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Rule 1: Block exact domain with any path
      newRules.push({
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

      // Rule 2: Block with www prefix
      if (!cleanSite.startsWith('www.')) {
        newRules.push({
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

      // Rule 3: Block any subdomain (for cases like about.gitlab.com)
      const parts = cleanSite.split('.');
      if (parts.length === 2) {
        newRules.push({
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

      // Rule 4: Block without trailing slash
      newRules.push({
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

    // Update rules atomically
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
        addRules: newRules
      });

      console.log('[Blocking Manager] Updated blocking rules:', newRules.length, 'rules active');
    } catch (error) {
      console.error('[Blocking Manager] Error updating rules:', error);
    }
  }

  setupBlockedRequestListener() {
    // FIRST LINE OF DEFENSE: Catch BEFORE navigation even starts
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;
      
      // Check if this URL matches a blocked site
      if (this.settingsManager.containsBlockedSite(url)) {
        console.log('[Blocking Manager] BEFORE navigate - Blocked site detected:', url);
        
        // Prevent duplicate notifications for same tab
        if (!this.blockedTabIds.has(tabId)) {
          this.blockedTabIds.add(tabId);
          
          // Update stats
          await this.statsManager.incrementStats(1);
          
          // Show notification
          await this.notificationManager.showUrlBlockedNotification();
          
          // Clear from set after a delay
          setTimeout(() => this.blockedTabIds.delete(tabId), 2000);
        }
        
        // Immediately redirect
        chrome.tabs.update(tabId, { 
          url: this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com'
        });
      }
    });

    // SECOND LINE OF DEFENSE: Catch after navigation commits (for redirects that slip through)
    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;
      
      // Check if this URL matches a blocked site
      if (this.settingsManager.containsBlockedSite(url)) {
        console.log('[Blocking Manager] COMMITTED - Blocked site detected after redirect:', url);
        
        // Prevent duplicate notifications for same tab
        if (!this.blockedTabIds.has(tabId)) {
          this.blockedTabIds.add(tabId);
          
          // Update stats
          await this.statsManager.incrementStats(1);
          
          // Clear from set after a delay
          setTimeout(() => this.blockedTabIds.delete(tabId), 2000);
        }
        
        // Force redirect
        chrome.tabs.update(tabId, { 
          url: this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com'
        });
      }
    });

    // THIRD LINE OF DEFENSE: Catch server-side redirects
    chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      const redirectUrl = details.redirectUrl;
      
      // Check if redirect target is blocked
      if (this.settingsManager.containsBlockedSite(redirectUrl)) {
        console.log('[Blocking Manager] Server redirect to blocked site detected:', redirectUrl);
        // The onBeforeNavigate or onCommitted will catch this next
      }
    });
  }
}