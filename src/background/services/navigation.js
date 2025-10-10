/**
 * Navigation Service
 * 
 * Intercepts browser navigation to block URLs with forbidden words.
 * Functional module pattern.
 * 
 * @module background/services/navigation
 */

import { isExtensionContextValid } from '../../utils/chrome';
import { createLogger } from '../../utils/logger';
import { containsBlockedWord, getRedirectUrl, isFilterEnabled, shouldUseCustomUrl } from './settings';
import { incrementStats } from './stats';
import { showUrlBlockedNotification, showSearchBlockedNotification } from './notifications';

const logger = createLogger('NavigationService');

/**
 * Get blocked page URL
 * 
 * @param {string} originalUrl - The URL that was blocked
 * @returns {string} URL to blocked page
 */
function getBlockedPageUrl(originalUrl = '') {
  const blockedPageUrl = chrome.runtime.getURL('src/pages/blocked/index.html');
  if (originalUrl) {
    return `${blockedPageUrl}?blocked=${encodeURIComponent(originalUrl)}`;
  }
  return blockedPageUrl;
}

/**
 * Initialize navigation service
 */
export function initNavigation() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping init');
    return;
  }

  logger.info('Initializing navigation service');
  setupNavigationListeners();
}

/**
 * Set up navigation event listeners
 */
function setupNavigationListeners() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping listeners');
    return;
  }

  try {
    // Handle navigation before it starts
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (isExtensionContextValid()) {
        handleBeforeNavigate(details);
      }
    });

    // Handle navigation after it commits
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (isExtensionContextValid()) {
        handleCommitted(details);
      }
    });

    logger.info('Navigation listeners setup complete');
  } catch (error) {
    logger.safeError('Error setting up listeners', error);
  }
}

/**
 * Handle navigation before it starts
 * 
 * @async
 * @param {Object} details - Navigation details
 * @returns {Promise<void>}
 */
async function handleBeforeNavigate(details) {
  if (!isExtensionContextValid()) return;
  
  // CHECK IF FILTER IS ENABLED
  if (!isFilterEnabled()) return;
  
  // Only process main frame
  if (details.frameId !== 0) return;
  
  const url = details.url;
  
  // Check for blocked words in URL
  if (containsBlockedWord(url)) {
    logger.info(`Intercepted navigation with blocked word: ${url}`);
    
    // Update statistics
    await incrementStats(1);
    
    // Show notification
    await showUrlBlockedNotification();
    
    // Redirect to appropriate page
    const useCustom = shouldUseCustomUrl();
    const redirectUrl = useCustom
      ? (getRedirectUrl() || 'https://griffinswebservices.com')
      : getBlockedPageUrl(url);
    
    chrome.tabs.update(details.tabId, { url: redirectUrl });
  }
}

/**
 * Handle navigation after it commits
 * Checks search query parameters
 * 
 * @async
 * @param {Object} details - Navigation details
 * @returns {Promise<void>}
 */
async function handleCommitted(details) {
  if (!isExtensionContextValid()) return;
  
  // CHECK IF FILTER IS ENABLED
  if (!isFilterEnabled()) return;
  
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
    if (containsBlockedWord(query)) {
      logger.info('Blocked query parameter detected');
      
      // Update stats
      await incrementStats(1);
      
      // Show search-specific notification
      await showSearchBlockedNotification();
      
      // Redirect to appropriate page
      const useCustom = shouldUseCustomUrl();
      const redirectUrl = useCustom
        ? (getRedirectUrl() || 'https://griffinswebservices.com')
        : getBlockedPageUrl(details.url);
      
      chrome.tabs.update(details.tabId, { url: redirectUrl });
    }
  } catch (error) {
    logger.debug(`Error parsing URL: ${details.url}`, error);
  }
}