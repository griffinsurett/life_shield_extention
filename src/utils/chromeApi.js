/**
 * Chrome Extension API Utilities
 * 
 * Safe wrappers for Chrome extension APIs with error handling.
 * Protects against extension context invalidation.
 * 
 * Why this module exists:
 * 
 * Problem: Extension context can become invalid
 * - User reloads extension
 * - Extension auto-updates
 * - Developer mode refresh
 * - Content script outlives extension reload
 * 
 * When invalid:
 * - chrome.runtime.id becomes undefined
 * - API calls throw errors
 * - Extension crashes
 * 
 * Solution: Check validity before API calls
 * - Verify chrome.runtime.id exists
 * - Catch and suppress context errors
 * - Return fallback values
 * - Log errors appropriately
 * 
 * Core functions:
 * - isExtensionContextValid(): Check if context valid
 * - safeChrome(): Wrap synchronous API calls
 * - safeChromeAsync(): Wrap async API calls
 * - isContextInvalidationError(): Identify context errors
 * 
 * @module utils/chromeApi
 */

import { createLogger } from './logger';

/**
 * Lazy-initialize logger to avoid circular dependencies
 * 
 * Problem: Logger might import chromeApi utilities
 * Solution: Create logger only when needed
 * 
 * Pattern:
 * - logger variable starts null
 * - getLogger() creates on first use
 * - Subsequent calls return cached instance
 */
let logger = null;

/**
 * Get or create logger instance
 * 
 * Lazy initialization pattern prevents issues during:
 * - Module loading
 * - Test setup
 * - Circular dependencies
 * 
 * @returns {Object} Logger instance
 * @private
 */
function getLogger() {
  if (!logger) {
    logger = createLogger('ChromeAPI');
  }
  return logger;
}

/**
 * Check if Chrome extension context is still valid
 * 
 * Context becomes invalid when:
 * - Extension reloaded by developer
 * - Extension auto-updated
 * - User disabled/removed extension
 * - Service worker terminated
 * 
 * Validation checks:
 * 1. chrome object exists
 * 2. chrome.runtime exists
 * 3. chrome.runtime.id has value
 * 
 * Why chrome.runtime.id:
 * - Always defined in valid context
 * - Becomes undefined when context invalid
 * - Most reliable indicator
 * - Simple to check
 * 
 * Use before every Chrome API call for safety.
 * 
 * @returns {boolean} True if extension context is valid
 * 
 * @example
 * if (isExtensionContextValid()) {
 *   // Safe to use Chrome APIs
 *   chrome.storage.sync.get(['key'], callback);
 * } else {
 *   // Context invalid - don't call APIs
 *   console.log('Extension context invalidated');
 * }
 * 
 * @example
 * // In content script that might outlive extension
 * function updateBadge() {
 *   if (!isExtensionContextValid()) {
 *     // Extension was reloaded, stop trying
 *     clearInterval(updateInterval);
 *     return;
 *   }
 *   chrome.runtime.sendMessage({ action: 'updateBadge' });
 * }
 */
export function isExtensionContextValid() {
  try {
    // Check all three conditions
    // Double-bang (!!) converts to boolean
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    // Any error means context is invalid
    return false;
  }
}

/**
 * Safe wrapper for synchronous Chrome API calls
 * 
 * Provides automatic:
 * - Context validation before call
 * - Error catching and logging
 * - Fallback value on error
 * 
 * Use for:
 * - chrome.tabs.query()
 * - chrome.storage.sync.get()
 * - chrome.runtime.getURL()
 * - Any sync Chrome API
 * 
 * Process:
 * 1. Check context validity
 * 2. If invalid, return fallback immediately
 * 3. If valid, execute function
 * 4. Catch any errors
 * 5. Log non-context errors
 * 6. Return result or fallback
 * 
 * @param {Function} fn - Function that uses chrome APIs
 * @param {*} fallbackValue - Value to return if context invalid or error
 * @returns {*} Result of fn or fallbackValue
 * 
 * @example
 * // Safe storage get
 * const result = safeChrome(
 *   () => chrome.storage.sync.get(['blockedWords']),
 *   { blockedWords: [] } // Fallback
 * );
 * 
 * @example
 * // Safe URL get
 * const url = safeChrome(
 *   () => chrome.runtime.getURL('icons/icon48.png'),
 *   null // Fallback
 * );
 * 
 * @example
 * // Safe tabs query
 * const tabs = safeChrome(
 *   () => chrome.tabs.query({ active: true }),
 *   [] // Empty array fallback
 * );
 */
export function safeChrome(fn, fallbackValue = null) {
  // First check if context is valid
  if (!isExtensionContextValid()) {
    return fallbackValue;
  }
  
  try {
    // Execute the Chrome API call
    return fn();
  } catch (error) {
    // Log error (safeError handles context errors specially)
    getLogger().safeError('Chrome API call failed', error);
    return fallbackValue;
  }
}

