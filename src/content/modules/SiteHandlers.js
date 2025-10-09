/**
 * Site Handlers Module
 * 
 * Site-specific handling for Google, Yahoo, etc.
 * Now with proper logging.
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
      const searchBox = document.querySelector('input[name="q"]');
      if (searchBox) {
        this.inputHandler.attachToInputs(document);
        logger.debug('Google search box found and attached');
      }
    }, GOOGLE_SETUP_INTERVAL);

    // Clean up after 10 seconds
    setTimeout(() => {
      clearInterval(setupInterval);
      logger.debug('Google setup interval cleared');
    }, 10000);

    // Hide blocked suggestions
    this.hideGoogleSuggestions();
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