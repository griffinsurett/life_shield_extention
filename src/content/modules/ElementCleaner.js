/**
 * Element Cleaner Module
 * 
 * Responsible for hiding and removing DOM elements that contain blocked content.
 * Primarily targets autocomplete suggestions and search dropdowns.
 * 
 * Features:
 * - Searches for elements matching suggestion selectors
 * - Checks element text content for blocked words
 * - Removes matching elements from DOM
 * - Tracks processed elements to avoid duplicate processing
 * - Injects custom styles for blur effect (if enabled)
 * 
 * Used for:
 * - Search autocomplete suggestions
 * - Dropdown menus
 * - Search result previews
 * - Any element that might show blocked content
 * 
 * @class ElementCleaner
 */
export class ElementCleaner {
  /**
   * @param {WellnessConfig} config - Configuration object
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    
    // Track elements we've already processed to avoid duplicate work
    // WeakSet allows garbage collection of removed elements
    this.processedElements = new WeakSet();
  }

  /**
   * Hide elements that contain blocked content
   * Searches container for suggestion elements and removes those with blocked words
   * 
   * @param {HTMLElement} container - Container to search (default: document.body)
   */
  hideBlockedElements(container = document.body) {
    // Get all suggestion selectors from config
    const targetSelectors = this.config.SUGGESTION_SELECTORS;
    
    // Find all matching elements
    let elements = Array.from(container.querySelectorAll(targetSelectors.join(',')));
    
    // If container itself matches a selector, include it
    if (container !== document.body && container.nodeType === 1) {
      if (container.matches && targetSelectors.some(sel => container.matches(sel))) {
        elements.push(container);
      }
    }

    let removedCount = 0;
    
    // Check each element for blocked content
    elements.forEach(element => {
      // Skip if already processed
      if (this.processedElements.has(element)) return;

      // Get text content from multiple sources
      const text = element.textContent || element.innerText ||
                  element.getAttribute('data-query') ||
                  element.getAttribute('aria-label') || '';

      // If contains blocked word, remove it
      if (text && this.utils.containsBlockedWord(text)) {
        element.style.display = 'none'; // Hide first (faster)
        element.remove(); // Then remove from DOM
        removedCount++;
        
        // Mark as processed
        this.processedElements.add(element);
      }
    });

    // Log if anything was removed
    if (removedCount > 0) {
      this.utils.log(`Removed ${removedCount} suggestion elements`);
    }
  }

  /**
   * Inject custom styles for blur effect
   * Adds CSS to page if blur mode is enabled
   * Called once during initialization
   */
  injectStyles() {
    const style = document.createElement('style');
    
    // Apply blur if setting is enabled
    style.textContent = `
      [data-scrubbed="true"] {
        ${this.config.BLUR_INSTEAD_OF_HIDE ? 'filter: blur(5px) !important;' : ''}
      }
    `;
    
    // Inject into page head
    if (document.head) {
      document.head.appendChild(style);
    } else {
      // If head not ready yet, wait for DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => {
        if (document.head) document.head.appendChild(style);
      });
    }
  }
}