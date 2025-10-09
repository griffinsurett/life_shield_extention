/**
 * Chrome Extension Utilities
 * 
 * Centralized utilities for Chrome extension APIs.
 * Provides safe wrappers and validation for extension context.
 * Now with lazy logger initialization.
 * 
 * @module utils/chrome
 */

import { createLogger } from './logger';

// Lazy-initialize logger to avoid issues during test setup
let logger = null;
function getLogger() {
  if (!logger) {
    logger = createLogger('ChromeAPI');
  }
  return logger;
}

/**
 * Check if Chrome extension context is still valid
 * Returns false if extension was reloaded/updated
 * 
 * @returns {boolean} True if extension context is valid
 */
export function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

/**
 * Safe wrapper for chrome API calls
 * Automatically checks context validity before executing
 * 
 * @param {Function} fn - Function that uses chrome APIs
 * @param {*} fallbackValue - Value to return if context is invalid
 * @returns {*} Result of fn or fallbackValue
 * 
 * @example
 * const tabs = safeChrome(() => chrome.tabs.query({}), []);
 */
export function safeChrome(fn, fallbackValue = null) {
  if (!isExtensionContextValid()) {
    return fallbackValue;
  }
  
  try {
    return fn();
  } catch (error) {
    getLogger().safeError('Chrome API call failed', error);
    return fallbackValue;
  }
}

/**
 * Safe promise wrapper for chrome API calls
 * For APIs that return promises
 * 
 * @param {Function} fn - Async function that uses chrome APIs
 * @param {*} fallbackValue - Value to return if context is invalid
 * @returns {Promise<*>} Result of fn or fallbackValue
 * 
 * @example
 * const result = await safeChromeAsync(
 *   () => chrome.storage.sync.get(['key']),
 *   {}
 * );
 */
export async function safeChromeAsync(fn, fallbackValue = null) {
  if (!isExtensionContextValid()) {
    return fallbackValue;
  }
  
  try {
    return await fn();
  } catch (error) {
    getLogger().safeError('Chrome API async call failed', error);
    return fallbackValue;
  }
}

/**
 * Check if error is due to extension context invalidation
 * Useful for determining if error should be suppressed
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is context invalidation
 */
export function isContextInvalidationError(error) {
  const message = error?.message || String(error);
  return (
    message.includes('Extension context invalidated') ||
    message.includes('Cannot access') ||
    message.includes('Extension manifest') ||
    message.includes('chrome-extension://')
  );
}

/**
 * Send message to background script safely
 * Suppresses errors if extension context is invalid
 * 
 * @param {Object} message - Message to send
 * @returns {Promise<*>} Response from background script or null
 */
export async function sendMessageToBackground(message) {
  return safeChromeAsync(
    () => chrome.runtime.sendMessage(message),
    null
  );
}

/**
 * Get extension resource URL safely
 * 
 * @param {string} path - Resource path
 * @returns {string|null} Full URL or null if invalid
 */
export function getResourceURL(path) {
  return safeChrome(
    () => chrome.runtime.getURL(path),
    null
  );
}