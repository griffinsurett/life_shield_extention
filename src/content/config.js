/**
 * Wellness Config
 * 
 * Central configuration management for content script.
 * Contains all settings, selectors, and performance constants.
 * 
 * Architecture:
 * - User-configurable settings (loaded from storage)
 * - Hardcoded performance constants (not user-configurable)
 * - CSS selectors for site-specific targeting
 * - Real-time updates via storage listeners
 * 
 * Why separate from background config?
 * - Content scripts run in page context
 * - Different performance requirements
 * - Need page-specific selectors
 * - Independent lifecycle
 * 
 * @class WellnessConfig
 */

import { isExtensionContextValid } from "../utils/chromeApi";
import { createLogger } from "../utils/logger";

const logger = createLogger('WellnessConfig');

export class WellnessConfig {
  constructor() {
    // ===== USER-CONFIGURABLE SETTINGS =====
    // These are loaded from chrome.storage and can be changed in settings UI
    
    this.BLOCKED_WORDS = [];        // Words to filter from content
    this.REDIRECT_URL = "";          // Where to redirect blocked sites
    this.SHOW_ALERTS = false;        // Show notifications?
    this.ENABLED = true;             // Master on/off switch
    this.REPLACEMENT_PHRASES = [];   // Phrases to replace blocked words
    
    // ===== PERFORMANCE CONSTANTS (HARDCODED) =====
    // These control how often content script scans/processes
    // NOT user-configurable for consistency and performance
    
    this.SCAN_INTERVAL = 2000;           // Full page scan every 2 seconds
    this.MUTATION_DEBOUNCE = 200;        // Wait 200ms after mutations before processing
    this.MIN_CLEAN_INTERVAL = 500;       // Minimum time between cleaning operations
    this.EARLY_SCAN_DELAYS = [0, 100, 500, 1000]; // Early scans for dynamic content
    this.INPUT_SCAN_INTERVAL = 5000;     // Scan for new inputs every 5 seconds
    this.GOOGLE_SETUP_INTERVAL = 100;    // Google-specific setup check interval
    this.YAHOO_CHECK_INTERVAL = 200;     // Yahoo-specific check interval
    
    // ===== FEATURE FLAGS =====
    this.HIDE_ENTIRE_DROPDOWN = true;    // Hide entire dropdown vs individual suggestions

    // ===== CSS SELECTORS =====
    // Site-specific selectors for targeting elements
    this.SELECTORS = {
      /**
       * Google search box selectors
       * 
       * Google uses many different selectors across their properties:
       * - Regular search: input[name="q"]
       * - New tab page: textarea with special classes
       * - Image search: different structure
       * - Maps: yet another structure
       * 
       * Must be comprehensive to catch all variants.
       */
      GOOGLE_SEARCH: [
        'input[name="q"]',                    // Standard search input
        'textarea[name="q"]',                 // Some pages use textarea
        'input[type="text"][title*="Search"]', // Search by title attribute
        'input[aria-label*="Search"]',        // Search by aria-label
        'textarea[aria-label*="Search"]',     // Textarea variant
        '[role="combobox"][name="q"]',        // Combobox role
        'textarea[aria-controls*="Alh6id"]',  // Google-specific ID pattern
        'input[jsname]',                      // Google's internal attribute
        'textarea[jsname]',                   // Textarea with jsname
        '.gLFyf',                             // Google's search class
        'input.gLFyf',                        // Input with class
        'textarea.gLFyf',                     // Textarea with class
        'form[role="search"] input',          // Input within search form
        'form[role="search"] textarea'        // Textarea within search form
      ],
      
      /**
       * Google autocomplete suggestion selectors
       * 
       * Google's autocomplete uses dynamic classes and IDs.
       * These selectors catch the suggestion dropdown elements.
       */
      GOOGLE_SUGGESTION: [
        '.UUbT9',         // Main suggestion item class
        '.aajZCb',        // Alternative suggestion class
        '[role="listbox"]', // Listbox role for dropdown
        '.sbdd_b',        // Suggestion dropdown class
        '.erkvQe',        // Another suggestion class
        '.mkHrUc',        // Yet another variant
        '.G43f7e',        // Additional variant
        '[jsname]',       // Google's internal markers
        'div[role="presentation"]' // Presentation role
      ],
      
      /**
       * Generic autocomplete suggestion selectors
       * 
       * Used for non-Google sites (Bing, Yahoo, DuckDuckGo, etc.)
       * More generic patterns that work across different search engines.
       */
      SUGGESTION: [
        '[role="option"]',          // Standard option role
        '[role="listbox"] li',      // List items in listbox
        '[role="listbox"] div',     // Divs in listbox
        '.suggestion',              // Common suggestion class
        '[data-suggestion]',        // Data attribute
        '.sbct',                    // Bing suggestion class
        '.aypbod',                  // Another Bing class
        'li',                       // Generic list items
        'div[jsname]',              // Google-style markers
        '.UUbT9',                   // Include Google classes here too
        '.aajZCb',
        '.erkvQe',
        '.sbdd_b',
        '.mkHrUc',
        '.G43f7e'
      ],
      
      /**
       * Input field selectors
       * 
       * Selects all types of text inputs for filtering.
       * Uses :not([data-filter-attached]) to avoid reprocessing.
       * 
       * This marker prevents attaching listeners multiple times.
       */
      INPUT: [
        'input:not([data-filter-attached])',                    // Text inputs
        'textarea:not([data-filter-attached])',                 // Textareas
        '[contenteditable="true"]:not([data-filter-attached])', // Contenteditable divs
        '[role="textbox"]:not([data-filter-attached])',        // ARIA textboxes
        '[role="searchbox"]:not([data-filter-attached])',      // ARIA searchboxes
        'input[name="q"]:not([data-filter-attached])',         // Google search
        'textarea[name="q"]:not([data-filter-attached])',      // Google search textarea
        'input.gLFyf:not([data-filter-attached])',             // Google search class
        'textarea.gLFyf:not([data-filter-attached])',          // Google search textarea
        'input[jsname]:not([data-filter-attached])',           // Google internal
        'textarea[jsname]:not([data-filter-attached])'         // Google internal textarea
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
   * Fetches user settings from storage and updates this object.
   * Called on initialization and when explicitly requested.
   * 
   * Uses async/await for cleaner error handling.
   * Logs loading process for debugging.
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
      // Fetch all settings from sync storage
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
      this.ENABLED = result.enableFilter !== false; // Default to true

      logger.info("Settings loaded from storage");
    } catch (error) {
      logger.safeError("Error loading config", error);
    }
  }

  /**
   * Set up listeners for configuration changes
   * 
   * Two types of listeners:
   * 1. Message listener: For manual reload requests
   * 2. Storage listener: For automatic real-time updates
   * 
   * Real-time updates mean:
   * - User changes setting in UI
   * - Storage change fires
   * - Config updates immediately
   * - Content script uses new settings without reload
   * 
   * @returns {void}
   */
  setupListeners() {
    if (!isExtensionContextValid()) {
      logger.warn("Extension context invalid, skipping listeners");
      return;
    }

    try {
      // Listen for manual reload requests
      // Used by settings page after saving changes
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "reloadConfig") {
          this.loadConfig();
          logger.info("Config reloaded");
        }
      });

      // Listen for storage changes and update config automatically
      // This provides instant updates without waiting for reload message
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