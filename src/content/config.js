/**
 * Content Script Configuration
 * 
 * Configuration loaded from chrome.storage.sync.
 * Updates automatically when settings change.
 * Now supports hashed blocked words and sites.
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
    this.USE_REPLACEMENT_PHRASES = true; // NEW: Toggle for replacement vs erasure
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
        "useReplacementPhrases",
        "enableFilter",
      ]);

      // Blocked words are already hashed in storage
      this.BLOCKED_WORDS = result.blockedWords || [];
      this.REDIRECT_URL = result.redirectUrl || "";
      this.SHOW_ALERTS = result.showAlerts || false;
      this.REPLACEMENT_PHRASES = result.replacementPhrases || [];
      this.USE_REPLACEMENT_PHRASES = result.useReplacementPhrases !== false; // Default to true
      this.ENABLED = result.enableFilter !== false; // Default to true

      logger.debug("Config loaded successfully");
    } catch (error) {
      logger.safeError("Error loading config", error);
    }
  }

  /**
   * Set up listeners for real-time config updates
   */
  setupListeners() {
    if (!isExtensionContextValid()) return;

    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync") return;

        let configChanged = false;

        if (changes.blockedWords) {
          this.BLOCKED_WORDS = changes.blockedWords.newValue || [];
          configChanged = true;
        }

        if (changes.redirectUrl) {
          this.REDIRECT_URL = changes.redirectUrl.newValue || "";
          configChanged = true;
        }

        if (changes.showAlerts) {
          this.SHOW_ALERTS = changes.showAlerts.newValue || false;
          configChanged = true;
        }

        if (changes.replacementPhrases) {
          this.REPLACEMENT_PHRASES = changes.replacementPhrases.newValue || [];
          configChanged = true;
        }

        if (changes.useReplacementPhrases) {
          this.USE_REPLACEMENT_PHRASES = changes.useReplacementPhrases.newValue !== false;
          configChanged = true;
        }

        if (changes.enableFilter) {
          this.ENABLED = changes.enableFilter.newValue !== false;
          configChanged = true;
        }

        if (configChanged) {
          logger.debug("Config updated from storage changes");
        }
      });
    } catch (error) {
      logger.safeError("Error setting up storage listeners", error);
    }
  }
}