/**
 * Input Handler Module
 * 
 * Monitors and cleans input fields (text inputs, textareas, contenteditable).
 * Prevents users from typing or pasting blocked words.
 * 
 * Features:
 * - Attaches to all input fields on page
 * - Monitors input, keyup, paste, and change events
 * - Replaces blocked words with healthy alternatives
 * - Special handling for search inputs (q, p parameters)
 * - Blocks Enter key if input contains blocked words
 * - Site-specific handling for Yahoo (value interception)
 * 
 * @class InputHandler
 */
export class InputHandler {
  /**
   * @param {WellnessConfig} config - Configuration object
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    
    // Track last clean value for Yahoo's value interception
    this.yahooLastCleanValue = "";
  }

  /**
   * Clean an individual input element
   * Checks value for blocked words and replaces them
   * Special handling for search inputs
   * 
   * @param {HTMLElement} element - Input element to clean
   */
  cleanInput(element) {
    if (!element) return;

    // Get value from various sources
    const value = element.value || element.textContent || element.innerText || '';

    // Check if contains blocked words
    if (this.utils.containsBlockedWord(value)) {
      // Replace with scrubbed text
      if (element.value !== undefined) {
        element.value = this.utils.scrubText(value);
      } else {
        element.textContent = this.utils.scrubText(value);
      }

      // For search inputs, replace entire value with healthy alternative
      // This prevents partial blocked words from being searched
      if (element.matches('input[name="q"], input[type="search"], input[name="p"]')) {
        element.value = this.utils.getRandomReplacement();
        this.utils.log('Replaced search input with healthy alternative');
      }
    }

    // Yahoo-specific: Track last clean value for value interception
    const currentHost = window.location.hostname;
    if (currentHost.includes('yahoo') && 
        element.matches('input[name="p"], input[type="text"][role="combobox"]')) {
      this.yahooLastCleanValue = element.value;
    }
  }

  /**
   * Attach handlers to input elements
   * Finds all inputs in container and sets up event listeners
   * Marks inputs as attached to avoid duplicate listeners
   * 
   * @param {HTMLElement} container - Container to search (default: document)
   * @returns {number} Number of new inputs attached
   */
  attachToInputs(container = document) {
    // Get all input selectors from config
    const selector = this.config.INPUT_SELECTORS.join(',');
    
    // Find all matching inputs
    let inputs = Array.from(container.querySelectorAll(selector));
    
    // If container itself is an input, include it
    if (container !== document && container.nodeType === 1) {
      // Remove :not() pseudo-selectors for this check
      if (container.matches && container.matches(selector.replace(/:not\([^)]+\)/g, ''))) {
        if (!container.dataset.filterAttached) {
          inputs.push(container);
        }
      }
    }

    // Attach to each input
    inputs.forEach(input => {
      // Mark as attached to avoid duplicates
      input.dataset.filterAttached = 'true';
      
      // Clean immediately
      this.cleanInput(input);
      
      // Log in debug mode
      if (this.config.DEBUG_MODE) {
        const inputType = input.tagName + 
                         (input.name ? `[name="${input.name}"]` : '') + 
                         (input.type ? `[type="${input.type}"]` : '');
        this.utils.log(`Attached to input: ${inputType}`);
      }

      // Set up event listeners for various input events
      ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
        input.addEventListener(eventType, () => this.cleanInput(input), { passive: true });
      });

      // Special handler for Enter key
      // Prevents submission if input contains blocked words
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          const value = input.value || input.textContent || '';
          
          // If contains blocked word, prevent submission
          if (this.utils.containsBlockedWord(value)) {
            e.preventDefault();
            e.stopPropagation();
            
            // Replace with healthy alternative
            input.value = this.utils.getRandomReplacement();
            
            this.utils.log('Blocked Enter submission');
            return false;
          }
        }
      });
    });

    return inputs.length;
  }
}