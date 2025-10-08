/**
 * Wellness Config
 * 
 * Manages configuration for content script.
 * Loads settings from chrome.storage.sync and keeps them in memory.
 * 
 * @class WellnessConfig
 */

import { isExtensionContextValid } from "../utils/chrome";
import { SELECTORS } from "../utils/constants";

export class WellnessConfig {
  constructor() {
    // Core settings
    this.BLOCKED_WORDS = [];
    this.REDIRECT_URL = "";
    this.SHOW_ALERTS = false;
    this.DEBUG_MODE = false;
    this.BLUR_INSTEAD_OF_HIDE = false;
    this.ENABLED = true;
    this.REPLACEMENT_PHRASES = [];
    
    // Performance settings
    this.SCAN_INTERVAL = 2000;
    this.MUTATION_DEBOUNCE = 200;
    this.MIN_CLEAN_INTERVAL = 500;
    
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
   * Called on initialization and when settings are reset
   * 
   * @async
   * @returns {Promise<void>}
   */
  async loadConfig() {
    if (!isExtensionContextValid()) {
      console.log("[Wellness Filter Config] Extension context invalid, using defaults");
      return;
    }

    try {
      const result = await chrome.storage.sync.get([
        "blockedWords",
        "redirectUrl",
        "showAlerts",
        "debugMode",
        "blurInsteadOfHide",
        "replacementPhrases",
        "scanInterval",
        "mutationDebounce",
        "enableFilter",
      ]);

      // Update config with loaded values or defaults
      this.BLOCKED_WORDS = result.blockedWords || [];
      this.REDIRECT_URL = result.redirectUrl || "";
      this.SHOW_ALERTS = result.showAlerts || false;
      this.DEBUG_MODE = result.debugMode || false;
      this.BLUR_INSTEAD_OF_HIDE = result.blurInsteadOfHide || false;
      this.REPLACEMENT_PHRASES = result.replacementPhrases || [];
      this.SCAN_INTERVAL = result.scanInterval || 2000;
      this.MUTATION_DEBOUNCE = result.mutationDebounce || 200;
      this.ENABLED = result.enableFilter !== false;

      console.log("[Wellness Filter Config] Settings loaded from storage");
    } catch (error) {
      console.log("[Wellness Filter Config] Error loading config:", error);
    }
  }

  /**
   * Set up listeners for configuration changes
   * Updates config in real-time when storage changes
   * Also listens for reload messages from background script
   */
  setupListeners() {
    if (!isExtensionContextValid()) {
      console.log("[Wellness Filter Config] Extension context invalid, skipping listeners");
      return;
    }

    try {
      // Listen for manual reload requests
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "reloadConfig") {
          this.loadConfig();
          console.log("[Wellness Filter Config] Config reloaded");
        }
      });

      // Listen for storage changes and update config automatically
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "sync") {
          // Update blocked words
          if (changes.blockedWords) {
            this.BLOCKED_WORDS = changes.blockedWords.newValue || [];
          }
          
          // Update replacement phrases
          if (changes.replacementPhrases) {
            this.REPLACEMENT_PHRASES = changes.replacementPhrases.newValue || [];
          }
          
          // Update redirect URL
          if (changes.redirectUrl) {
            this.REDIRECT_URL = changes.redirectUrl.newValue || "";
          }
          
          // Update debug mode
          if (changes.debugMode !== undefined) {
            this.DEBUG_MODE = changes.debugMode.newValue;
          }
          
          // Update show alerts
          if (changes.showAlerts !== undefined) {
            this.SHOW_ALERTS = changes.showAlerts.newValue;
          }
          
          // Update blur setting
          if (changes.blurInsteadOfHide !== undefined) {
            this.BLUR_INSTEAD_OF_HIDE = changes.blurInsteadOfHide.newValue;
          }
          
          // Update scan interval
          if (changes.scanInterval) {
            this.SCAN_INTERVAL = changes.scanInterval.newValue;
          }
          
          // Update mutation debounce
          if (changes.mutationDebounce) {
            this.MUTATION_DEBOUNCE = changes.mutationDebounce.newValue;
          }
          
          // Update enabled state
          if (changes.enableFilter !== undefined) {
            this.ENABLED = changes.enableFilter.newValue;
            if (!changes.enableFilter.newValue) {
              console.log("[Wellness Filter] Filter disabled");
            }
          }
          
          console.log("[Wellness Filter Config] Settings updated in real-time");
        }
      });
    } catch (error) {
      console.log("[Wellness Filter Config] Error setting up listeners:", error);
    }
  }
}