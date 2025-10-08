/**
 * Site Handlers Module
 * 
 * Contains site-specific handlers for popular websites.
 * Some sites require special handling due to their unique DOM structure
 * or JavaScript frameworks that rebuild the page dynamically.
 * 
 * Currently handles:
 * - Google: Aggressive suggestion removal, search box monitoring
 * - Yahoo: Value property interception to prevent blocked searches
 * 
 * @class SiteHandlers
 */
export class SiteHandlers {
  /**
   * @param {WellnessConfig} config - Configuration object
   * @param {WellnessUtils} utils - Utility functions
   * @param {InputHandler} inputHandler - For attaching to inputs
   */
  constructor(config, utils, inputHandler) {
    this.config = config;
    this.utils = utils;
    this.inputHandler = inputHandler;
  }

  /**
   * Set up Google-specific handlers
   * Google's search suggestions are rendered dynamically and require
   * more aggressive monitoring than standard autocomplete
   * 
   * Features:
   * - Finds and monitors search box
   * - Disables autocomplete
   * - Aggressively removes suggestion items
   * - Runs every 100ms to catch dynamic updates
   */
  setupGoogle() {
    const currentHost = window.location.hostname;
    
    // Only run on Google domains
    if (!currentHost.includes('google')) return;

    /**
     * Main Google setup function
     * Runs frequently to catch dynamically added elements
     */
    const setupGoogleSearch = () => {
      // Find Google search box using multiple selectors
      const searchBox = document.querySelector(
        this.config.GOOGLE_SEARCH_SELECTORS.join(',')
      );
      
      // Attach to search box if found
      if (searchBox) {
        if (!searchBox.dataset.filterAttached) {
          this.utils.log('Found Google search box, attaching listeners');
          this.inputHandler.attachToInputs(searchBox.parentElement || document);
          
          // Disable autocomplete attributes
          searchBox.setAttribute('autocomplete', 'off');
          searchBox.setAttribute('aria-autocomplete', 'none');
        }
      }

      // Aggressive suggestion removal
      // Google's suggestions are in multiple possible containers
      const suggestionContainers = document.querySelectorAll(
        '[role="listbox"], .sbdd_b, .mkHrUc, .G43f7e, .erkvQe'
      );
      
      suggestionContainers.forEach(container => {
        // Check all child elements
        const allElements = container.querySelectorAll('*');
        
        allElements.forEach(el => {
          // Get text from multiple sources
          const text = el.textContent || el.innerText || el.getAttribute('data-query') || '';
          
          // If contains blocked word, remove entire suggestion item
          if (text && this.utils.containsBlockedWord(text)) {
            // Find the parent suggestion item
            const suggestionItem = el.closest('[role="option"], li, .sbct, div[jsname]');
            
            if (suggestionItem) {
              suggestionItem.remove();
              this.utils.log('Removed Google suggestion:', text);
            }
          }
        });
      });
    };

    // Run immediately
    setupGoogleSearch();
    
    // Run frequently to catch dynamic updates
    // Google rebuilds suggestions constantly as user types
    setInterval(setupGoogleSearch, 100);
  }

  /**
   * Set up Yahoo-specific handlers
   * Yahoo requires value property interception to prevent blocked searches
   * 
   * Uses Object.defineProperty to intercept reads/writes to the value property.
   * When a blocked word is detected, replaces it with a healthy alternative.
   * 
   * This is necessary because Yahoo's JavaScript directly reads the value
   * property before our event listeners can clean it.
   */
  setupYahoo() {
    const currentHost = window.location.hostname;
    
    // Only run on Yahoo domains
    if (!currentHost.includes('yahoo')) return;

    // Run periodically to catch search box
    setInterval(() => {
      const searchBox = document.querySelector(
        'input[name="p"], input[type="text"][role="combobox"], input[type="search"]'
      );

      // Set up value interception if not already done
      if (searchBox && !searchBox.dataset.yahooIntercepted) {
        searchBox.dataset.yahooIntercepted = 'true';

        // Get original value descriptor
        const originalDescriptor = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype, 
          'value'
        );

        // Override value property with custom getter/setter
        Object.defineProperty(searchBox, 'value', {
          /**
           * Custom getter for value property
           * Returns clean value if original contains blocked words
           */
          get: () => {
            const val = originalDescriptor.get.call(searchBox);
            
            // If contains blocked word, return clean version
            if (this.utils.containsBlockedWord(val)) {
              return this.inputHandler.yahooLastCleanValue || 
                     this.utils.getRandomReplacement();
            }
            
            return val;
          },
          
          /**
           * Custom setter for value property
           * Cleans value before setting
           */
          set: (newValue) => {
            // If contains blocked word, replace with healthy alternative
            if (this.utils.containsBlockedWord(newValue)) {
              const cleanValue = this.utils.getRandomReplacement();
              this.inputHandler.yahooLastCleanValue = cleanValue;
              originalDescriptor.set.call(searchBox, cleanValue);
            } else {
              this.inputHandler.yahooLastCleanValue = newValue;
              originalDescriptor.set.call(searchBox, newValue);
            }
          }
        });
      }

      // Also clean value directly as backup
      if (searchBox && this.utils.containsBlockedWord(searchBox.value)) {
        const replacement = this.utils.getRandomReplacement();
        searchBox.value = replacement;
        this.inputHandler.yahooLastCleanValue = replacement;
      }
    }, 200); // Check every 200ms
  }

  /**
   * Initialize all site-specific handlers
   * Sets up handlers for supported sites
   */
  init() {
    this.setupGoogle();
    this.setupYahoo();
  }
}