/**
 * Safe promise wrapper for async Chrome API calls
 * 
 * For APIs that return promises.
 * Provides same safety as safeChrome but for async functions.
 * 
 * Use for:
 * - chrome.storage promises
 * - chrome.tabs.create()
 * - chrome.notifications.create()
 * - Any async Chrome API
 * 
 * Process:
 * 1. Check context validity
 * 2. If invalid, return fallback in resolved Promise
 * 3. If valid, await function execution
 * 4. Catch any errors
 * 5. Log non-context errors
 * 6. Return result or fallback
 * 
 * @param {Function} fn - Async function that uses chrome APIs
 * @param {*} fallbackValue - Value to return if context invalid or error
 * @returns {Promise<*>} Result of fn or fallbackValue
 * 
 * @example
 * // Safe async storage get
 * const result = await safeChromeAsync(
 *   () => chrome.storage.sync.get(['key']),
 *   {}
 * );
 * 
 * @example
 * // Safe tab creation
 * const tab = await safeChromeAsync(
 *   () => chrome.tabs.create({ url: 'https://example.com' }),
 *   null
 * );
 * 
 * @example
 * // Safe notification
 * await safeChromeAsync(
 *   () => chrome.notifications.create({
 *     type: 'basic',
 *     title: 'Hello',
 *     message: 'World'
 *   }),
 *   null
 * );
 */
export async function safeChromeAsync(fn, fallbackValue = null) {
  // Check context validity first
  if (!isExtensionContextValid()) {
    return fallbackValue;
  }
  
  try {
    // Await the async Chrome API call
    return await fn();
  } catch (error) {
    // Log error appropriately
    getLogger().safeError('Chrome API async call failed', error);
    return fallbackValue;
  }
}

/**
 * Check if error is due to extension context invalidation
 * 
 * Useful for:
 * - Determining if error should be suppressed
 * - Special handling of context errors
 * - Avoiding error spam in logs
 * 
 * Context invalidation error messages:
 * - "Extension context invalidated"
 * - "Cannot access chrome-extension://"
 * - "Extension manifest must request permission"
 * - Contains "chrome-extension://" URL
 * 
 * Why check:
 * - Context errors are expected during development
 * - Not actionable by code (user needs to reload page)
 * - Shouldn't spam error logs
 * - Different handling than real errors
 * 
 * Use cases:
 * - Silencing expected errors
 * - Triggering context refresh
 * - User notification
 * - Cleanup operations
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is context invalidation
 * 
 * @example
 * try {
 *   chrome.runtime.sendMessage({ action: 'test' });
 * } catch (error) {
 *   if (isContextInvalidationError(error)) {
 *     // Expected - extension was reloaded
 *     console.log('Extension context invalidated, please reload page');
 *   } else {
 *     // Unexpected error - log it
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * 
 * @example
 * // In global error handler
 * window.addEventListener('error', (event) => {
 *   if (isContextInvalidationError(event.error)) {
 *     // Suppress context errors
 *     event.preventDefault();
 *     return;
 *   }
 *   // Handle other errors normally
 * });
 */
export function isContextInvalidationError(error) {
  // Extract error message
  const message = error?.message || String(error);
  
  // Check for known context invalidation patterns
  return (
    message.includes('Extension context invalidated') ||
    message.includes('Cannot access') ||
    message.includes('Extension manifest') ||
    message.includes('chrome-extension://')
  );
}

/**
 * Send message to background script safely
 * 
 * Convenience wrapper for chrome.runtime.sendMessage.
 * Handles context validation and errors automatically.
 * 
 * Use when:
 * - Sending messages from content script
 * - Notifying background of events
 * - Requesting background operations
 * 
 * Benefits:
 * - No need to check context manually
 * - Automatic error suppression
 * - Returns null on error (no throw)
 * - Cleaner code
 * 
 * @param {Object} message - Message object to send
 * @returns {Promise<*>} Response from background script or null
 * 
 * @example
 * // Update badge from content script
 * const response = await sendMessageToBackground({
 *   action: 'updateBadge',
 *   count: 5
 * });
 * 
 * @example
 * // Notify of blocked content
 * await sendMessageToBackground({
 *   action: 'contentFiltered',
 *   url: window.location.href
 * });
 * 
 * @example
 * // Request data from background
 * const settings = await sendMessageToBackground({
 *   action: 'getSettings'
 * });
 * if (settings) {
 *   // Settings received successfully
 *   updateUI(settings);
 * }
 */
export async function sendMessageToBackground(message) {
  // Use safeChromeAsync with null fallback
  return safeChromeAsync(
    () => chrome.runtime.sendMessage(message),
    null
  );
}

/**
 * Get extension resource URL safely
 * 
 * Converts relative path to full chrome-extension:// URL.
 * Safe wrapper for chrome.runtime.getURL().
 * 
 * Use for:
 * - Getting icon URLs
 * - Getting page URLs
 * - Getting asset URLs
 * 
 * URL format:
 * - Input: 'icons/icon48.png'
 * - Output: 'chrome-extension://{id}/icons/icon48.png'
 * 
 * @param {string} path - Relative path to resource
 * @returns {string|null} Full URL or null if invalid context
 * 
 * @example
 * // Get icon URL
 * const iconUrl = getResourceURL('icons/icon48.png');
 * // chrome-extension://{id}/icons/icon48.png
 * 
 * @example
 * // Get page URL
 * const settingsUrl = getResourceURL('pages/settings/index.html');
 * 
 * @example
 * // Use in image tag
 * <img src={getResourceURL('assets/logo.png')} />
 */
export function getResourceURL(path) {
  // Use safeChrome with null fallback
  return safeChrome(
    () => chrome.runtime.getURL(path),
    null
  );
}