/**
 * Element Cleaner Module
 * 
 * Handles hiding/blurring of blocked elements.
 * Now with proper logging.
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
  }

  /**
   * Inject CSS styles for hiding/blurring
   */
  injectStyles() {
    if (document.getElementById('wellness-filter-styles')) {
      logger.debug('Styles already injected');
      return;
    }

    const style = document.createElement('style');
    style.id = 'wellness-filter-styles';
    style.textContent = `
      .wellness-filter-hidden {
        display: none !important;
      }
      
      .wellness-filter-blurred {
        filter: blur(10px) !important;
        pointer-events: none !important;
        user-select: none !important;
      }
    `;
    
    document.head.appendChild(style);
    logger.info('Styles injected');
  }

  /**
   * Hide or blur blocked elements
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
          if (this.config.BLUR_INSTEAD_OF_HIDE) {
            element.classList.add('wellness-filter-blurred');
            logger.debug(`Blurred element: ${element.tagName}`);
          } else {
            element.classList.add('wellness-filter-hidden');
            logger.debug(`Hidden element: ${element.tagName}`);
          }
          
          this.processedElements.add(element);
          count++;
        }
      } catch (error) {
        logger.safeError('Error processing element', error);
      }
    }

    if (count > 0) {
      logger.debug(`Processed ${count} elements`);
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