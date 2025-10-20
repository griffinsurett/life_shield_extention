/**
 * Text Scrubber Module
 * 
 * Handles text node scrubbing and replacement.
 * Now supports async hashing for protected words.
 * 
 * @class TextScrubber
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('TextScrubber');

export class TextScrubber {
  /**
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Scrub text nodes in a container
   * Now uses async checking/scrubbing for hashed words
   * 
   * @param {Element} container - Container to search
   * @returns {Promise<number>} Number of nodes scrubbed
   */
  async scrubTextNodesIn(container) {
    if (!container) return 0;

    let count = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style tags
          if (node.parentElement?.tagName === 'SCRIPT' ||
              node.parentElement?.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty nodes
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToProcess.push(node);
    }

    // Process nodes with async hashing
    for (const textNode of nodesToProcess) {
      try {
        const original = textNode.textContent;
        
        // Async check if blocked
        if (await this.utils.containsBlockedWord(original)) {
          // Async scrub with hashing
          const scrubbed = await this.utils.scrubText(original);
          textNode.textContent = scrubbed;
          count++;
          logger.debug(`Scrubbed text node`);
        }
      } catch (error) {
        logger.safeError('Error scrubbing text node', error);
      }
    }

    if (count > 0) {
      logger.debug(`Scrubbed ${count} text nodes`);
    }

    return count;
  }

  /**
   * Check if element should be processed
   * 
   * @param {Element} element - Element to check
   * @returns {boolean}
   */
  shouldProcessElement(element) {
    if (!element || !element.tagName) return false;

    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
    return !skipTags.includes(element.tagName);
  }
}