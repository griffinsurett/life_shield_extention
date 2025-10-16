/**
 * Navigation Service
 *
 * Intercepts browser navigation events to block URLs containing forbidden words.
 * Works at the navigation level - catches blocked content BEFORE page loads.
 * 
 * Two-stage interception:
 * 1. onBeforeNavigate - Catches navigation attempts (back/forward, address bar)
 * 2. onCommitted - Catches query parameters in search URLs
 * 
 * This is complementary to site blocking (blocking.js):
 * - blocking.js: Blocks entire domains/sites
 * - navigation.js: Blocks URLs with specific words/phrases
 * 
 * @module background/services/navigation
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import {
  containsBlockedWord,
  getRedirectUrl,
  isFilterEnabled,
  shouldUseCustomUrl,
} from "./settings";
import { incrementStats } from "./stats";
import {
  showContentBlockedNotification,
  showSearchBlockedNotification,
} from "./notifications";
import {
  getBlockedPageUrl,
  getRedirectUrlWithFallback,
} from "../../utils/builders";

const logger = createLogger("NavigationService");

/**
 * Initialize navigation service
 * 
 * Sets up listeners for webNavigation events.
 * These events fire for all navigation types: clicks, typing URLs, back/forward, etc.
 * 
 * @returns {void}
 */
export function initNavigation() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Initializing navigation service");
  setupNavigationListeners();
}

/**
 * Set up navigation event listeners
 * 
 * Registers listeners for two key navigation events:
 * - onBeforeNavigate: Fires before navigation starts (can check URL)
 * - onCommitted: Fires after navigation commits (can check query params)
 * 
 * Both events are needed because:
 * - Some URLs need immediate blocking (onBeforeNavigate)
 * - Search queries are only fully parseable after commit (onCommitted)
 * 
 * @returns {void}
 */
function setupNavigationListeners() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    // Handle navigation BEFORE it starts
    // Catches: typed URLs, bookmarks, back/forward
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (isExtensionContextValid()) {
        handleBeforeNavigate(details);
      }
    });

    // Handle navigation AFTER it commits
    // Catches: search query parameters, fully loaded URLs
    chrome.webNavigation.onCommitted.addListener((details) => {
      if (isExtensionContextValid()) {
        handleCommitted(details);
      }
    });

    logger.info("Navigation listeners setup complete");
  } catch (error) {
    logger.safeError("Error setting up listeners", error);
  }
}

/**
 * Handle navigation before it starts
 * 
 * First line of defense - checks URL for blocked words before page loads.
 * This prevents the page from even starting to load if blocked.
 * 
 * Flow:
 * 1. User navigates to URL
 * 2. Check if filter is enabled
 * 3. Check if URL contains blocked words
 * 4. If blocked: Update stats, show notification, redirect
 * 
 * @async
 * @param {Object} details - Navigation details from webNavigation API
 * @param {number} details.tabId - ID of tab navigating
 * @param {number} details.frameId - Frame ID (0 = main frame)
 * @param {string} details.url - URL being navigated to
 * @returns {Promise<void>}
 */
async function handleBeforeNavigate(details) {
  if (!isExtensionContextValid()) return;

  // CHECK IF FILTER IS ENABLED
  // If user disabled filter, don't intercept anything
  if (!isFilterEnabled()) return;

  // Only process main frame (ignore iframes)
  // frameId 0 = main page, others = embedded frames
  if (details.frameId !== 0) return;

  const url = details.url;

  // Check for blocked words in URL
  if (containsBlockedWord(url)) {
    logger.info(`Intercepted navigation with blocked word: ${url}`);

    // Update block statistics
    await incrementStats(1);

    // Show notification to user (if alerts enabled)
    await showContentBlockedNotification();

    // Redirect to appropriate page
    const useCustom = shouldUseCustomUrl();
    const redirectUrl = useCustom
      ? getRedirectUrlWithFallback(getRedirectUrl())
      : getBlockedPageUrl(url);

    // Update tab with redirect URL
    chrome.tabs.update(details.tabId, { url: redirectUrl });
  }
}

/**
 * Handle navigation after it commits
 * 
 * Second line of defense - checks search query parameters after navigation.
 * Necessary because some sites dynamically generate URLs after initial load.
 * 
 * Specifically targets search engines:
 * - Google: ?q=search
 * - Bing: ?q=search
 * - Yahoo: ?p=search
 * - DuckDuckGo: ?q=search
 * 
 * @async
 * @param {Object} details - Navigation details
 * @param {number} details.tabId - Tab ID
 * @param {number} details.frameId - Frame ID
 * @param {string} details.url - Committed URL
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
    // Different search engines use different parameter names
    const query =
      urlObj.searchParams.get("q") ||    // Google, Bing, DuckDuckGo
      urlObj.searchParams.get("query") || // Generic
      urlObj.searchParams.get("p") ||     // Yahoo
      "";

    // If query contains blocked words, redirect
    if (containsBlockedWord(query)) {
      logger.info("Blocked query parameter detected");

      // Update statistics
      await incrementStats(1);

      // Show search-specific notification
      // Different from regular block notification
      await showSearchBlockedNotification();

      // Redirect to appropriate page
      const useCustom = shouldUseCustomUrl();
      const redirectUrl = useCustom
        ? getRedirectUrlWithFallback(getRedirectUrl())
        : getBlockedPageUrl(details.url);

      chrome.tabs.update(details.tabId, { url: redirectUrl });
    }
  } catch (error) {
    // URL parsing might fail for special URLs (about:, chrome:, etc)
    // Log but don't block - these are usually safe
    logger.debug(`Error parsing URL: ${details.url}`, error);
  }
}