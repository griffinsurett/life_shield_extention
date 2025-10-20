/**
 * Settings Service
 *
 * Manages extension settings.
 * Now supports hashed blocked sites.
 *
 * @module background/services/settings
 */

import {
  isExtensionContextValid,
  safeChromeAsync,
} from "../../utils/chromeApi";
import { STORAGE_KEYS } from "../../config";
import { createLogger } from "../../utils/logger";
import { containsHashedWord, containsHashedSite } from "../../utils/hashing";

const logger = createLogger("SettingsService");

// Private state (closure)
let state = {
  blockedWords: [], // Array of hashes
  blockedSites: [], // Array of hashes
  redirectUrl: "",
  showAlerts: false,
  enableFilter: true,
  useCustomUrl: false,
  customMessage: "",
};

/**
 * Initialize settings service
 *
 * @async
 * @returns {Promise<void>}
 */
export async function initSettings() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, using defaults");
    return;
  }

  await loadSettings();
  setupListeners();
  logger.info("Settings service initialized");
}

/**
 * Load settings from storage
 *
 * @async
 * @returns {Promise<void>}
 */
async function loadSettings() {
  if (!isExtensionContextValid()) return;

  try {
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

    state.blockedWords = result.blockedWords || [];
    state.blockedSites = result.blockedSites || [];
    state.redirectUrl = result.redirectUrl || "";
    state.showAlerts = result.showAlerts || false;
    state.enableFilter = result.enableFilter !== false;
    state.useCustomUrl = result.useCustomUrl || false;
    state.customMessage = result.customMessage || "";

    logger.info("Settings loaded", {
      hashedWords: state.blockedWords.length,
      hashedSites: state.blockedSites.length,
      enabled: state.enableFilter,
      useCustomUrl: state.useCustomUrl,
    });
  } catch (error) {
    logger.safeError("Failed to load settings", error);
  }
}

/**
 * Set up storage change listeners
 */
function setupListeners() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "sync") {
        if (changes.blockedWords !== undefined) {
          state.blockedWords = changes.blockedWords.newValue || [];
          logger.debug(`Blocked words updated: ${state.blockedWords.length} hashes`);
        }

        if (changes.blockedSites !== undefined) {
          state.blockedSites = changes.blockedSites.newValue || [];
          logger.debug(`Blocked sites updated: ${state.blockedSites.length} hashes`);
        }

        if (changes.redirectUrl !== undefined) {
          state.redirectUrl = changes.redirectUrl.newValue;
          logger.debug("Redirect URL updated");
        }

        if (changes.showAlerts !== undefined) {
          state.showAlerts = changes.showAlerts.newValue;
          logger.debug(`Show alerts: ${state.showAlerts ? "enabled" : "disabled"}`);
        }

        if (changes.enableFilter !== undefined) {
          state.enableFilter = changes.enableFilter.newValue;
          logger.debug(`Filter: ${state.enableFilter ? "enabled" : "disabled"}`);
        }

        if (changes.useCustomUrl !== undefined) {
          state.useCustomUrl = changes.useCustomUrl.newValue;
          logger.debug("Use custom URL updated");
        }

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
 * Check if text contains blocked words (hashed comparison)
 *
 * @param {string} text - Text to check
 * @returns {Promise<boolean>}
 */
export async function containsBlockedWord(text) {
  if (!text || !state.enableFilter) return false;
  return await containsHashedWord(text, state.blockedWords);
}

/**
 * Check if URL contains blocked sites (hashed comparison)
 *
 * @param {string} url - URL to check
 * @returns {Promise<boolean>}
 */
export async function containsBlockedSite(url) {
  if (!url || !state.enableFilter) return false;
  return await containsHashedSite(url, state.blockedSites);
}

/**
 * Get blocked words (hashes)
 *
 * @returns {string[]}
 */
export function getBlockedWords() {
  return [...state.blockedWords];
}

/**
 * Get blocked sites (hashes)
 *
 * @returns {string[]}
 */
export function getBlockedSites() {
  return [...state.blockedSites];
}

/**
 * Get redirect URL
 *
 * @returns {string}
 */
export function getRedirectUrl() {
  return state.redirectUrl;
}

/**
 * Check if alerts should be shown
 *
 * @returns {boolean}
 */
export function shouldShowAlerts() {
  return state.showAlerts;
}

/**
 * Check if filter is enabled
 *
 * @returns {boolean}
 */
export function isFilterEnabled() {
  return state.enableFilter;
}

/**
 * Check if custom URL should be used
 *
 * @returns {boolean}
 */
export function shouldUseCustomUrl() {
  return state.useCustomUrl;
}

/**
 * Get custom message
 *
 * @returns {string}
 */
export function getCustomMessage() {
  return state.customMessage;
}