/**
 * Element Cleaner Module
 * 
 * Handles hiding blocked elements.
 * Now supports async hashing for protected content.
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
   * Now uses async checking for hashed words
   * 
   * @param {Element} container - Container to search
   * @returns {Promise<number>} Number of elements hidden
   */
  async hideBlockedElements(container) {
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

        // Async check with hashing
        if (await this.utils.containsBlockedWord(combinedText)) {
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
   */
  reset() {
    this.processedElements = new WeakSet();
    logger.debug('Element tracking reset');
  }
}