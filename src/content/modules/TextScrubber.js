/**
 * Text Scrubber Module
 * 
 * Handles scrubbing (replacing) blocked words in text nodes.
 * Works on static text content in the DOM.
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('TextScrubber');

export class TextScrubber {
  constructor(utils) {
    this.utils = utils;
  }

  scrubTextNodesIn(container) {
    if (!container) return 0;

    let count = 0;
    
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement?.tagName === 'SCRIPT' ||
              node.parentElement?.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          
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

  shouldProcessElement(element) {
    if (!element || !element.tagName) return false;

    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
    
    return !skipTags.includes(element.tagName);
  }
}