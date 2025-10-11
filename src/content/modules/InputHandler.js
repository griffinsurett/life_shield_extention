/**
 * Input Handler Module
 * 
 * Handles input field interception and filtering.
 * Now with proper logging and immediate text replacement.
 * 
 * @class InputHandler
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('InputHandler');

export class InputHandler {
  /**
   * @param {WellnessConfig} config - Configuration
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    this.attachedInputs = new WeakSet();
  }

  /**
   * Attach to input fields in container
   * 
   * @param {Element} container - Container to search
   * @returns {number} Number of new inputs attached
   */
  attachToInputs(container) {
    if (!container) return 0;

    let count = 0;
    const selectors = this.config.SELECTORS.INPUT.join(', ');
    const inputs = container.querySelectorAll(selectors);

    for (const input of inputs) {
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
   * Attach event listeners to input
   * 
   * @param {HTMLInputElement} input - Input element
   */
  attachInputListener(input) {
    try {
      // Handle input event (fires on every keystroke)
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      // Handle change event (fires when input loses focus)
      input.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      // Handle keyup for immediate feedback
      input.addEventListener('keyup', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      // Handle paste events
      input.addEventListener('paste', (e) => {
        // Small delay to let the paste complete
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
   * Handle input value change
   * 
   * @param {HTMLInputElement} input - Input element
   */
  handleInputChange(input) {
    if (!this.config.ENABLED) return; // Don't process if filter is disabled

    try {
      const value = input.value;
      
      if (this.utils.containsBlockedWord(value)) {
        const scrubbed = this.utils.scrubText(value);
        
        // Only update if the value actually changed
        if (scrubbed !== value) {
          // Save cursor position
          const cursorPos = input.selectionStart;
          const lengthDiff = scrubbed.length - value.length;
          
          // Update value
          input.value = scrubbed;
          
          // Restore cursor position (adjusted for length change)
          const newPos = Math.max(0, cursorPos + lengthDiff);
          input.setSelectionRange(newPos, newPos);
          
          logger.debug(`Input value scrubbed: "${value}" -> "${scrubbed}"`);
          
          // Trigger input event for frameworks (React, Vue, etc.)
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
   */
  reset() {
    this.attachedInputs = new WeakSet();
    logger.debug('Input tracking reset');
  }
}