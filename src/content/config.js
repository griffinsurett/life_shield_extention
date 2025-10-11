/**
 * Wellness Config
 * 
 * Manages configuration for content script.
 * Performance settings are now hardcoded for simplicity.
 * Blur mode removed for better recovery focus.
 * 
 * @class WellnessConfig
 */

import { isExtensionContextValid } from "../utils/chromeApi";
import { SELECTORS, PERFORMANCE } from "../utils/selectors";
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
    this.SCAN_INTERVAL = PERFORMANCE.SCAN_INTERVAL;
    this.MUTATION_DEBOUNCE = PERFORMANCE.MUTATION_DEBOUNCE;
    this.MIN_CLEAN_INTERVAL = PERFORMANCE.MIN_CLEAN_INTERVAL;
    
    // Feature flags
    this.HIDE_ENTIRE_DROPDOWN = true;

    // Selector configurations from constants
    this.GOOGLE_SEARCH_SELECTORS = SELECTORS.GOOGLE_SEARCH;
    this.GOOGLE_SUGGESTION_SELECTORS = SELECTORS.GOOGLE_SUGGESTION;
    this.SUGGESTION_SELECTORS = SELECTORS.SUGGESTION;
    this.INPUT_SELECTORS = SELECTORS.INPUT;

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