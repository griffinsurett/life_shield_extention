export const DEFAULT_SETTINGS = {
  blockedWords: ["chair", "a chair"],
  blockedSites: [], // CHANGED from excludedSites
  redirectUrl: "https://griffinswebservices.com",
  enableFilter: true,
  debugMode: true,
  showAlerts: false,
  blurInsteadOfHide: false,
  scanInterval: 2000,
  mutationDebounce: 200,
  replacementPhrases: [
    "yoga for beginners", "meditation techniques", "healthy recipes",
    "stress relief tips", "walking benefits", "sleep improvement",
    "breathing exercises", "mindfulness practice", "stretching routine",
    "water intake benefits", "morning exercise", "immune system boost",
    "vitamin d benefits", "relaxation techniques", "healthy meal prep",
    "nature walk benefits", "gratitude journal", "posture improvement",
    "herbal tea benefits", "workout motivation", "mental health tips",
    "nutrition basics", "hydration tips", "self care ideas", "wellness routine"
  ]
};

export const STORAGE_KEYS = {
  BLOCKED_WORDS: 'blockedWords',
  BLOCKED_SITES: 'blockedSites', // CHANGED
  REDIRECT_URL: 'redirectUrl',
  ENABLE_FILTER: 'enableFilter',
  DEBUG_MODE: 'debugMode',
  SHOW_ALERTS: 'showAlerts',
  BLUR_INSTEAD_OF_HIDE: 'blurInsteadOfHide',
  SCAN_INTERVAL: 'scanInterval',
  MUTATION_DEBOUNCE: 'mutationDebounce',
  REPLACEMENT_PHRASES: 'replacementPhrases',
  FILTER_COUNT: 'filterCount',
  TODAY_COUNT: 'todayCount',
  INSTALL_DATE: 'installDate',
  LAST_RESET_DATE: 'lastResetDate'
};

// Rest stays the same...
export const SELECTORS = {
  GOOGLE_SEARCH: [
    'input[name="q"]',
    'textarea[name="q"]',
    'input[type="text"][title*="Search"]',
    'input[aria-label*="Search"]',
    'textarea[aria-label*="Search"]',
    '[role="combobox"][name="q"]',
    'textarea[aria-controls*="Alh6id"]'
  ],
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
  INPUT: [
    'input:not([data-filter-attached])',
    'textarea:not([data-filter-attached])',
    '[contenteditable="true"]:not([data-filter-attached])',
    '[role="textbox"]:not([data-filter-attached])',
    '[role="searchbox"]:not([data-filter-attached])'
  ]
};

export const MIN_CLEAN_INTERVAL = 500;

// Test if we can find the input
// const testInput = document.querySelector('input#input');
// console.log('Found input?', testInput);
// console.log('Input value:', testInput?.value);
// VM60:3 Found input? null
// VM60:4 Input value: undefined
// undefined