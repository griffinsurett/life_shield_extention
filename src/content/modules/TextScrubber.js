/**
 * Text Scrubber Module
 * 
 * Handles text node scrubbing and replacement.
 * Now with proper logging.
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
   * 
   * @param {Element} container - Container to search
   * @returns {number} Number of nodes scrubbed
   */
  scrubTextNodesIn(container) {
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

    for (const textNode of nodesToProcess) {
      try {
        const original = textNode.textContent;
        
        if (this.utils.containsBlockedWord(original)) {
          const scrubbed = this.utils.scrubText(original);
          textNode.textContent = scrubbed;
          count++;
          logger.debug(`Scrubbed text node: "${original.substring(0, 30)}..."`);
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