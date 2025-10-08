/**
 * Text Scrubber Module
 * 
 * Responsible for finding and replacing blocked words in text nodes.
 * Uses TreeWalker API for efficient text node traversal.
 * 
 * Features:
 * - Walks through all text nodes in container
 * - Checks each text node for blocked words
 * - Replaces blocked words with healthy alternatives
 * - Returns count of scrubbed nodes for statistics
 * 
 * This is the core text filtering functionality that cleans
 * visible text content on web pages.
 * 
 * @class TextScrubber
 */
export class TextScrubber {
  /**
   * @param {WellnessUtils} utils - Utility functions
   */
  constructor(utils) {
    this.utils = utils;
  }

  /**
   * Scrub text nodes in container
   * Walks through all text nodes and replaces blocked words
   * 
   * Uses two-pass approach:
   * 1. First pass: Collect nodes that need scrubbing
   * 2. Second pass: Scrub collected nodes
   * 
   * This prevents issues with DOM mutation during traversal.
   * 
   * @param {HTMLElement} element - Container to scrub
   * @returns {number} Number of text nodes scrubbed
   */
  scrubTextNodesIn(element) {
    if (!element) return 0;
    
    // Create TreeWalker for efficient text node traversal
    // TreeWalker is faster than recursively walking the DOM
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT, // Only text nodes
      null,
      false
    );

    let count = 0;
    const nodesToScrub = [];

    // First pass: Collect nodes that need scrubbing
    while (walker.nextNode()) {
      const node = walker.currentNode;
      
      // Check if text node has content and contains blocked words
      if (node.nodeValue && node.nodeValue.trim() && this.utils.containsBlockedWord(node.nodeValue)) {
        nodesToScrub.push(node);
      }
    }

    // Second pass: Scrub collected nodes
    nodesToScrub.forEach(node => {
      const original = node.nodeValue;
      const scrubbed = this.utils.scrubText(original);
      
      // Only update if text changed
      if (scrubbed !== original) {
        node.nodeValue = scrubbed;
        count++;
      }
    });

    return count;
  }
}