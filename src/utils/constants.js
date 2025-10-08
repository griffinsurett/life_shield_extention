/**
 * Constants
 * 
 * Central location for all extension constants.
 * Includes default settings, storage keys, and CSS selectors.
 * 
 * This file is imported by both background and content scripts
 * to ensure consistent configuration across the extension.
 * 
 * @module utils/constants
 */

/**
 * Default settings for new installations
 * These values are written to storage on first install
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
  
  // Debug mode on for development (should be false in production)
  debugMode: true,
  
  // Notifications disabled by default (can be annoying)
  showAlerts: false,
  
  // Hide content by default (blur is less effective)
  blurInsteadOfHide: false,
  
  // Scan every 2 seconds (balance between performance and coverage)
  scanInterval: 2000,
  
  // Wait 200ms after DOM changes before processing
  mutationDebounce: 200,
  
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
 * Storage keys
 * Centralized key names for chrome.storage
 * Prevents typos and makes refactoring easier
 * 
 * @constant {Object}
 */
export const STORAGE_KEYS = {
  // Settings (stored in sync storage)
  BLOCKED_WORDS: 'blockedWords',
  BLOCKED_SITES: 'blockedSites',
  REDIRECT_URL: 'redirectUrl',
  ENABLE_FILTER: 'enableFilter',
  DEBUG_MODE: 'debugMode',
  SHOW_ALERTS: 'showAlerts',
  BLUR_INSTEAD_OF_HIDE: 'blurInsteadOfHide',
  SCAN_INTERVAL: 'scanInterval',
  MUTATION_DEBOUNCE: 'mutationDebounce',
  REPLACEMENT_PHRASES: 'replacementPhrases',
  
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
  INPUT: [
    'input:not([data-filter-attached])',              // Text inputs
    'textarea:not([data-filter-attached])',           // Textareas
    '[contenteditable="true"]:not([data-filter-attached])',  // Content editable
    '[role="textbox"]:not([data-filter-attached])',   // ARIA textbox
    '[role="searchbox"]:not([data-filter-attached])'  // ARIA searchbox
  ]
};

/**
 * Minimum interval between cleaning operations (ms)
 * Prevents excessive processing during rapid DOM changes
 * 
 * @constant {number}
 */
export const MIN_CLEAN_INTERVAL = 500;