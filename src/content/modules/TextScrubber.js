/**
 * Text Scrubber Module
 * 
 * Handles scrubbing (replacing) blocked words in text nodes.
 * Works on static text content in the DOM.
 * 
 * Complements InputHandler:
 * - InputHandler: Intercepts text as user types
 * - TextScrubber: Replaces text already in the page
 * 
 * Key features:
 * - Walks entire DOM tree efficiently
 * - Skips script and style tags
 * - Preserves page structure
 * - Logs replacement statistics
 * 
 * Performance considerations:
 * - Uses TreeWalker API (faster than recursion)
 * - Processes text nodes only (not elements)
 * - Batch processes to reduce reflows
 * 
 * @class TextScrubber
 * @module content/modules/TextScrubber
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('TextScrubber');

export class TextScrubber {
  /**
   * Create text scrubber instance
   * 
   * @param {WellnessUtils} utils - Utility functions for checking/replacing words
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Scrub text nodes in a container
   * 
   * Process:
   * 1. Create TreeWalker to find all text nodes
   * 2. Filter out scripts, styles, empty text
   * 3. Check each node for blocked words
   * 4. Replace blocked words if found
   * 5. Count replacements made
   * 
   * TreeWalker API:
   * - More efficient than manual recursion
   * - Built-in filtering
   * - Handles DOM changes during walk
   * 
   * Two-pass approach:
   * 1. First pass: Collect nodes to process
   * 2. Second pass: Modify text content
   * 
   * This avoids issues with modifying DOM during traversal.
   * 
   * @param {Element} container - Container to search within
   * @returns {number} Number of text nodes scrubbed
   * 
   * @example
   * // Scrub entire page
   * const count = textScrubber.scrubTextNodesIn(document.body);
   * console.log(`Scrubbed ${count} text nodes`);
   * 
   * @example
   * // Scrub specific section
   * const article = document.querySelector('article');
   * textScrubber.scrubTextNodesIn(article);
   */
  scrubTextNodesIn(container) {
    if (!container) return 0;

    let count = 0;
    
    /**
     * Create TreeWalker to traverse text nodes
     * 
     * TreeWalker is a built-in API for efficiently walking the DOM.
     * 
     * Parameters:
     * - root: Starting point (container)
     * - whatToShow: NodeFilter.SHOW_TEXT (text nodes only)
     * - filter: Custom filter function
     */
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT, // Only text nodes
      {
        /**
         * Filter function for TreeWalker
         * 
         * Returns:
         * - FILTER_ACCEPT: Include this node
         * - FILTER_REJECT: Skip this node and all descendants
         * 
         * Skips:
         * - Text in <script> tags (would break JavaScript)
         * - Text in <style> tags (would break CSS)
         * - Empty or whitespace-only text
         */
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

    /**
     * First pass: Collect nodes to process
     * 
     * We collect nodes first, then modify later.
     * This avoids issues with the tree changing during iteration.
     */
    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToProcess.push(node);
    }

    /**
     * Second pass: Process collected nodes
     * 
     * Now we can safely modify text content without
     * affecting the TreeWalker's iteration.
     */
    for (const textNode of nodesToProcess) {
      try {
        // Get original text content
        const original = textNode.textContent;
        
        // Check if it contains blocked words
        if (this.utils.containsBlockedWord(original)) {
          // Replace blocked words with healthy alternatives
          const scrubbed = this.utils.scrubText(original);
          
          // Update the text node
          textNode.textContent = scrubbed;
          count++;
          
          // Log first 30 characters for debugging
          logger.debug(`Scrubbed text node: "${original.substring(0, 30)}..."`);
        }
      } catch (error) {
        // Log error but continue processing other nodes
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
   * Helper function to determine if we should scrub an element's content.
   * Used for additional filtering beyond TreeWalker.
   * 
   * Skip tags:
   * - SCRIPT: JavaScript code
   * - STYLE: CSS rules
   * - NOSCRIPT: Fallback content
   * - IFRAME: Embedded content (separate document)
   * 
   * @param {Element} element - Element to check
   * @returns {boolean} True if element should be processed
   * 
   * @example
   * if (textScrubber.shouldProcessElement(element)) {
   *   // Process element
   * }
   */
  shouldProcessElement(element) {
    if (!element || !element.tagName) return false;

    // List of tags to never process
    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
    
    return !skipTags.includes(element.tagName);
  }
}