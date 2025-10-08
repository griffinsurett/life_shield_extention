/* chrome settings */
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/utils/constants';

let BLOCKED_WORDS = [];
let REDIRECT_URL = "";

console.log('[Wellness Filter Background] Service worker loaded');

// Load settings from storage
const loadSettings = () => {
  chrome.storage.sync.get([STORAGE_KEYS.BLOCKED_WORDS, STORAGE_KEYS.REDIRECT_URL], (result) => {
    BLOCKED_WORDS = result.blockedWords || [];
    REDIRECT_URL = result.redirectUrl || "";
    console.log('[Wellness Filter Background] Settings loaded:', { BLOCKED_WORDS, REDIRECT_URL });
  });
};

loadSettings();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.blockedWords) {
      BLOCKED_WORDS = changes.blockedWords.newValue || [];
      console.log('[Wellness Filter Background] Blocked words updated:', BLOCKED_WORDS);
    }
    if (changes.redirectUrl) {
      REDIRECT_URL = changes.redirectUrl.newValue || "";
      console.log('[Wellness Filter Background] Redirect URL updated:', REDIRECT_URL);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'blockedUrl') {
    console.log('[Wellness Filter Background] Blocked URL detected:', message.url);
    
    if (sender.tab && sender.tab.id) {
      chrome.tabs.update(sender.tab.id, { url: REDIRECT_URL });
    }
  }
});

// Check if URL contains blocked words
const containsBlockedWord = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lower.includes(word.toLowerCase()));
};

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  
  const url = details.url;
  
  if (containsBlockedWord(url)) {
    console.log('[Wellness Filter Background] Intercepted navigation to blocked URL:', url);
    chrome.tabs.update(details.tabId, { url: REDIRECT_URL });
  }
});

// Check URL parameters after navigation
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  
  try {
    const urlObj = new URL(details.url);
    const query = urlObj.searchParams.get('q') || 
                 urlObj.searchParams.get('query') || 
                 urlObj.searchParams.get('p') || '';
    
    if (containsBlockedWord(query)) {
      console.log('[Wellness Filter Background] Blocked query parameter detected');
      chrome.tabs.update(details.tabId, { url: REDIRECT_URL });
    }
  } catch (e) {
    console.error('Error parsing URL:', e);
    // Invalid URL, ignore
  }
});

// Initialize defaults on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      console.log('[Wellness Filter Background] Default settings initialized');
      loadSettings();
    });
    
    chrome.storage.local.set({
      filterCount: 0,
      todayCount: 0,
      installDate: new Date().toLocaleDateString()
    });
  }
});