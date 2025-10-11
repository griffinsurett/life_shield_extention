/**
 * Technical Constants
 * 
 * CSS selectors and performance settings.
 * Configuration values have been moved to config/ folder.
 * 
 * @module utils/constants
 */

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