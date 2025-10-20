// src/background/services/redirect.js
/**
 * Redirect Service
 *
 * Centralized service for handling all blocking redirects.
 * Single source of truth for redirect behavior.
 * 
 * Functional module pattern - consistent with other services.
 *
 * @module background/services/redirect
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import {
  getRedirectUrl as getCustomRedirectUrl,
  shouldUseCustomUrl,
  containsBlockedSite,
} from "./settings";
import {
  getBlockedPageUrl,
  getRedirectUrlWithFallback,
} from "../../utils/builders";

const logger = createLogger("RedirectService");

/**
 * Initialize redirect service
 * (Currently no initialization needed, but included for consistency)
 */
export function initRedirect() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Redirect service initialized");
}

/**
 * Get the appropriate redirect URL based on current settings
 * 
 * @param {string} [blockedUrl=''] - Original blocked URL (for context in blocked page)
 * @returns {string} The redirect URL to use
 * 
 * @example
 * const url = getRedirectUrl('https://blocked-site.com');
 * // Returns either custom URL or blocked page URL based on settings
 */
export function getRedirectUrl(blockedUrl = '') {
  const useCustom = shouldUseCustomUrl();
  
  if (useCustom) {
    // Use custom URL with fallback to default
    const customUrl = getCustomRedirectUrl();
    return getRedirectUrlWithFallback(customUrl);
  } else {
    // Use built-in blocked page with original URL in query param
    return getBlockedPageUrl(blockedUrl);
  }
}

/**
 * Redirect a tab to the appropriate blocking page
 * 
 * @param {number} tabId - Tab ID to redirect
 * @param {string} [blockedUrl=''] - Original blocked URL (for context)
 * @returns {Promise<void>}
 * 
 * @example
 * await redirectTab(123, 'https://blocked-site.com');
 */
export async function redirectTab(tabId, blockedUrl = '') {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping redirect");
    return;
  }

  const url = getRedirectUrl(blockedUrl);
  
  try {
    await chrome.tabs.update(tabId, { url });
    logger.debug(`Redirected tab ${tabId} to: ${url}`);
  } catch (error) {
    logger.safeError(`Failed to redirect tab ${tabId}`, error);
    throw error;
  }
}

/**
 * Redirect multiple tabs (batch operation)
 * 
 * @param {number[]} tabIds - Array of tab IDs to redirect
 * @param {string} [blockedUrl=''] - Original blocked URL (for context)
 * @returns {Promise<void>}
 */
export async function redirectTabs(tabIds, blockedUrl = '') {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping redirects");
    return;
  }

  const promises = tabIds.map(tabId => redirectTab(tabId, blockedUrl));
  
  try {
    await Promise.all(promises);
    logger.debug(`Redirected ${tabIds.length} tabs`);
  } catch (error) {
    logger.safeError("Failed to redirect some tabs", error);
  }
}

/**
 * Check all open tabs and redirect any that are on blocked sites
 * 
 * This is useful after updating the blocked sites list to immediately
 * redirect any tabs that are currently on newly blocked sites.
 * 
 * @returns {Promise<number>} Number of tabs redirected
 * 
 * @example
 * const count = await redirectBlockedTabs();
 * console.log(`Redirected ${count} tabs`);
 */
export async function redirectBlockedTabs() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping redirect");
    return 0;
  }

  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    let redirectCount = 0;

    // Check each tab
    for (const tab of tabs) {
      if (!tab.url || !tab.id) continue;

      // Skip extension pages
      if (
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('about:')
      ) {
        continue;
      }

      // Check if tab is on a blocked site
      if (containsBlockedSite(tab.url)) {
        logger.debug(`Found tab ${tab.id} on blocked site: ${tab.url}`);
        await redirectTab(tab.id, tab.url);
        redirectCount++;
      }
    }

    if (redirectCount > 0) {
      logger.info(`Redirected ${redirectCount} tab(s) on blocked sites`);
    }

    return redirectCount;
  } catch (error) {
    logger.safeError("Failed to redirect blocked tabs", error);
    return 0;
  }
}