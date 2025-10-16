/**
 * Site Handlers Module
 * 
 * Special handling for specific websites (Google, Yahoo, Bing).
 * Different sites implement search in different ways, requiring custom logic.
 * 
 * Why site-specific handling:
 * - Google uses dynamic components (React-based)
 * - Search boxes load at different times
 * - Autocomplete suggestions need special handling
 * - New tab page has unique search implementation
 * 
 * Sites with handlers:
 * - Google (search, homepage, new tab page)
 * - Yahoo (search)
 * - Bing (search)
 * 
 * @class SiteHandlers
 * @module content/modules/SiteHandlers
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('SiteHandlers');

export class SiteHandlers {
  /**
   * Create site handlers instance
   * 
   * @param {WellnessConfig} config - Configuration with timing constants
   * @param {WellnessUtils} utils - Utility functions for word checking
   * @param {InputHandler} inputHandler - Input handler for attaching to search boxes
   */
  constructor(config, utils, inputHandler) {
    this.config = config;
    this.utils = utils;
    this.inputHandler = inputHandler;
    
    // Get current hostname for site detection
    this.hostname = window.location.hostname.toLowerCase();
  }

  /**
   * Initialize site-specific handlers
   * 
   * Detects which site we're on and sets up appropriate handler.
   * Only one handler is active at a time.
   * 
   * Detection is simple string matching on hostname.
   * 
   * @returns {void}
   * 
   * @example
   * const handlers = new SiteHandlers(config, utils, inputHandler);
   * handlers.init();
   */
  init() {
    logger.info(`Checking site-specific handlers for: ${this.hostname}`);

    // Check hostname and initialize appropriate handler
    if (this.hostname.includes('google')) {
      this.setupGoogleHandler();
    } else if (this.hostname.includes('yahoo')) {
      this.setupYahooHandler();
    } else if (this.hostname.includes('bing')) {
      this.setupBingHandler();
    }
  }

  /**
   * Set up Google search handler
   * 
   * Google challenges:
   * - Search box loads dynamically (React)
   * - Multiple search boxes on page
   * - Box appears at different times
   * - New tab page has special implementation
   * 
   * Strategy:
   * 1. Run aggressive setup interval (100ms)
   * 2. Find all possible search box selectors
   * 3. Attach to any new boxes found
   * 4. Continue for 30 seconds (handles slow loads)
   * 5. Set up autocomplete suggestion hiding
   * 6. Special handling for new tab page
   * 
   * @returns {void}
   */
  setupGoogleHandler() {
    logger.info('Setting up Google search handler');

    /**
     * Aggressive search box detection
     * 
     * Runs every 100ms to catch search boxes as soon as they appear.
     * Google's React-based UI can load boxes at unpredictable times.
     * 
     * Continues for 30 seconds to handle:
     * - Slow network connections
     * - Delayed JavaScript execution
     * - Progressive enhancement
     */
    const setupInterval = setInterval(() => {
      // Find all possible Google search inputs
      // Config has extensive list of selectors for Google
      const searchBoxes = document.querySelectorAll(
        this.config.SELECTORS.GOOGLE_SEARCH.join(', ')
      );

      if (searchBoxes.length > 0) {
        let attached = 0;
        
        // Attach to each search box found
        searchBoxes.forEach(box => {
          // Check if we've already attached to this box
          // data-filter-attached marks processed inputs
          if (!box.getAttribute('data-filter-attached')) {
            this.inputHandler.attachInputListener(box);
            this.inputHandler.attachedInputs.add(box);
            attached++;
          }
        });
        
        if (attached > 0) {
          logger.info(`Google: Attached to ${attached} search boxes`);
        }
      }
    }, this.config.GOOGLE_SETUP_INTERVAL);

    // Clean up after 30 seconds
    // By then, page should be fully loaded
    setTimeout(() => {
      clearInterval(setupInterval);
      logger.debug('Google setup interval cleared');
    }, 30000);

    // Set up autocomplete suggestion hiding
    this.hideGoogleSuggestions();
    
    // Special handler for Google homepage/new tab
    this.setupGoogleNewTabHandler();
  }

  /**
   * Set up special handler for Google new tab page
   * 
   * Google homepage (often used as new tab) is particularly tricky:
   * - Search box appears very late
   * - Multiple timing variations
   * - Different selectors than main search
   * 
   * Solution:
   * - Very aggressive scanning (100ms intervals)
   * - Check ALL input elements, not just search
   * - Look for search-like attributes
   * - Run for 60 iterations (6 seconds)
   * - Log findings for debugging
   * 
   * @returns {void}
   */
  setupGoogleNewTabHandler() {
    // Only run on homepage (root path)
    if (window.location.pathname === '/' || window.location.pathname === '') {
      logger.info('Detected Google homepage - setting up new tab handler');

      let scanCount = 0;
      
      /**
       * Aggressive input scanning
       * 
       * Checks every 100ms for up to 6 seconds.
       * This catches the search box no matter when it loads.
       */
      const aggressiveScan = setInterval(() => {
        scanCount++;
        
        // Find ALL inputs and textareas
        const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        
        inputs.forEach(input => {
          // Identify search inputs by multiple attributes
          const isSearchInput = 
            input.name === 'q' || // Standard Google search name
            input.getAttribute('aria-label')?.toLowerCase().includes('search') ||
            input.getAttribute('title')?.toLowerCase().includes('search') ||
            input.className?.includes('gLFyf') || // Google's search class
            input.getAttribute('jsname'); // Google's internal attribute

          // Attach if looks like search and not yet processed
          if (isSearchInput && !input.getAttribute('data-filter-attached')) {
            logger.info(`Found Google search input (scan #${scanCount}):`, {
              tag: input.tagName,
              name: input.name,
              class: input.className,
              jsname: input.getAttribute('jsname')
            });
            
            this.inputHandler.attachInputListener(input);
            this.inputHandler.attachedInputs.add(input);
          }
        });

        // Stop after 60 scans (6 seconds)
        if (scanCount >= 60) {
          clearInterval(aggressiveScan);
          logger.info('Aggressive scan completed');
        }
      }, 100);
    }
  }

  /**
   * Hide Google autocomplete suggestions with blocked content
   * 
   * Google shows suggestions as you type. We need to:
   * 1. Watch for suggestion popup appearing
   * 2. Check each suggestion for blocked words
   * 3. Hide individual suggestions OR entire dropdown
   * 
   * Uses MutationObserver to detect new suggestions appearing.
   * 
   * Two modes:
   * - HIDE_ENTIRE_DROPDOWN: Hide whole dropdown if any suggestion blocked
   * - Individual: Hide only specific blocked suggestions
   * 
   * @returns {void}
   */
  hideGoogleSuggestions() {
    /**
     * Watch for changes to detect new suggestions
     * 
     * MutationObserver fires when:
     * - New elements added to DOM (suggestions appearing)
     * - Elements removed (suggestions updating)
     * - Child nodes change (suggestion content updates)
     */
    const observer = new MutationObserver(() => {
      try {
        // Find all Google suggestion elements
        // Config has selectors for various suggestion types
        const suggestions = document.querySelectorAll(
          this.config.SELECTORS.GOOGLE_SUGGESTION.join(', ')
        );

        // Check each suggestion
        for (const suggestion of suggestions) {
          const text = suggestion.textContent || '';
          
          // If suggestion contains blocked word
          if (this.utils.containsBlockedWord(text)) {
            if (this.config.HIDE_ENTIRE_DROPDOWN) {
              // Hide the entire dropdown container
              const dropdown = suggestion.closest('[role="listbox"]');
              if (dropdown) {
                dropdown.style.display = 'none';
                logger.debug('Hidden Google dropdown with blocked content');
              }
            } else {
              // Hide just this suggestion
              suggestion.style.display = 'none';
              logger.debug('Hidden Google suggestion');
            }
          }
        }
      } catch (error) {
        logger.safeError('Error hiding Google suggestions', error);
      }
    });

    // Start observing the entire body
    // childList + subtree catches all changes anywhere in page
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      logger.debug('Google suggestions observer started');
    }
  }

  /**
   * Set up Yahoo search handler
   * 
   * Yahoo is simpler than Google:
   * - Uses standard input with name="p"
   * - Loads more predictably
   * - Less dynamic components
   * 
   * Strategy:
   * - Check every 200ms for search box
   * - Attach when found
   * - Stop after 10 seconds
   * 
   * @returns {void}
   */
  setupYahooHandler() {
    logger.info('Setting up Yahoo search handler');

    /**
     * Search box detection interval
     * 
     * Yahoo search box usually appears quickly,
     * but we check for 10 seconds to be safe.
     */
    const checkInterval = setInterval(() => {
      // Yahoo uses standard input name="p" for search
      const searchBox = document.querySelector('input[name="p"]');
      
      if (searchBox) {
        // Found it - attach to all inputs on page
        this.inputHandler.attachToInputs(document);
        logger.debug('Yahoo search box found and attached');
      }
    }, this.config.YAHOO_CHECK_INTERVAL);

    // Clean up after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      logger.debug('Yahoo setup interval cleared');
    }, 10000);
  }

  /**
   * Set up Bing search handler
   * 
   * Bing is similar to Google in structure.
   * Uses React-based components but more stable timing.
   * 
   * Strategy:
   * - Single attachment pass (no interval needed)
   * - Let regular input detection handle updates
   * 
   * @returns {void}
   */
  setupBingHandler() {
    logger.info('Setting up Bing search handler');

    // Bing loads predictably, single pass is enough
    this.inputHandler.attachToInputs(document);
  }
}