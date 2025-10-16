/**
 * Input Handler Module
 * 
 * Intercepts and filters text input in real-time.
 * Replaces blocked words as user types to prevent submission.
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('InputHandler');

export class InputHandler {
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    this.attachedInputs = new WeakSet();
  }

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

  attachInputListener(input) {
    try {
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      input.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

      input.addEventListener('keyup', (e) => {
        this.handleInputChange(e.target);
      }, { passive: true });

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

  handleInputChange(input) {
    if (!this.config.ENABLED) return;

    try {
      const value = input.value;
      
      if (this.utils.containsBlockedWord(value)) {
        const scrubbed = this.utils.scrubText(value);
        
        if (scrubbed !== value) {
          const cursorPos = input.selectionStart;
          const lengthDiff = scrubbed.length - value.length;
          
          input.value = scrubbed;
          
          const newPos = Math.max(0, cursorPos + lengthDiff);
          input.setSelectionRange(newPos, newPos);
          
          logger.debug(`Input value scrubbed: "${value}" -> "${scrubbed}"`);
          
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } catch (error) {
      logger.safeError('Error handling input change', error);
    }
  }

  reset() {
    this.attachedInputs = new WeakSet();
    logger.debug('Input tracking reset');
  }
}