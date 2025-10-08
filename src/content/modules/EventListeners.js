/**
 * Event Listeners Module
 * 
 * Sets up global event listeners to block interactions with filtered content.
 * Provides two layers of protection:
 * 1. Click blocker - Prevents clicking on elements with blocked words
 * 2. Form blocker - Prevents submitting forms with blocked content
 * 
 * These are last-resort protections in case blocked content somehow
 * makes it through the other filtering layers.
 * 
 * @class EventListeners
 */
export class EventListeners {
  /**
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Set up click blocker
   * Intercepts clicks on elements containing blocked words
   * Prevents the click from propagating or executing default action
   */
  setupClickBlocker() {
    document.addEventListener('click', (e) => {
      // Get text content of clicked element
      const text = e.target.textContent || e.target.innerText || '';
      
      // If contains blocked word, stop the click
      if (this.utils.containsBlockedWord(text)) {
        e.preventDefault(); // Stop default action
        e.stopPropagation(); // Stop event bubbling
        this.utils.log('Blocked click on filtered content');
        return false;
      }
    }, true); // Use capture phase to catch early
  }

  /**
   * Set up form submission blocker
   * Prevents submitting forms that contain blocked words in inputs
   * Useful for search forms and text submission
   */
  setupFormBlocker() {
    document.addEventListener('submit', (e) => {
      // Check all inputs and textareas in the form
      const inputs = e.target.querySelectorAll('input, textarea');
      
      for (let input of inputs) {
        const value = input.value || input.textContent || '';
        
        // If any input contains blocked word, stop submission
        if (this.utils.containsBlockedWord(value)) {
          e.preventDefault();
          this.utils.log('Blocked form submission');
          return false;
        }
      }
    }, true); // Use capture phase
  }

  /**
   * Initialize all event listeners
   * Sets up click and form blockers
   */
  init() {
    this.setupClickBlocker();
    this.setupFormBlocker();
  }
}