/**
 * Blocking Service
 * 
 * Manages site-level blocking using declarativeNetRequest.
 * Functional module pattern.
 * 
 * @module background/services/blocking
 */

import { isExtensionContextValid } from '../../utils/chrome';
import { TAB_BLOCKING_DEBOUNCE } from '../../utils/timing';
import { createLogger } from '../../utils/logger';
import { getBlockedSites, getRedirectUrl, containsBlockedSite } from './settings';
import { incrementStats } from './stats';
import { showUrlBlockedNotification } from './notifications';

const logger = createLogger('BlockingService');

// Track blocked tabs to prevent duplicate stats
const blockedTabIds = new Set();

/**
 * Initialize blocking service
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function initBlocking() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping init');
    return;
  }

  try {
    logger.info('Initializing blocking service');

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionContextValid()) return;
      
      if (namespace === 'sync') {
        if (changes.blockedSites || changes.redirectUrl) {
          updateBlockingRules();
        }
      }
    });

    // Update rules on initialization
    await updateBlockingRules();
    
    // Set up navigation listeners
    setupBlockedRequestListener();
    
    logger.info('Blocking service initialized');
  } catch (error) {
    logger.safeError('Error during init', error);
  }
}

/**
 * Update declarativeNetRequest rules
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function updateBlockingRules() {
  if (!isExtensionContextValid()) return;

  try {
    const blockedSites = getBlockedSites();
    const redirectUrl = getRedirectUrl() || 'https://griffinswebservices.com';
    
    logger.info(`Updating rules for ${blockedSites.length} sites`);

    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Create new rules
    const rules = [];
    let ruleId = 1;

    for (const site of blockedSites) {
      // Clean site URL
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

      // Rule 2: Block www variant
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

    // Update rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: rules
    });

    logger.info(`Updated blocking rules: ${rules.length} rules active`);
  } catch (error) {
    logger.error('Error updating rules', error);
  }
}

/**
 * Set up navigation listeners for blocked sites
 */
function setupBlockedRequestListener() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping listeners');
    return;
  }

  try {
    // Listen for navigation attempts before they happen
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      
      // Only check main frame
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // Check if URL matches blocked site
      if (containsBlockedSite(url)) {
        logger.debug(`BEFORE navigate - Blocked site detected: ${url}`);
        
        // Only increment stats once per tab
        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          await showUrlBlockedNotification();
          
          // Clear after debounce period
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        // Redirect to safe page
        chrome.tabs.update(tabId, {
          url: getRedirectUrl() || 'https://griffinswebservices.com'
        });
      }
    });

    // Listen for committed navigation
    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // Double-check after navigation commits
      if (containsBlockedSite(url)) {
        logger.debug(`COMMITTED - Blocked site detected: ${url}`);
        
        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        chrome.tabs.update(tabId, {
          url: getRedirectUrl() || 'https://griffinswebservices.com'
        });
      }
    });

    // Listen for server redirects
    chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      
      if (details.frameId !== 0) return;

      const redirectUrl = details.redirectUrl;

      if (containsBlockedSite(redirectUrl)) {
        logger.debug(`Server redirect to blocked site: ${redirectUrl}`);
      }
    });

    logger.info('Navigation listeners setup complete');
  } catch (error) {
    logger.safeError('Error setting up listeners', error);
  }
}