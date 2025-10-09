/**
 * Input Handler Module
 * 
 * Handles input field interception and filtering.
 * Now with proper logging.
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
    const selectors = this.config.INPUT_SELECTORS.join(', ');
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
      // Handle input event
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      // Handle change event
      input.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      // Handle keyup for immediate feedback
      input.addEventListener('keyup', (e) => {
        this.handleInputChange(e.target);
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
    try {
      const value = input.value;
      
      if (this.utils.containsBlockedWord(value)) {
        const scrubbed = this.utils.scrubText(value);
        input.value = scrubbed;
        logger.debug('Input value scrubbed');
        
        // Trigger input event for frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
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