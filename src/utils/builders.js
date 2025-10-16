/**
 * Builder Utilities
 * 
 * Functions for constructing commonly used values throughout the extension.
 * Centralizes URL building, title formatting, and path construction.
 * 
 * Why builders matter:
 * - DRY (Don't Repeat Yourself) principle
 * - Consistent URL formats across extension
 * - Easy to update if patterns change
 * - Type-safe construction (less error-prone)
 * 
 * Common use cases:
 * - Building redirect URLs
 * - Creating page titles
 * - Getting resource paths
 * - Generating notification messages
 * 
 * @module utils/builders
 */

import { BRAND, DEFAULTS } from '../config';

/**
 * Get blocked page URL with optional original URL parameter
 * 
 * Constructs URL to the blocked content page.
 * Optionally includes the original URL as query parameter.
 * 
 * Use cases:
 * - Redirecting when blocked content detected
 * - Showing user what was blocked
 * - Allowing user to go back
 * 
 * URL structure:
 * - Base: chrome-extension://{id}/src/pages/blocked/index.html
 * - With param: ...?blocked=https%3A%2F%2Fexample.com
 * 
 * Query parameter:
 * - Name: "blocked"
 * - Value: Encoded original URL
 * - Displayed on blocked page
 * 
 * @param {string} originalUrl - The URL that was blocked (optional)
 * @returns {string} Full URL to blocked page
 * 
 * @example
 * // Simple redirect
 * const url = getBlockedPageUrl();
 * // chrome-extension://{id}/src/pages/blocked/index.html
 * 
 * @example
 * // With original URL
 * const url = getBlockedPageUrl('https://example.com/bad-page');
 * // chrome-extension://{id}/src/pages/blocked/index.html?blocked=https%3A%2F%2Fexample.com%2Fbad-page
 * 
 * @example
 * // Redirect to blocked page
 * chrome.tabs.update(tabId, { 
 *   url: getBlockedPageUrl(originalUrl) 
 * });
 */
export function getBlockedPageUrl(originalUrl = '') {
  // Get base URL from extension
  const blockedPageUrl = chrome.runtime.getURL(DEFAULTS.PAGES.BLOCKED);
  
  if (originalUrl) {
    // Add original URL as query parameter
    // encodeURIComponent ensures special chars are safe in URL
    return `${blockedPageUrl}?blocked=${encodeURIComponent(originalUrl)}`;
  }
  
  // Return base URL without parameters
  return blockedPageUrl;
}

/**
 * Get redirect URL with fallback
 * 
 * Returns custom redirect URL if set, otherwise default.
 * Ensures we always have a valid redirect target.
 * 
 * Priority:
 * 1. Custom URL (if user configured one)
 * 2. Default URL (fallback)
 * 
 * Use cases:
 * - User wants to redirect to specific site
 * - User wants to go to their homepage
 * - User configures motivational site
 * 
 * Validation:
 * - None here (validation happens in settings)
 * - Assumes customUrl is valid if provided
 * - Fallback ensures we never return empty string
 * 
 * @param {string} customUrl - Custom redirect URL from settings
 * @returns {string} URL to redirect to
 * 
 * @example
 * // User has custom URL set
 * const url = getRedirectUrlWithFallback('https://www.calm.com');
 * // Returns: 'https://www.calm.com'
 * 
 * @example
 * // No custom URL
 * const url = getRedirectUrlWithFallback('');
 * // Returns: 'https://griffinswebservices.com' (default)
 * 
 * @example
 * // Usage in blocking
 * const redirectUrl = getRedirectUrlWithFallback(settings.redirectUrl);
 * chrome.tabs.update(tabId, { url: redirectUrl });
 */
export function getRedirectUrlWithFallback(customUrl) {
  // Use custom URL if provided, otherwise default
  // JavaScript || operator: returns first truthy value
  // Empty string is falsy, so falls back to default
  return customUrl || DEFAULTS.REDIRECT_URL;
}

