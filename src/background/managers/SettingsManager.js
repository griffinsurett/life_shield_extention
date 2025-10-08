/**
 * Settings Manager
 * 
 * Manages extension settings and provides access to configuration.
 * Acts as a centralized settings store for the background script.
 * 
 * Settings managed:
 * - blockedWords: Array of words to block
 * - blockedSites: Array of sites to block
 * - redirectUrl: Where to redirect blocked content
 * - showAlerts: Whether to show notifications
 * 
 * Features:
 * - Loads settings from chrome.storage.sync
 * - Real-time updates when settings change
 * - Provides helper methods for checking blocked content
 * - Context validation for all operations
 * 
 * @class SettingsManager
 */

import { STORAGE_KEYS } from '../../utils/constants';

export class SettingsManager {
  constructor() {
    // Initialize settings with defaults
    this.blockedWords = [];
    this.blockedSites = [];
    this.redirectUrl = '';
    this.showAlerts = false;
    
    this.init();
  }

  /**
   * Check if extension context is still valid
   * 
   * @returns {boolean} True if context is valid
   */
  isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Initialize settings manager
   * Loads settings and sets up listeners
   * 
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.isContextValid()) {
      console.log('[Settings Manager] Extension context invalid, using defaults');
      return;
    }

    await this.loadSettings();
    this.setupListeners();
  }

  /**
   * Load settings from chrome.storage.sync
   * Updates internal state with stored values
   * 
   * @async
   * @returns {Promise<void>}
   */
  async loadSettings() {
    if (!this.isContextValid()) return;

    try {
      const result = await chrome.storage.sync.get([
        STORAGE_KEYS.BLOCKED_WORDS,
        STORAGE_KEYS.BLOCKED_SITES,
        STORAGE_KEYS.REDIRECT_URL,
        STORAGE_KEYS.SHOW_ALERTS
      ]);

      this.blockedWords = result.blockedWords || [];
      this.blockedSites = result.blockedSites || [];
      this.redirectUrl = result.redirectUrl || '';
      this.showAlerts = result.showAlerts || false;

      console.log('[Settings Manager] Settings loaded:', {
        blockedWords: this.blockedWords,
        blockedSites: this.blockedSites,
        redirectUrl: this.redirectUrl,
        showAlerts: this.showAlerts
      });
    } catch (error) {
      console.log('[Settings Manager] Error loading settings:', error);
    }
  }

  /**
   * Set up listeners for settings changes
   * Updates internal state when storage changes
   */
  setupListeners() {
    if (!this.isContextValid()) {
      console.log('[Settings Manager] Extension context invalid, skipping listeners');
      return;
    }

    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!this.isContextValid()) return;

        if (namespace === 'sync') {
          // Update blocked words
          if (changes.blockedWords) {
            this.blockedWords = changes.blockedWords.newValue || [];
            console.log('[Settings Manager] Blocked words updated:', this.blockedWords);
          }
          
          // Update blocked sites
          if (changes.blockedSites) {
            this.blockedSites = changes.blockedSites.newValue || [];
            console.log('[Settings Manager] Blocked sites updated:', this.blockedSites);
          }
          
          // Update redirect URL
          if (changes.redirectUrl) {
            this.redirectUrl = changes.redirectUrl.newValue || '';
            console.log('[Settings Manager] Redirect URL updated:', this.redirectUrl);
          }
          
          // Update show alerts
          if (changes.showAlerts !== undefined) {
            this.showAlerts = changes.showAlerts.newValue;
            console.log('[Settings Manager] Show alerts updated:', this.showAlerts);
          }
        }
      });
    } catch (error) {
      console.log('[Settings Manager] Error setting up listeners:', error);
    }
  }

  /**
   * Check if text contains any blocked words
   * Case-insensitive search
   * 
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains a blocked word
   */
  containsBlockedWord(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.blockedWords.some(word => lower.includes(word.toLowerCase()));
  }

  /**
   * Check if URL contains any blocked sites
   * Case-insensitive search
   * 
   * @param {string} url - URL to check
   * @returns {boolean} True if URL contains a blocked site
   */
  containsBlockedSite(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return this.blockedSites.some(site => lower.includes(site.toLowerCase()));
  }

  /**
   * Get array of blocked words
   * 
   * @returns {string[]} Array of blocked words
   */
  getBlockedWords() {
    return this.blockedWords;
  }

  /**
   * Get array of blocked sites
   * 
   * @returns {string[]} Array of blocked sites
   */
  getBlockedSites() {
    return this.blockedSites;
  }

  /**
   * Get redirect URL
   * 
   * @returns {string} Redirect URL
   */
  getRedirectUrl() {
    return this.redirectUrl;
  }

  /**
   * Check if alerts should be shown
   * 
   * @returns {boolean} True if alerts are enabled
   */
  shouldShowAlerts() {
    return this.showAlerts;
  }
}