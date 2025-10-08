import { STORAGE_KEYS } from '../../utils/constants';

export class SettingsManager {
  constructor() {
    this.blockedWords = [];
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
      STORAGE_KEYS.REDIRECT_URL,
      STORAGE_KEYS.SHOW_ALERTS
    ]);

    this.blockedWords = result.blockedWords || [];
    this.redirectUrl = result.redirectUrl || '';
    this.showAlerts = result.showAlerts || false;

    console.log('[Settings Manager] Settings loaded:', {
      blockedWords: this.blockedWords,
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

  getBlockedWords() {
    return this.blockedWords;
  }

  getRedirectUrl() {
    return this.redirectUrl;
  }

  shouldShowAlerts() {
    return this.showAlerts;
  }
}