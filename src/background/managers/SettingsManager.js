import { STORAGE_KEYS } from '../../utils/constants';

export class SettingsManager {
  constructor() {
    this.blockedWords = [];
    this.blockedSites = [];
    this.redirectUrl = '';
    this.showAlerts = false;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupListeners();
  }

  async loadSettings() {
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
  }

  setupListeners() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.blockedWords) {
          this.blockedWords = changes.blockedWords.newValue || [];
          console.log('[Settings Manager] Blocked words updated:', this.blockedWords);
        }
        if (changes.blockedSites) {
          this.blockedSites = changes.blockedSites.newValue || [];
          console.log('[Settings Manager] Blocked sites updated:', this.blockedSites);
        }
        if (changes.redirectUrl) {
          this.redirectUrl = changes.redirectUrl.newValue || '';
          console.log('[Settings Manager] Redirect URL updated:', this.redirectUrl);
        }
        if (changes.showAlerts !== undefined) {
          this.showAlerts = changes.showAlerts.newValue;
          console.log('[Settings Manager] Show alerts updated:', this.showAlerts);
        }
      }
    });
  }

  containsBlockedWord(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.blockedWords.some(word => lower.includes(word.toLowerCase()));
  }

  containsBlockedSite(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return this.blockedSites.some(site => lower.includes(site.toLowerCase()));
  }

  getBlockedWords() {
    return this.blockedWords;
  }

  getBlockedSites() {
    return this.blockedSites;
  }

  getRedirectUrl() {
    return this.redirectUrl;
  }

  shouldShowAlerts() {
    return this.showAlerts;
  }
}