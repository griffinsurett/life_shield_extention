/**
 * Event Listeners Module
 * 
 * Sets up page-level event listeners for detecting navigation.
 * Monitors URL changes that might bypass normal navigation events.
 * 
 * Why this is needed:
 * - Single Page Apps (SPAs) change URLs without page reload
 * - Back/forward navigation might not trigger our checks
 * - Focus events can indicate tab switching back to problematic content
 * 
 * Events monitored:
 * - popstate: Browser back/forward buttons
 * - hashchange: URL hash changes (#section)
 * - focus: Tab becomes active again
 * 
 * @class EventListeners
 * @module content/modules/EventListeners
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('EventListeners');

export class EventListeners {
  /**
   * Create event listeners instance
   * 
   * @param {WellnessUtils} utils - Utility functions including URL checking
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Initialize all event listeners
   * 
   * Sets up listeners for:
   * 1. popstate - User clicks back/forward
   * 2. hashchange - URL hash (#) changes  
   * 3. focus - Window regains focus
   * 
   * Each listener checks if current URL should be blocked.
   * 
   * Focus listener uses capture phase (true parameter) to catch
   * events before they reach target elements.
   * 
   * @returns {void}
   * 
   * @example
   * const listeners = new EventListeners(utils);
   * listeners.init();
   */
  init() {
    logger.info('Setting up event listeners');

    /**
     * Listen for popstate (back/forward navigation)
     * 
     * Triggered when:
     * - User clicks browser back button
     * - User clicks browser forward button
     * - history.back() or history.forward() is called
     * 
     * This catches navigation that doesn't reload the page.
     */
    window.addEventListener('popstate', () => {
      logger.debug('Popstate event - checking URL');
      this.utils.checkURL();
    });

    /**
     * Listen for hashchange (hash fragment changes)
     * 
     * Triggered when:
     * - URL hash changes (e.g., #section1 to #section2)
     * - location.hash is modified
     * - User clicks anchor link
     * 
     * Some sites use hash routing, so we need to check these too.
     */
    window.addEventListener('hashchange', () => {
      logger.debug('Hashchange event - checking URL');
      this.utils.checkURL();
    });

    /**
     * Listen for focus events (tab becomes active)
     * 
     * Triggered when:
     * - User switches back to this tab
     * - Window regains focus
     * 
     * This catches cases where:
     * - User opened link in background tab
     * - URL might have changed while tab was inactive
     * 
     * Uses capture phase (third parameter = true) to catch
     * focus events before they reach specific elements.
     */
    window.addEventListener('focus', () => {
      logger.debug('Window focus - checking URL');
      this.utils.checkURL();
    }, true);

    logger.info('Event listeners initialized');
  }
}