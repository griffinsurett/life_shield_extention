/**
 * Settings Service
 * 
 * Manages extension settings.
 * Functional module with closure for state.
 * 
 * @module background/services/settings
 */

import { isExtensionContextValid, safeChromeAsync } from '../../utils/chrome';
import { STORAGE_KEYS } from '../../utils/constants';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SettingsService');

// Private state (closure)
let state = {
  blockedWords: [],
  blockedSites: [],
  redirectUrl: '',
  showAlerts: false,
  enableFilter: true,
  useCustomUrl: false,
  customMessage: '',
};

/**
 * Initialize settings service
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function initSettings() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, using defaults');
    return;
  }

  await loadSettings();
  setupListeners();
  logger.info('Settings service initialized');
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
      () => chrome.storage.sync.get([
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
    state.redirectUrl = result.redirectUrl || '';
    state.showAlerts = result.showAlerts || false;
    state.enableFilter = result.enableFilter !== false;
    state.useCustomUrl = result.useCustomUrl || false;
    state.customMessage = result.customMessage || '';

    logger.info('Settings loaded', {
      words: state.blockedWords.length,
      sites: state.blockedSites.length,
      enabled: state.enableFilter,
      useCustomUrl: state.useCustomUrl
    });
  } catch (error) {
    logger.safeError('Failed to load settings', error);
  }
}

/**
 * Set up storage change listeners
 */
function setupListeners() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping listeners');
    return;
  }

  try {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (!isExtensionContextValid()) return;

      if (namespace === 'sync') {
        if (changes.blockedWords) {
          state.blockedWords = changes.blockedWords.newValue || [];
          logger.debug('Blocked words updated');
        }
        
        if (changes.blockedSites) {
          state.blockedSites = changes.blockedSites.newValue || [];
          logger.debug('Blocked sites updated');
        }
        
        if (changes.redirectUrl) {
          state.redirectUrl = changes.redirectUrl.newValue || '';
          logger.debug('Redirect URL updated');
        }
        
        if (changes.showAlerts !== undefined) {
          state.showAlerts = changes.showAlerts.newValue;
          logger.debug('Show alerts updated');
        }

        if (changes.enableFilter !== undefined) {
          state.enableFilter = changes.enableFilter.newValue;
          logger.info(`Filter ${state.enableFilter ? 'enabled' : 'disabled'}`);
        }
        
        if (changes.useCustomUrl !== undefined) {
          state.useCustomUrl = changes.useCustomUrl.newValue;
          logger.debug('Use custom URL updated');
        }
        
        if (changes.customMessage !== undefined) {
          state.customMessage = changes.customMessage.newValue;
          logger.debug('Custom message updated');
        }
      }
    });
  } catch (error) {
    logger.safeError('Failed to setup listeners', error);
  }
}

/**
 * Check if text contains blocked words
 * 
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function containsBlockedWord(text) {
  if (!text || !state.enableFilter) return false;
  const lower = text.toLowerCase();
  return state.blockedWords.some(word => lower.includes(word.toLowerCase()));
}

/**
 * Check if URL contains blocked sites
 * 
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function containsBlockedSite(url) {
  if (!url || !state.enableFilter) return false;
  const lower = url.toLowerCase();
  return state.blockedSites.some(site => lower.includes(site.toLowerCase()));
}

/**
 * Get blocked words
 * 
 * @returns {string[]}
 */
export function getBlockedWords() {
  return [...state.blockedWords];
}

/**
 * Get blocked sites
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