/**
 * Settings Service
 *
 * Central settings management with in-memory caching.
 * All settings access should go through this service.
 * 
 * Architecture:
 * - Settings stored in chrome.storage.sync (cross-device sync)
 * - Cached in memory for fast access
 * - Real-time updates via storage.onChanged
 * 
 * Settings managed:
 * - blockedWords: Array of words to filter
 * - blockedSites: Array of sites to block
 * - redirectUrl: Where to redirect blocked sites
 * - showAlerts: Whether to show notifications
 * - enableFilter: Master on/off switch
 * - useCustomUrl: Use custom redirect vs built-in page
 * - customMessage: Message shown on blocked page
 * 
 * Why closure pattern?
 * - Private state (not exposed globally)
 * - Fast access (no storage calls needed)
 * - Consistent API for all services
 * 
 * @module background/services/settings
 */

import {
  isExtensionContextValid,
  safeChromeAsync,
} from "../../utils/chromeApi";
import { STORAGE_KEYS } from "../../config";
import { createLogger } from "../../utils/logger";

const logger = createLogger("SettingsService");

// Private state (closure)
// This is the in-memory cache of all settings
let state = {
  blockedWords: [],        // Words to filter from content
  blockedSites: [],        // Sites to block completely
  redirectUrl: "",         // Custom redirect URL
  showAlerts: false,       // Show notifications?
  enableFilter: true,      // Master on/off switch
  useCustomUrl: false,     // Use custom URL vs blocked page
  customMessage: "",       // Custom message for blocked page
};

/**
 * Initialize settings service
 * 
 * Loads all settings from storage into memory.
 * Sets up listeners for real-time updates.
 * 
 * Must be called before any other settings functions.
 * Called from background/index.js on startup.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function initSettings() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, using defaults");
    return;
  }

  // Load from storage into memory
  await loadSettings();
  
  // Set up real-time update listeners
  setupListeners();
  
  logger.info("Settings service initialized");
}

/**
 * Load settings from storage
 * 
 * Fetches all settings from chrome.storage.sync.
 * Updates the in-memory state object.
 * 
 * Uses safeChromeAsync to handle errors gracefully.
 * Falls back to defaults if storage read fails.
 *
 * @async
 * @returns {Promise<void>}
 */
async function loadSettings() {
  if (!isExtensionContextValid()) return;

  try {
    // Fetch all settings keys from sync storage
    const result = await safeChromeAsync(
      () =>
        chrome.storage.sync.get([
          STORAGE_KEYS.BLOCKED_WORDS,
          STORAGE_KEYS.BLOCKED_SITES,
          STORAGE_KEYS.REDIRECT_URL,
          STORAGE_KEYS.SHOW_ALERTS,
          STORAGE_KEYS.ENABLE_FILTER,
          STORAGE_KEYS.USE_CUSTOM_URL,
          STORAGE_KEYS.CUSTOM_MESSAGE,
        ]),
      {}
    );

    // Update in-memory state with storage values or defaults
    state.blockedWords = result.blockedWords || [];
    state.blockedSites = result.blockedSites || [];
    state.redirectUrl = result.redirectUrl || "";
    state.showAlerts = result.showAlerts || false;
    state.enableFilter = result.enableFilter !== false; // Default to true
    state.useCustomUrl = result.useCustomUrl || false;
    state.customMessage = result.customMessage || "";

    logger.info("Settings loaded", {
      words: state.blockedWords.length,
      sites: state.blockedSites.length,
      enabled: state.enableFilter,
      useCustomUrl: state.useCustomUrl,
    });
  } catch (error) {
    logger.safeError("Failed to load settings", error);
  }
}

/**
 * Set up storage change listeners
 * 
 * Listens for chrome.storage.sync changes.
 * Automatically updates in-memory cache when settings change.
 * 
 * This keeps all services in sync without polling storage.
 * Changes from UI instantly propagate to background services.
 * 
 * @returns {void}
 */
