/**
 * Element Cleaner Module
 * 
 * Handles hiding blocked elements.
 * Simplified - blur mode removed for better recovery focus.
 * 
 * @class ElementCleaner
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('ElementCleaner');

export class ElementCleaner {
  /**
   * @param {WellnessConfig} config - Configuration
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    this.processedElements = new WeakSet();
    this.stylesInjected = false;
  }

  /**
   * Inject CSS styles for hiding
   */
  injectStyles() {
    if (this.stylesInjected) {
      logger.debug('Styles already injected');
      return;
    }

    const style = document.createElement('style');
    style.id = 'wellness-filter-styles';
    style.textContent = `
      .wellness-filter-hidden {
        display: none !important;
      }
    `;
    
    document.head.appendChild(style);
    this.stylesInjected = true;
    logger.info('Styles injected');
  }

  /**
   * Hide blocked elements
   * 
   * @param {Element} container - Container to search
   * @returns {number} Number of elements hidden
   */
  hideBlockedElements(container) {
    if (!container) return 0;

    let count = 0;
    const elements = container.querySelectorAll('a, button, [role="button"], [role="link"]');

    for (const element of elements) {
      // Skip if already processed
      if (this.processedElements.has(element)) {
        continue;
      }

      try {
        const text = element.textContent || '';
        const href = element.href || '';
        const title = element.title || '';
        
        const combinedText = `${text} ${href} ${title}`;

        if (this.utils.containsBlockedWord(combinedText)) {
          element.classList.add('wellness-filter-hidden');
          this.processedElements.add(element);
          count++;
          logger.debug(`Hidden element: ${element.tagName}`);
        }
      } catch (error) {
        logger.safeError('Error processing element', error);
      }
    }

    if (count > 0) {
      logger.debug(`Hidden ${count} elements`);
    }

    return count;
  }

  /**
   * Clean up processed elements tracking
   * Call this when page changes significantly
   */
  reset() {
    this.processedElements = new WeakSet();
    logger.debug('Element tracking reset');
  }
}