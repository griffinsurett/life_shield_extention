import { SELECTORS } from '../shared/utils/constants';

export class WellnessConfig {
  constructor() {
    this.BLOCKED_WORDS = [];
    this.REDIRECT_URL = "";
    this.SHOW_ALERTS = false;
    this.DEBUG_MODE = false;
    this.EXCLUDED_SITES = [];
    this.BLUR_INSTEAD_OF_HIDE = false;
    this.ENABLED = true;
    this.REPLACEMENT_PHRASES = [];
    this.SCAN_INTERVAL = 2000;
    this.MUTATION_DEBOUNCE = 200;
    
    this.MIN_CLEAN_INTERVAL = 500;
    this.HIDE_ENTIRE_DROPDOWN = true;
    
    this.GOOGLE_SEARCH_SELECTORS = SELECTORS.GOOGLE_SEARCH;
    this.GOOGLE_SUGGESTION_SELECTORS = SELECTORS.GOOGLE_SUGGESTION;
    this.SUGGESTION_SELECTORS = SELECTORS.SUGGESTION;
    this.INPUT_SELECTORS = SELECTORS.INPUT;
    
    this.loadConfig();
    this.setupListeners();
  }

  async loadConfig() {
    const result = await chrome.storage.sync.get([
      'blockedWords',
      'redirectUrl',
      'showAlerts',
      'debugMode',
      'excludedSites',
      'blurInsteadOfHide',
      'replacementPhrases',
      'scanInterval',
      'mutationDebounce',
      'enableFilter'
    ]);

    this.BLOCKED_WORDS = result.blockedWords || [];
    this.REDIRECT_URL = result.redirectUrl || "";
    this.SHOW_ALERTS = result.showAlerts || false;
    this.DEBUG_MODE = result.debugMode || false;
    this.EXCLUDED_SITES = result.excludedSites || [];
    this.BLUR_INSTEAD_OF_HIDE = result.blurInsteadOfHide || false;
    this.REPLACEMENT_PHRASES = result.replacementPhrases || [];
    this.SCAN_INTERVAL = result.scanInterval || 2000;
    this.MUTATION_DEBOUNCE = result.mutationDebounce || 200;
    this.ENABLED = result.enableFilter !== false;

    console.log('[Wellness Filter Config] Settings loaded from storage');
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'reloadConfig') {
        this.loadConfig();
        console.log('[Wellness Filter Config] Config reloaded');
      }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.blockedWords) {
          this.BLOCKED_WORDS = changes.blockedWords.newValue || [];
        }
        if (changes.replacementPhrases) {
          this.REPLACEMENT_PHRASES = changes.replacementPhrases.newValue || [];
        }
        if (changes.excludedSites) {
          this.EXCLUDED_SITES = changes.excludedSites.newValue || [];
        }
        if (changes.redirectUrl) {
          this.REDIRECT_URL = changes.redirectUrl.newValue || "";
        }
        if (changes.debugMode !== undefined) {
          this.DEBUG_MODE = changes.debugMode.newValue;
        }
        if (changes.showAlerts !== undefined) {
          this.SHOW_ALERTS = changes.showAlerts.newValue;
        }
        if (changes.blurInsteadOfHide !== undefined) {
          this.BLUR_INSTEAD_OF_HIDE = changes.blurInsteadOfHide.newValue;
        }
        if (changes.scanInterval) {
          this.SCAN_INTERVAL = changes.scanInterval.newValue;
        }
        if (changes.mutationDebounce) {
          this.MUTATION_DEBOUNCE = changes.mutationDebounce.newValue;
        }
        if (changes.enableFilter !== undefined) {
          this.ENABLED = changes.enableFilter.newValue;
          if (!changes.enableFilter.newValue) {
            console.log('[Wellness Filter] Filter disabled');
          }
        }
        console.log('[Wellness Filter Config] Settings updated in real-time');
      }
    });
  }
}