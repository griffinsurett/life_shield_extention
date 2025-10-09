/**
 * Event Listeners Module
 * 
 * Handles page-level event listeners.
 * Now with proper logging.
 * 
 * @class EventListeners
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('EventListeners');

export class EventListeners {
  /**
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Initialize event listeners
   */
  init() {
    logger.info('Setting up event listeners');

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      logger.debug('Popstate event - checking URL');
      this.utils.checkURL();
    });

    // Listen for hashchange
    window.addEventListener('hashchange', () => {
      logger.debug('Hashchange event - checking URL');
      this.utils.checkURL();
    });

    // Listen for focus events (SPA navigation detection)
    window.addEventListener('focus', () => {
      logger.debug('Window focus - checking URL');
      this.utils.checkURL();
    }, true);

    logger.info('Event listeners initialized');
  }
}