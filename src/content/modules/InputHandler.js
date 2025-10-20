/**
 * Input Handler Module
 * 
 * Handles input field monitoring and scrubbing.
 * Now supports async hashing for protected words.
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
   * Attach listeners to all inputs in container
   * 
   * @param {Element} container - Container to search
   * @returns {number} Number of new inputs attached
   */
  attachToInputs(container) {
    if (!container) return 0;

    let count = 0;
    const selector = this.config.SELECTORS.INPUT.join(', ');

    try {
      const inputs = container.querySelectorAll(selector);

      for (const input of inputs) {
        if (!this.attachedInputs.has(input)) {
          this.attachListener(input);
          this.attachedInputs.add(input);
          count++;
        }
      }

      if (count > 0) {
        logger.debug(`Attached to ${count} new inputs`);
      }

      return count;
    } catch (error) {
      logger.safeError('Error attaching to inputs', error);
      return 0;
    }
  }

  /**
   * Attach event listener to input
   * 
   * @param {HTMLInputElement} input - Input element
   */
  attachListener(input) {
    try {
      input.setAttribute('data-filter-attached', 'true');

      // Use arrow function to maintain context
      const handler = () => this.handleInputChange(input);

      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
      input.addEventListener('paste', handler);

      logger.debug(`Listener attached to ${input.tagName}`);
    } catch (error) {
      logger.safeError('Error attaching input listener', error);
    }
  }

  /**
   * Handle input value change
   * Now uses async checking/scrubbing for hashed words
   * 
   * @param {HTMLInputElement} input - Input element
   */
  async handleInputChange(input) {
    if (!this.config.ENABLED) return;

    try {
      const value = input.value;
      
      // Async check with hashing
      if (await this.utils.containsBlockedWord(value)) {
        // Async scrub with hashing
        const scrubbed = await this.utils.scrubText(value);
        
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
          
          logger.debug(`Input value scrubbed`);
          
          // Trigger events for frameworks
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