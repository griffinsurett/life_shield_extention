/**
 * Wellness Config
 * 
 * Manages configuration for content script.
 * Loads settings from chrome.storage.sync and keeps them in memory.
 * 
 * Settings loaded:
 * - BLOCKED_WORDS: Words to filter from page content
 * - REPLACEMENT_PHRASES: Healthy phrases to replace blocked words
 * - REDIRECT_URL: Where to redirect on blocked content
 * - SHOW_ALERTS: Whether to show notifications
 * - DEBUG_MODE: Enable console logging
 * - BLUR_INSTEAD_OF_HIDE: Blur vs hide blocked content
 * - ENABLED: Master toggle for filtering
 * - SCAN_INTERVAL: How often to scan page for new content
 * - MUTATION_DEBOUNCE: Delay before processing DOM changes
 * 
 * Also includes selector configurations for:
 * - Google search inputs and suggestions
 * - Generic search inputs
 * - Autocomplete suggestions
 * 
 * @class WellnessConfig
 */

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
    this.SCAN_INTERVAL = 2000; // How often to scan page (ms)
    this.MUTATION_DEBOUNCE = 200; // Delay before processing DOM changes (ms)
    this.MIN_CLEAN_INTERVAL = 500; // Minimum time between cleaning operations (ms)
    
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
   * Load configuration from chrome.storage.sync
   * Called on initialization and when settings are reset
   * 
   * @async
   * @returns {Promise<void>}
   */
  async loadConfig() {
    if (!this.isContextValid()) {
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
    if (!this.isContextValid()) {
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