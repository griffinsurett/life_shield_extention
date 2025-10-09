/**
 * Constants
 * 
 * Central location for all extension constants.
 * Includes default settings, storage keys, and CSS selectors.
 * 
 * Performance settings are now HARDCODED (not user-configurable)
 * to keep the UI simple and user-focused.
 * 
 * @module utils/constants
 */

/**
 * Default settings for new installations
 * 
 * @constant {Object}
 */
export const DEFAULT_SETTINGS = {
  // Default blocked words (for testing)
  blockedWords: ["chair", "a chair"],
  
  // No blocked sites by default
  blockedSites: [],
  
  // Default redirect destination
  redirectUrl: "https://griffinswebservices.com",
  
  // Filter is enabled by default
  enableFilter: true,
  
  // Notifications disabled by default (can be annoying)
  showAlerts: false,
  
  // Blocking behavior
  useCustomUrl: false,  // If false, use custom message page
  customMessage: 'This page has been blocked to support your wellness journey. Take a moment to breathe and consider a healthier alternative.',
  
  /**
   * Default healthy replacement phrases
   * Randomly selected when blocked words are replaced
   * Focus on wellness, health, and positive activities
   */
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

/**
 * Performance Settings (HARDCODED - Not user-configurable)
 * These are optimized defaults that work well for 99.9% of users
 * 
 * @constant {Object}
 */
export const PERFORMANCE = {
  // Scan every 2 seconds (balance between performance and coverage)
  SCAN_INTERVAL: 2000,
  
  // Wait 200ms after DOM changes before processing
  MUTATION_DEBOUNCE: 200,
  
  // Minimum interval between cleaning operations (ms)
  MIN_CLEAN_INTERVAL: 500,
};

/**
 * Storage keys
 * Centralized key names for chrome.storage
 * 
 * @constant {Object}
 */
export const STORAGE_KEYS = {
  // Settings (stored in sync storage)
  BLOCKED_WORDS: 'blockedWords',
  BLOCKED_SITES: 'blockedSites',
  REDIRECT_URL: 'redirectUrl',
  ENABLE_FILTER: 'enableFilter',
  SHOW_ALERTS: 'showAlerts',
  REPLACEMENT_PHRASES: 'replacementPhrases',
  USE_CUSTOM_URL: 'useCustomUrl',
  CUSTOM_MESSAGE: 'customMessage',
  
  // Statistics (stored in local storage)
  FILTER_COUNT: 'filterCount',
  TODAY_COUNT: 'todayCount',
  INSTALL_DATE: 'installDate',
  LAST_RESET_DATE: 'lastResetDate'
};

/**
 * CSS Selectors
 * Organized by category for easier maintenance
 * 
 * @constant {Object}
 */
export const SELECTORS = {
  /**
   * Google search box selectors
   * Multiple selectors to handle different Google UIs
   * Includes desktop and mobile variants
   */
  GOOGLE_SEARCH: [
    'input[name="q"]',           // Standard search input
    'textarea[name="q"]',        // New Google UI uses textarea
    'input[type="text"][title*="Search"]',  // Some variants
    'input[aria-label*="Search"]',
    'textarea[aria-label*="Search"]',
    '[role="combobox"][name="q"]',
    'textarea[aria-controls*="Alh6id"]'  // Specific Google ID
  ],
  
  /**
   * Google autocomplete suggestion selectors
   * Google's suggestions have many possible classes/attributes
   * These catch most variants across updates
   */
  GOOGLE_SUGGESTION: [
    '.UUbT9',                    // Google suggestion class (changes often)
    '.aajZCb',                   // Another Google class
    '[role="listbox"]',          // Semantic role
    '.sbdd_b',                   // Older Google class
    '.erkvQe',                   // Suggestion container
    '.mkHrUc',                   // Suggestion item
    '.G43f7e',                   // Another variant
    '[jsname]',                  // Generic Google element
    'div[role="presentation"]'   // Presentation divs
  ],
  
  /**
   * Generic autocomplete suggestion selectors
   * Works across most websites with autocomplete
   * Includes standard ARIA roles and common classes
   */
  SUGGESTION: [
    '[role="option"]',           // Standard ARIA role
    '[role="listbox"] li',       // List items in listbox
    '[role="listbox"] div',      // Divs in listbox
    '.suggestion',               // Common class name
    '[data-suggestion]',         // Common data attribute
    '.sbct',                     // Search suggestion class
    '.aypbod',                   // Another suggestion class
    'li',                        // Generic list items
    'div[jsname]',               // Google elements
    '.UUbT9',                    // Duplicate for convenience
    '.aajZCb',
    '.erkvQe',
    '.sbdd_b',
    '.mkHrUc',
    '.G43f7e'
  ],
  
  /**
   * Input field selectors
   * Catches all possible input types
   * Excludes inputs that already have our filter attached
   */
    /**
   * Input field selectors
   * Catches all possible input types including Google's special inputs
   * Excludes inputs that already have our filter attached
   */
  INPUT: [
    'input:not([data-filter-attached])',
    'textarea:not([data-filter-attached])',
    '[contenteditable="true"]:not([data-filter-attached])',
    '[role="textbox"]:not([data-filter-attached])',
    '[role="searchbox"]:not([data-filter-attached])',
    // Google-specific
    'input[name="q"]:not([data-filter-attached])',
    'textarea[name="q"]:not([data-filter-attached])',
    'input.gLFyf:not([data-filter-attached])',
    'textarea.gLFyf:not([data-filter-attached])',
    'input[jsname]:not([data-filter-attached])',
    'textarea[jsname]:not([data-filter-attached])'
  ]
};

/**
 * Minimum interval between cleaning operations (ms)
 * Prevents excessive processing during rapid DOM changes
 * 
 * @constant {number}
 */
export const MIN_CLEAN_INTERVAL = 500;