function setupListeners() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionContextValid()) return;

      // Only process sync storage changes (settings are in sync)
      if (namespace === "sync") {
        // Update blocked words
        if (changes.blockedWords) {
          state.blockedWords = changes.blockedWords.newValue || [];
          logger.debug("Blocked words updated");
        }

        // Update blocked sites
        if (changes.blockedSites) {
          state.blockedSites = changes.blockedSites.newValue || [];
          logger.debug("Blocked sites updated");
        }

        // Update redirect URL
        if (changes.redirectUrl) {
          state.redirectUrl = changes.redirectUrl.newValue || "";
          logger.debug("Redirect URL updated");
        }

        // Update show alerts
        if (changes.showAlerts !== undefined) {
          state.showAlerts = changes.showAlerts.newValue;
          logger.debug("Show alerts updated");
        }

        // Update enabled state
        if (changes.enableFilter !== undefined) {
          state.enableFilter = changes.enableFilter.newValue;
          logger.info(`Filter ${state.enableFilter ? "enabled" : "disabled"}`);
        }

        // Update use custom URL
        if (changes.useCustomUrl !== undefined) {
          state.useCustomUrl = changes.useCustomUrl.newValue;
          logger.debug("Use custom URL updated");
        }

        // Update custom message
        if (changes.customMessage !== undefined) {
          state.customMessage = changes.customMessage.newValue;
          logger.debug("Custom message updated");
        }
      }
    });
  } catch (error) {
    logger.safeError("Failed to setup listeners", error);
  }
}

/**
 * Check if text contains blocked words
 * 
 * Fast check using in-memory array.
 * Used by content script and navigation service.
 * 
 * Case-insensitive comparison.
 * Checks if any blocked word is substring of text.
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if text contains any blocked word
 * 
 * @example
 * containsBlockedWord("This is bad") // true if "bad" is blocked
 * containsBlockedWord("This is good") // false
 */
export function containsBlockedWord(text) {
  if (!text || !state.enableFilter) return false;
  
  const lower = text.toLowerCase();
  return state.blockedWords.some((word) => lower.includes(word.toLowerCase()));
}

/**
 * Check if URL contains blocked sites
 * 
 * Fast check using in-memory array.
 * Used by blocking service and navigation service.
 * 
 * Case-insensitive comparison.
 * Checks if any blocked site is substring of URL.
 *
 * @param {string} url - URL to check
 * @returns {boolean} True if URL contains any blocked site
 * 
 * @example
 * containsBlockedSite("https://example.com") // true if "example.com" blocked
 * containsBlockedSite("https://safe.com") // false
 */
export function containsBlockedSite(url) {
  if (!url || !state.enableFilter) return false;
  
  const lower = url.toLowerCase();
  return state.blockedSites.some((site) => lower.includes(site.toLowerCase()));
}

/**
 * Get blocked words
 * 
 * Returns a copy of the blocked words array.
 * Copy prevents external modification of internal state.
 *
 * @returns {string[]} Array of blocked words
 */
export function getBlockedWords() {
  return [...state.blockedWords];
}

/**
 * Get blocked sites
 * 
 * Returns a copy of the blocked sites array.
 * Copy prevents external modification of internal state.
 *
 * @returns {string[]} Array of blocked sites
 */
export function getBlockedSites() {
  return [...state.blockedSites];
}

/**
 * Get redirect URL
 * 
 * Returns the custom redirect URL if set.
 * Empty string if not using custom URL.
 *
 * @returns {string} Custom redirect URL or empty string
 */
export function getRedirectUrl() {
  return state.redirectUrl;
}

/**
 * Check if alerts should be shown
 * 
 * Used by notification service to determine if notifications should display.
 * Also affects badge visibility (see badge service).
 *
 * @returns {boolean} True if alerts enabled
 */
export function shouldShowAlerts() {
  return state.showAlerts;
}

/**
 * Check if filter is enabled
 * 
 * Master on/off switch for entire extension.
 * When false, no filtering, blocking, or interception occurs.
 * 
 * This is the FIRST check in all services before doing any work.
 *
 * @returns {boolean} True if filter enabled
 */
export function isFilterEnabled() {
  return state.enableFilter;
}

/**
 * Check if custom URL should be used
 * 
 * Determines redirect behavior:
 * - true: Redirect to custom URL
 * - false: Redirect to built-in blocked page
 *
 * @returns {boolean} True if custom URL should be used
 */
export function shouldUseCustomUrl() {
  return state.useCustomUrl;
}

/**
 * Get custom message
 * 
 * Message displayed on built-in blocked page.
 * Only used when useCustomUrl is false.
 *
 * @returns {string} Custom message or empty string
 */
export function getCustomMessage() {
  return state.customMessage;
}