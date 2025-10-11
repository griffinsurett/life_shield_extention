/**
 * Wellness Config
 * 
 * Manages all configuration for content script.
 * Contains settings, selectors, and performance constants.
 * 
 * @class WellnessConfig
 */

import { isExtensionContextValid } from "../utils/chromeApi";
import { createLogger } from "../utils/logger";

const logger = createLogger('WellnessConfig');

export class WellnessConfig {
  constructor() {
    // Core settings (user-configurable)
    this.BLOCKED_WORDS = [];
    this.REDIRECT_URL = "";
    this.SHOW_ALERTS = false;
    this.ENABLED = true;
    this.REPLACEMENT_PHRASES = [];
    
    // Performance settings (HARDCODED - not user-configurable)
    this.SCAN_INTERVAL = 2000;
    this.MUTATION_DEBOUNCE = 200;
    this.MIN_CLEAN_INTERVAL = 500;
    this.EARLY_SCAN_DELAYS = [0, 100, 500, 1000];
    this.INPUT_SCAN_INTERVAL = 5000;
    this.GOOGLE_SETUP_INTERVAL = 100;
    this.YAHOO_CHECK_INTERVAL = 200;
    
    // Feature flags
    this.HIDE_ENTIRE_DROPDOWN = true;

    // CSS Selectors
    this.SELECTORS = {
      /**
       * Google search box selectors
       */
      GOOGLE_SEARCH: [
        'input[name="q"]',
        'textarea[name="q"]',
        'input[type="text"][title*="Search"]',
        'input[aria-label*="Search"]',
        'textarea[aria-label*="Search"]',
        '[role="combobox"][name="q"]',
        'textarea[aria-controls*="Alh6id"]',
        'input[jsname]',
        'textarea[jsname]',
        '.gLFyf',
        'input.gLFyf',
        'textarea.gLFyf',
        'form[role="search"] input',
        'form[role="search"] textarea'
      ],
      
      /**
       * Google autocomplete suggestion selectors
       */
      GOOGLE_SUGGESTION: [
        '.UUbT9',
        '.aajZCb',
        '[role="listbox"]',
        '.sbdd_b',
        '.erkvQe',
        '.mkHrUc',
        '.G43f7e',
        '[jsname]',
        'div[role="presentation"]'
      ],
      
      /**
       * Generic autocomplete suggestion selectors
       */
      SUGGESTION: [
        '[role="option"]',
        '[role="listbox"] li',
        '[role="listbox"] div',
        '.suggestion',
        '[data-suggestion]',
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

      // Update config with loaded values or defaults
      this.BLOCKED_WORDS = result.blockedWords || [];
      this.REDIRECT_URL = result.redirectUrl || "";
      this.SHOW_ALERTS = result.showAlerts || false;
      this.REPLACEMENT_PHRASES = result.replacementPhrases || [];
      this.ENABLED = result.enableFilter !== false;

      logger.info("Settings loaded from storage");
    } catch (error) {
      logger.safeError("Error loading config", error);
    }
  }

  /**
   * Set up listeners for configuration changes
   */
  setupListeners() {
    if (!isExtensionContextValid()) {
      logger.warn("Extension context invalid, skipping listeners");
      return;
    }

    try {
      // Listen for manual reload requests
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "reloadConfig") {
          this.loadConfig();
          logger.info("Config reloaded");
        }
      });

      // Listen for storage changes and update config automatically
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "sync") {
          // Update blocked words
          if (changes.blockedWords) {
            this.BLOCKED_WORDS = changes.blockedWords.newValue || [];
            logger.debug("Blocked words updated");
          }
          
          // Update replacement phrases
          if (changes.replacementPhrases) {
            this.REPLACEMENT_PHRASES = changes.replacementPhrases.newValue || [];
            logger.debug("Replacement phrases updated");
          }
          
          // Update redirect URL
          if (changes.redirectUrl) {
            this.REDIRECT_URL = changes.redirectUrl.newValue || "";
            logger.debug("Redirect URL updated");
          }
          
          // Update show alerts
          if (changes.showAlerts !== undefined) {
            this.SHOW_ALERTS = changes.showAlerts.newValue;
            logger.debug(`Show alerts: ${this.SHOW_ALERTS}`);
          }
          
          // Update enabled state
          if (changes.enableFilter !== undefined) {
            this.ENABLED = changes.enableFilter.newValue;
            if (!changes.enableFilter.newValue) {
              logger.info("Filter disabled");
            } else {
              logger.info("Filter enabled");
            }
          }
          
          logger.debug("Settings updated in real-time");
        }
      });
    } catch (error) {
      logger.safeError("Error setting up listeners", error);
    }
  }
}