/**
 * Builder Utilities
 * 
 * Functions for constructing commonly used values.
 * Eliminates duplicate logic across the codebase.
 * 
 * @module utils/builders
 */

import { BRAND, DEFAULTS } from '../config';

/**
 * Get blocked page URL with optional original URL parameter
 * 
 * @param {string} originalUrl - The URL that was blocked
 * @returns {string} URL to blocked page
 */
export function getBlockedPageUrl(originalUrl = '') {
  const blockedPageUrl = chrome.runtime.getURL(DEFAULTS.PAGES.BLOCKED);
  if (originalUrl) {
    return `${blockedPageUrl}?blocked=${encodeURIComponent(originalUrl)}`;
  }
  return blockedPageUrl;
}

/**
 * Get redirect URL with fallback
 * 
 * @param {string} customUrl - Custom URL if set
 * @returns {string} Redirect URL
 */
export function getRedirectUrlWithFallback(customUrl) {
  return customUrl || DEFAULTS.REDIRECT_URL;
}

/**
 * Create page title with extension name
 * 
 * @param {string} pageName - Name of the page
 * @returns {string} Formatted page title
 */
export function createPageTitle(pageName = '') {
  if (pageName) {
    return `${pageName} - ${BRAND.NAME}`;
  }
  return BRAND.NAME;
}

/**
 * Get icon URL
 * 
 * @param {number} size - Icon size (16, 48, or 128)
 * @returns {string} Icon URL
 */
export function getIconUrl(size = 48) {
  const iconPath = DEFAULTS.ICONS[size] || DEFAULTS.ICONS[48];
  return chrome.runtime.getURL(iconPath);
}

/**
 * Get settings page URL
 * 
 * @returns {string} Settings page URL
 */
export function getSettingsPageUrl() {
  return chrome.runtime.getURL(DEFAULTS.PAGES.SETTINGS);
}