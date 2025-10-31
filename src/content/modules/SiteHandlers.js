// src/content/modules/SiteHandlers.js
/**
 * Site Handlers Module
 * 
 * Site-specific handlers for Google, Yahoo, Bing, etc.
 * Optimized for performance with caching and throttling.
 * 
 * @class SiteHandlers
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('SiteHandlers');

export class SiteHandlers {
  /**
   * @param {WellnessConfig} config - Configuration
   * @param {WellnessUtils} utils - Utility functions
   * @param {InputHandler} inputHandler - Input handler instance
   */
  constructor(config, utils, inputHandler) {
    this.config = config;
    this.utils = utils;
    this.inputHandler = inputHandler;
    this.observers = [];
    this.lastGoogleCheck = 0;
    this.googleCheckCache = new Map(); // Cache suggestion checks
  }

  /**
   * Initialize site-specific handlers based on hostname
   */
  init() {
    const hostname = window.location.hostname;

    if (hostname.includes('google.')) {
      this.setupGoogleHandler();
    } else if (hostname.includes('yahoo.')) {
      this.setupYahooHandler();
    } else if (hostname.includes('bing.')) {
      this.setupBingHandler();
    }
  }

  /**
   * Set up Google search handler - OPTIMIZED
   */
  setupGoogleHandler() {
    logger.info('Setting up Google search handler (optimized)');
    this.inputHandler.attachToInputs(document);
    this.hideGoogleSuggestions();
  }

  /**
   * Hide Google suggestions containing blocked words - HEAVILY OPTIMIZED
   */
  hideGoogleSuggestions() {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 500; // Wait 500ms after last change
    const CHECK_INTERVAL = 300; // Minimum 300ms between checks
    
    const observer = new MutationObserver(() => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce to avoid excessive checks
      debounceTimer = setTimeout(async () => {
        // Throttle checks
        const now = Date.now();
        if (now - this.lastGoogleCheck < CHECK_INTERVAL) {
          return;
        }
        this.lastGoogleCheck = now;

        try {
          const suggestions = document.querySelectorAll(
            this.config.SELECTORS.GOOGLE_SUGGESTION.join(', ')
          );

          // Early exit if no suggestions
          if (suggestions.length === 0) return;

          // Process in smaller batches to avoid blocking
          for (const suggestion of suggestions) {
            // Skip if already hidden
            if (suggestion.style.display === 'none') continue;

            const text = suggestion.textContent || '';
            
            // Skip empty
            if (!text.trim()) continue;

            // Check cache first
            if (this.googleCheckCache.has(text)) {
              if (this.googleCheckCache.get(text)) {
                if (this.config.HIDE_ENTIRE_DROPDOWN) {
                  const dropdown = suggestion.closest('[role="listbox"]');
                  if (dropdown) dropdown.style.display = 'none';
                } else {
                  suggestion.style.display = 'none';
                }
              }
              continue;
            }

            // Check if blocked (async)
            const isBlocked = await this.utils.containsBlockedWord(text);
            
            // Cache result (limit cache size)
            if (this.googleCheckCache.size > 100) {
              // Clear oldest entries
              const firstKey = this.googleCheckCache.keys().next().value;
              this.googleCheckCache.delete(firstKey);
            }
            this.googleCheckCache.set(text, isBlocked);

            if (isBlocked) {
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
      }, DEBOUNCE_DELAY);
    });

    if (document.body) {
      // More targeted observation - only watch specific container
      const searchContainer = document.querySelector('[role="listbox"]')?.parentElement || document.body;
      
      observer.observe(searchContainer, {
        childList: true,
        subtree: true
      });
      
      this.observers.push(observer);
      logger.debug('Google suggestions observer started (optimized)');
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
    }, this.config.YAHOO_CHECK_INTERVAL);

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

  /**
   * Cleanup observers and caches
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.googleCheckCache.clear();
    logger.debug('SiteHandlers cleaned up');
  }
}