// src/content/config.js
/**
 * Content Script Configuration
 * 
 * Configuration loaded from chrome.storage.sync.
 * Updates automatically when settings change.
 * Now supports hashed blocked words and sites with cache management.
 * 
 * @class WellnessConfig
 */

import { isExtensionContextValid } from '../utils/chromeApi';
import { createLogger } from '../utils/logger';

const logger = createLogger('WellnessConfig');

export class WellnessConfig {
  constructor() {
    // Core settings - now stores hashes
    this.BLOCKED_WORDS = []; // Array of hashed words
    this.REPLACEMENT_PHRASES = [];
    this.REDIRECT_URL = '';
    this.SHOW_ALERTS = false;
    this.ENABLED = true;

    // Performance settings (hardcoded for optimal performance)
    this.MIN_CLEAN_INTERVAL = 100;
    this.MUTATION_DEBOUNCE = 200;
    this.SCAN_INTERVAL = 2000;
    this.INPUT_SCAN_INTERVAL = 3000;
    this.EARLY_SCAN_DELAYS = [100, 500, 1000, 2000];
    
    // Site-specific settings
    this.HIDE_ENTIRE_DROPDOWN = true;
    this.GOOGLE_CHECK_INTERVAL = 500;
    this.YAHOO_CHECK_INTERVAL = 500;

    // Selectors for various elements
    this.SELECTORS = {
      /**
       * Google search suggestion selectors
       */
      GOOGLE_SUGGESTION: [
        '.sbct',
        '.aypbod',
        'li',
        'div[jsname]',
        '.UUbT9',
        '.aajZCb',
        '.erkvQe',
        '.sbdd_b',
        '.mkHrUc',
        '.G43f7e'
      ],
      
      /**
       * Input field selectors
       */
      INPUT: [
        'input:not([data-filter-attached])',
        'textarea:not([data-filter-attached])',
        '[contenteditable="true"]:not([data-filter-attached])',
        '[role="textbox"]:not([data-filter-attached])',
        '[role="searchbox"]:not([data-filter-attached])',
        'input[name="q"]:not([data-filter-attached])',
        'textarea[name="q"]:not([data-filter-attached])',
        'input.gLFyf:not([data-filter-attached])',
        'textarea.gLFyf:not([data-filter-attached])',
        'input[jsname]:not([data-filter-attached])',
        'textarea[jsname]:not([data-filter-attached])'
      ]
    };

    // Load settings from storage
    this.loadConfig();
    
    // Set up real-time update listeners
    this.setupListeners();
  }

  /**
   * Load configuration from chrome.storage.sync
   * Blocked words and sites are already hashed in storage
   * 
   * @async
   * @returns {Promise<void>}
   */
  async loadConfig() {
    if (!isExtensionContextValid()) {
      logger.warn("Extension context invalid, using defaults");
      return;
    }

    try {
      const result = await chrome.storage.sync.get([
        "blockedWords",
        "redirectUrl",
        "showAlerts",
        "replacementPhrases",
        "enableFilter",
      ]);

      // Blocked words are already hashed in storage
      this.BLOCKED_WORDS = result.blockedWords || [];
      this.REDIRECT_URL = result.redirectUrl || "";
      this.SHOW_ALERTS = result.showAlerts || false;
      this.REPLACEMENT_PHRASES = result.replacementPhrases || [];
      this.ENABLED = result.enableFilter !== false;

      logger.info("Configuration loaded:", {
        blockedWords: this.BLOCKED_WORDS.length,
        phrases: this.REPLACEMENT_PHRASES.length,
        enabled: this.ENABLED,
      });
    } catch (error) {
      logger.safeError("Error loading config", error);
    }
  }

  /**
   * Set up storage change listeners with cache clearing
   */
  setupListeners() {
    if (!isExtensionContextValid()) return;

    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          let shouldClearCache = false;

          if (changes.blockedWords) {
            this.BLOCKED_WORDS = changes.blockedWords.newValue || [];
            shouldClearCache = true;
            logger.info(`Blocked words updated: ${this.BLOCKED_WORDS.length} hashes`);
          }

          if (changes.replacementPhrases) {
            this.REPLACEMENT_PHRASES = changes.replacementPhrases.newValue || [];
            logger.info(`Replacement phrases updated: ${this.REPLACEMENT_PHRASES.length}`);
          }

          if (changes.redirectUrl) {
            this.REDIRECT_URL = changes.redirectUrl.newValue || '';
            logger.info('Redirect URL updated');
          }

          if (changes.showAlerts !== undefined) {
            this.SHOW_ALERTS = changes.showAlerts.newValue || false;
            logger.info(`Show alerts: ${this.SHOW_ALERTS}`);
          }

          if (changes.enableFilter !== undefined) {
            this.ENABLED = changes.enableFilter.newValue;
            logger.info(`Filter enabled: ${this.ENABLED}`);
          }

          // Clear caches when blocked words change
          if (shouldClearCache) {
            // Clear hash cache
            import('../utils/hashing.js').then(module => {
              module.clearHashCache();
              logger.info('Hash cache cleared due to settings change');
            }).catch(err => {
              logger.safeError('Failed to clear hash cache', err);
            });

            // Notify page to reload if needed
            logger.info('Configuration updated - caches cleared');
          }
        }
      });

      logger.debug('Storage listeners configured with cache management');
    } catch (error) {
      logger.safeError('Error setting up listeners', error);
    }
  }
}