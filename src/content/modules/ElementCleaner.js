/**
 * Element Cleaner Module
 * 
 * Manages hiding of blocked elements in the DOM.
 * Uses CSS classes to hide elements containing blocked content.
 * 
 * Key Features:
 * - Hides links and buttons with blocked text
 * - Checks URLs, text content, and titles
 * - Tracks processed elements to avoid duplicate work
 * - Injects CSS styles for hiding elements
 * 
 * Architecture:
 * - Uses WeakSet to track processed elements (automatic garbage collection)
 * - Single CSS class for hiding (.wellness-filter-hidden)
 * - Simplified approach focused on recovery support
 * 
 * @class ElementCleaner
 * @module content/modules/ElementCleaner
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('ElementCleaner');

export class ElementCleaner {
  /**
   * Create element cleaner instance
   * 
   * @param {WellnessConfig} config - Configuration object with settings
   * @param {WellnessUtils} utils - Utility functions for word checking
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    
    // Track which elements we've already processed
    // WeakSet automatically cleans up when elements are removed from DOM
    this.processedElements = new WeakSet();
    
    // Track if we've injected our CSS styles yet
    this.stylesInjected = false;
  }

  /**
   * Inject CSS styles for hiding blocked elements
   * Only injects once, even if called multiple times
   * 
   * Creates a <style> element with:
   * - .wellness-filter-hidden class that hides elements
   * - !important to override other styles
   * 
   * @returns {void}
   */
  injectStyles() {
    // Don't inject twice
    if (this.stylesInjected) {
      logger.debug('Styles already injected');
      return;
    }

    // Create style element
    const style = document.createElement('style');
    style.id = 'wellness-filter-styles';
    style.textContent = `
      .wellness-filter-hidden {
        display: none !important;
      }
    `;
    
    // Add to page
    document.head.appendChild(style);
    this.stylesInjected = true;
    logger.info('Styles injected');
  }

  /**
   * Hide elements containing blocked content
   * 
   * Process flow:
   * 1. Find all clickable elements (links, buttons)
   * 2. Check each element's text, href, and title
   * 3. Add hidden class if blocked word found
   * 4. Track processed elements to skip them next time
   * 
   * Targets:
   * - <a> links
   * - <button> elements
   * - Elements with role="button" or role="link"
   * 
   * @param {Element} container - Container to search within
   * @returns {number} Number of elements hidden this pass
   * 
   * @example
   * // Hide blocked elements in entire page
   * elementCleaner.hideBlockedElements(document.body);
   * 
   * @example
   * // Hide blocked elements in a specific section
   * const section = document.querySelector('.content');
   * elementCleaner.hideBlockedElements(section);
   */
  hideBlockedElements(container) {
    if (!container) return 0;

    let count = 0;
    
    // Find all clickable elements
    // These are the most likely to contain problematic content
    const elements = container.querySelectorAll('a, button, [role="button"], [role="link"]');

    for (const element of elements) {
      // Skip if we've already processed this element
      if (this.processedElements.has(element)) {
        continue;
      }

      try {
        // Get all text content from element
        const text = element.textContent || '';
        const href = element.href || '';
        const title = element.title || '';
        
        // Combine all text sources for checking
        const combinedText = `${text} ${href} ${title}`;

        // Check if any blocked words are present
        if (this.utils.containsBlockedWord(combinedText)) {
          // Hide the element
          element.classList.add('wellness-filter-hidden');
          
          // Mark as processed so we don't check again
          this.processedElements.add(element);
          
          count++;
          logger.debug(`Hidden element: ${element.tagName}`);
        }
      } catch (error) {
        // Log error but continue processing other elements
        logger.safeError('Error processing element', error);
      }
    }

    if (count > 0) {
      logger.debug(`Hidden ${count} elements`);
    }

    return count;
  }

  /**
   * Clear processed elements tracking
   * 
   * Call this when the page changes significantly
   * (e.g., SPA navigation) to re-check all elements.
   * 
   * After reset, all elements will be checked again
   * on next hideBlockedElements() call.
   * 
   * @returns {void}
   * 
   * @example
   * // Reset when user navigates to new page
   * elementCleaner.reset();
   */
  reset() {
    this.processedElements = new WeakSet();
    logger.debug('Element tracking reset');
  }
}