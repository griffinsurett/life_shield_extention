export class BlockingManager {
  constructor(settingsManager, statsManager, notificationManager) {
    this.settingsManager = settingsManager;
    this.statsManager = statsManager;
    this.notificationManager = notificationManager;
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
      // Only add if the site doesn't already have a subdomain
      const parts = cleanSite.split('.');
      if (parts.length === 2) { // e.g., "gitlab.com"
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
      console.log('[Blocking Manager] Rules:', newRules);
    } catch (error) {
      console.error('[Blocking Manager] Error updating rules:', error);
    }
  }

  setupBlockedRequestListener() {
    // Track when navigation happens to blocked sites
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      
      // Check if this URL matches a blocked site
      if (this.settingsManager.containsBlockedSite(url)) {
        console.log('[Blocking Manager] Blocked site navigation detected:', url);
        
        // Update stats
        await this.statsManager.incrementStats(1);
        
        // Show notification
        await this.notificationManager.showUrlBlockedNotification();
      }
    });

    // Also listen for completed navigations to catch redirects
    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (details.frameId !== 0) return;

      const url = details.url;
      
      // Check if this URL matches a blocked site
      if (this.settingsManager.containsBlockedSite(url)) {
        console.log('[Blocking Manager] Blocked site detected after redirect:', url);
        
        // Update stats
        await this.statsManager.incrementStats(1);
        
        // Force redirect
        chrome.tabs.update(details.tabId, { 
          url: this.settingsManager.getRedirectUrl() || 'https://griffinswebservices.com'
        });
      }
    });
  }
}