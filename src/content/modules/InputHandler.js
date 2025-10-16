/**
 * Input Handler Module
 * 
 * Intercepts and filters text input in real-time.
 * Replaces blocked words as user types to prevent submission.
 * 
 * Why this is important:
 * - Prevents searching for blocked terms
 * - Works in search boxes, text fields, textareas
 * - Provides immediate feedback to user
 * - Stops blocked content at the source
 * 
 * Key features:
 * - Real-time text replacement (immediate, not on blur)
 * - Preserves cursor position after replacement
 * - Handles paste events
 * - Works with contenteditable elements
 * - Tracks attached inputs to avoid duplicate listeners
 * 
 * @class InputHandler
 * @module content/modules/InputHandler
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('InputHandler');

export class InputHandler {
  /**
   * Create input handler instance
   * 
   * @param {WellnessConfig} config - Configuration with selectors and settings
   * @param {WellnessUtils} utils - Utility functions for word checking/replacement
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    
    // Track which inputs we've already attached to
    // WeakSet provides automatic cleanup when elements are removed
    this.attachedInputs = new WeakSet();
  }

  /**
   * Find and attach to all input fields in container
   * 
   * Process:
   * 1. Query for input selectors from config
   * 2. Skip inputs we've already attached to
   * 3. Attach event listeners to new inputs
   * 4. Track attached inputs
   * 
   * Targets:
   * - <input> elements (not already marked)
   * - <textarea> elements
   * - contenteditable elements
   * - Elements with role="textbox" or role="searchbox"
   * 
   * The [data-filter-attached] attribute marks processed inputs
   * to avoid duplicate processing by different mechanisms.
   * 
   * @param {Element} container - Container to search for inputs
   * @returns {number} Number of new inputs attached this call
   * 
   * @example
   * // Attach to all inputs on page load
   * const count = inputHandler.attachToInputs(document);
   * console.log(`Attached to ${count} inputs`);
   * 
   * @example
   * // Attach to inputs in a specific form
   * const form = document.querySelector('#search-form');
   * inputHandler.attachToInputs(form);
   */
  attachToInputs(container) {
    if (!container) return 0;

    let count = 0;
    
    // Get all input selectors from config and create CSS selector
    const selectors = this.config.SELECTORS.INPUT.join(', ');
    const inputs = container.querySelectorAll(selectors);

    // Process each input found
    for (const input of inputs) {
      // Skip if we've already attached to this input
      if (!this.attachedInputs.has(input)) {
        this.attachInputListener(input);
        this.attachedInputs.add(input);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`Attached to ${count} new inputs`);
    }

    return count;
  }

  /**
   * Attach event listeners to a single input element
   * 
   * Listens for multiple events to catch all text changes:
   * 
   * 1. input - Fires on every keystroke, most reliable
   * 2. change - Fires when input loses focus (backup)
   * 3. keyup - Fires after key released (for immediate feedback)
   * 4. paste - Fires when user pastes text
   * 
   * All listeners are passive (won't block scrolling) for performance.
   * 
   * Paste event has 10ms delay to let paste complete before checking.
   * 
   * @param {HTMLInputElement|HTMLTextAreaElement} input - Input element to attach to
   * @returns {void}
   * 
   * @example
   * const searchBox = document.querySelector('#search');
   * inputHandler.attachInputListener(searchBox);
   */
  attachInputListener(input) {
    try {
      /**
       * Handle input event (fires on every keystroke)
       * Most important listener - catches typing in real-time
       */
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      /**
       * Handle change event (fires when input loses focus)
       * Backup in case input event missed something
       */
      input.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      /**
       * Handle keyup for immediate feedback
       * Provides responsive feel to filtering
       */
      input.addEventListener('keyup', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      /**
       * Handle paste events
       * 
       * Small delay lets paste operation complete before checking.
       * Without delay, we'd check old value before paste happened.
       */
      input.addEventListener('paste', (e) => {
        setTimeout(() => {
          this.handleInputChange(e.target);
        }, 10);
      }, { passive: true });

      logger.debug(`Listeners attached to input: ${input.name || input.id || 'unknown'}`);
    } catch (error) {
      logger.safeError('Error attaching input listener', error);
    }
  }

  /**
   * Handle input value change - check and filter content
   * 
   * Process:
   * 1. Check if filter is enabled
   * 2. Get current input value
   * 3. Check if it contains blocked words
   * 4. If yes, scrub the text (replace blocked words)
   * 5. Update input value with scrubbed text
   * 6. Preserve cursor position
   * 7. Trigger events for React/Vue/Angular
   * 
   * Cursor position handling:
   * - Saves position before replacement
   * - Calculates length difference after replacement
   * - Adjusts cursor position accordingly
   * - Restores to adjusted position
   * 
   * Framework support:
   * - Dispatches 'input' event for React/Vue
   * - Dispatches 'change' event for form validation
   * - Both with bubbles:true to propagate up DOM
   * 
   * @param {HTMLInputElement|HTMLTextAreaElement} input - Input element to check
   * @returns {void}
   * 
   * @example
   * // Called automatically by event listeners
   * // Can also be called manually:
   * inputHandler.handleInputChange(someInput);
   */
  handleInputChange(input) {
    // Respect the enable filter setting
    if (!this.config.ENABLED) return;

    try {
      // Get current value
      const value = input.value;
      
      // Check if value contains blocked words
      if (this.utils.containsBlockedWord(value)) {
        // Replace blocked words with healthy alternatives
        const scrubbed = this.utils.scrubText(value);
        
        // Only update if value actually changed
        // (Avoids unnecessary DOM manipulation)
        if (scrubbed !== value) {
          // Save cursor position BEFORE changing value
          const cursorPos = input.selectionStart;
          
          // Calculate how much length changed
          const lengthDiff = scrubbed.length - value.length;
          
          // Update the input value
          input.value = scrubbed;
          
          // Restore cursor to adjusted position
          // Ensure position doesn't go negative
          const newPos = Math.max(0, cursorPos + lengthDiff);
          input.setSelectionRange(newPos, newPos);
          
          logger.debug(`Input value scrubbed: "${value}" -> "${scrubbed}"`);
          
          /**
           * Trigger events for JavaScript frameworks
           * 
           * Many frameworks (React, Vue, Angular) listen to input events
           * to track form state. We need to trigger these events so the
           * framework knows the value changed.
           * 
           * bubbles:true makes event propagate up the DOM tree
           */
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } catch (error) {
      logger.safeError('Error handling input change', error);
    }
  }

  /**
   * Reset attached inputs tracking
   * 
   * Call this when you want to re-attach to all inputs.
   * Useful after major DOM changes or page transitions.
   * 
   * After reset, attachToInputs() will process all inputs again.
   * 
   * @returns {void}
   * 
   * @example
   * // Reset after SPA navigation
   * inputHandler.reset();
   * inputHandler.attachToInputs(document);
   */
  reset() {
    this.attachedInputs = new WeakSet();
    logger.debug('Input tracking reset');
  }
}