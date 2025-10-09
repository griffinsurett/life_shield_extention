/**
 * Site Handlers Module
 * 
 * Site-specific handling for Google, Yahoo, etc.
 * Now with enhanced Google New Tab page support.
 * 
 * @class SiteHandlers
 */

import { createLogger } from '../../utils/logger';
import { GOOGLE_SETUP_INTERVAL, YAHOO_CHECK_INTERVAL } from '../../utils/timing';

const logger = createLogger('SiteHandlers');

export class SiteHandlers {
  /**
   * @param {WellnessConfig} config - Configuration
   * @param {WellnessUtils} utils - Utility functions
   * @param {InputHandler} inputHandler - Input handler
   */
  constructor(config, utils, inputHandler) {
    this.config = config;
    this.utils = utils;
    this.inputHandler = inputHandler;
    this.hostname = window.location.hostname.toLowerCase();
  }

  /**
   * Initialize site-specific handlers
   */
  init() {
    logger.info(`Checking site-specific handlers for: ${this.hostname}`);

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
   */
  setupGoogleHandler() {
    logger.info('Setting up Google search handler');

    // More aggressive setup for Google's dynamic UI
    const setupInterval = setInterval(() => {
      // Find all possible Google search inputs
      const searchBoxes = document.querySelectorAll([
        'input[name="q"]',
        'textarea[name="q"]',
        'input[type="text"][title*="Search"]',
        'input[aria-label*="Search"]',
        'textarea[aria-label*="Search"]',
        '[role="combobox"][name="q"]',
        'textarea[aria-controls*="Alh6id"]',
        // New Tab page specific selectors
        'input[jsname]',
        'textarea[jsname]',
        '.gLFyf', // Google's search input class
        'input.gLFyf',
        'textarea.gLFyf',
        // Additional fallbacks
        'form[role="search"] input',
        'form[role="search"] textarea'
      ].join(', '));

      if (searchBoxes.length > 0) {
        let attached = 0;
        searchBoxes.forEach(box => {
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
    }, GOOGLE_SETUP_INTERVAL);

    // Clean up after 30 seconds (increased from 10)
    setTimeout(() => {
      clearInterval(setupInterval);
      logger.debug('Google setup interval cleared');
    }, 30000);

    // Hide blocked suggestions
    this.hideGoogleSuggestions();
    
    // Add special handler for Google New Tab page
    this.setupGoogleNewTabHandler();
  }

  /**
   * Set up special handler for Google New Tab page
   */
  setupGoogleNewTabHandler() {
    // Check if this is the Google homepage (often used as new tab)
    if (window.location.pathname === '/' || window.location.pathname === '') {
      logger.info('Detected Google homepage - setting up new tab handler');

      // Very aggressive scanning for the search input
      let scanCount = 0;
      const aggressiveScan = setInterval(() => {
        scanCount++;
        
        // Try every possible selector
        const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        
        inputs.forEach(input => {
          // Check if it looks like a search input
          const isSearchInput = 
            input.name === 'q' ||
            input.getAttribute('aria-label')?.toLowerCase().includes('search') ||
            input.getAttribute('title')?.toLowerCase().includes('search') ||
            input.className?.includes('gLFyf') ||
            input.getAttribute('jsname');

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
      }, 100); // Every 100ms for first 6 seconds
    }
  }

  /**
   * Hide Google suggestions with blocked words
   */
  hideGoogleSuggestions() {
    const observer = new MutationObserver(() => {
      try {
        const suggestions = document.querySelectorAll(
          this.config.GOOGLE_SUGGESTION_SELECTORS.join(', ')
        );

        for (const suggestion of suggestions) {
          const text = suggestion.textContent || '';
          
          if (this.utils.containsBlockedWord(text)) {
            if (this.config.HIDE_ENTIRE_DROPDOWN) {
              const dropdown = suggestion.closest('[role="listbox"]');
              if (dropdown) {
                dropdown.style.display = 'none';
                logger.debug('Hidden Google dropdown with blocked content');
              }
            } else {
              suggestion.style.display = 'none';
              logger.debug('Hidden Google suggestion');
            }
          }
        }
      } catch (error) {
        logger.safeError('Error hiding Google suggestions', error);
      }
    });

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
   */
  setupYahooHandler() {
    logger.info('Setting up Yahoo search handler');

    // Yahoo value interception
    const checkInterval = setInterval(() => {
      const searchBox = document.querySelector('input[name="p"]');
      if (searchBox) {
        this.inputHandler.attachToInputs(document);
        logger.debug('Yahoo search box found and attached');
      }
    }, YAHOO_CHECK_INTERVAL);

    // Clean up after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      logger.debug('Yahoo setup interval cleared');
    }, 10000);
  }

  /**
   * Set up Bing search handler
   */
  setupBingHandler() {
    logger.info('Setting up Bing search handler');

    // Bing is similar to Google
    this.inputHandler.attachToInputs(document);
  }
}