/**
 * Create page title with extension name
 * 
 * Formats page titles consistently across extension.
 * Includes brand name for recognition in browser tabs.
 * 
 * Format patterns:
 * - With page name: "{Page Name} - {Extension Name}"
 * - Without page name: "{Extension Name}"
 * 
 * Benefits:
 * - Consistent branding
 * - Easy to identify extension pages
 * - Professional appearance
 * - Good for SEO if using web views
 * 
 * @param {string} pageName - Name of the page (optional)
 * @returns {string} Formatted page title
 * 
 * @example
 * // Settings page
 * document.title = createPageTitle('Settings');
 * // "Settings - Wellness Filter"
 * 
 * @example
 * // Popup (no page name)
 * document.title = createPageTitle();
 * // "Wellness Filter"
 * 
 * @example
 * // Blocked page
 * document.title = createPageTitle('Content Blocked');
 * // "Content Blocked - Wellness Filter"
 */
export function createPageTitle(pageName = '') {
  if (pageName) {
    // Include page name with separator
    return `${pageName} - ${BRAND.NAME}`;
  }
  
  // Just extension name
  return BRAND.NAME;
}

/**
 * Get icon URL for specific size
 * 
 * Returns full chrome-extension:// URL to icon file.
 * Handles invalid sizes with fallback to 48px.
 * 
 * Available sizes:
 * - 16px: Favicon, small icons
 * - 48px: Standard extension icon
 * - 128px: Chrome Web Store, large displays
 * 
 * Size selection guidelines:
 * - 16px: Browser toolbar, tabs
 * - 48px: Extension management page, most UIs
 * - 128px: Installation, promotional images
 * 
 * URL structure:
 * - chrome-extension://{extension-id}/icons/icon{size}.png
 * 
 * Fallback behavior:
 * - Invalid size → uses 48px
 * - Missing size → uses 48px
 * - Ensures function always returns valid path
 * 
 * @param {number} size - Icon size (16, 48, or 128)
 * @returns {string} Full URL to icon file
 * 
 * @example
 * // Get standard icon
 * const iconUrl = getIconUrl(48);
 * // chrome-extension://{id}/icons/icon48.png
 * 
 * @example
 * // Use in notification
 * chrome.notifications.create({
 *   type: 'basic',
 *   iconUrl: getIconUrl(48),
 *   title: 'Content Blocked',
 *   message: 'Redirected for your wellness'
 * });
 * 
 * @example
 * // Invalid size falls back to 48
 * const iconUrl = getIconUrl(999);
 * // Returns 48px icon
 */
export function getIconUrl(size = 48) {
  // Get icon path for size, or fallback to 48px
  // DEFAULTS.ICONS[size] might be undefined for invalid sizes
  const iconPath = DEFAULTS.ICONS[size] || DEFAULTS.ICONS[48];
  
  // Convert relative path to full chrome-extension:// URL
  return chrome.runtime.getURL(iconPath);
}

/**
 * Get settings page URL
 * 
 * Returns full URL to extension settings/options page.
 * Used for opening settings from various places.
 * 
 * Common use cases:
 * - "Settings" button in popup
 * - Welcome notification links
 * - First-run experience
 * - Error messages with settings link
 * 
 * Why this exists:
 * - Settings page path might change
 * - Centralized for easy updates
 * - Guarantees correct URL format
 * 
 * Alternative approaches:
 * - chrome.runtime.openOptionsPage() - preferred for opening
 * - This function - needed when you need the URL string
 * 
 * Use chrome.runtime.openOptionsPage() when possible:
 * - Handles focus better
 * - Respects user's tab preferences
 * - More reliable
 * 
 * Use this function when:
 * - Need URL for link href
 * - Creating notifications with URL
 * - Redirecting within content script
 * 
 * @returns {string} Full URL to settings page
 * 
 * @example
 * // Open in new tab
 * chrome.tabs.create({ 
 *   url: getSettingsPageUrl() 
 * });
 * 
 * @example
 * // Use in link (React)
 * <a href={getSettingsPageUrl()}>
 *   Open Settings
 * </a>
 * 
 * @example
 * // Email verification redirect
 * const { error } = await supabase.auth.signUp(email, password, {
 *   emailRedirectTo: getSettingsPageUrl()
 * });
 * 
 * @example
 * // Better alternative (when not needing URL string)
 * chrome.runtime.openOptionsPage();
 */
export function getSettingsPageUrl() {
  // Convert relative path to full URL
  return chrome.runtime.getURL(DEFAULTS.PAGES.SETTINGS);
}