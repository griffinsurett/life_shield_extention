/**
 * Wellness Utils Module
 * 
 * Core utility functions used throughout the content script.
 * Provides text checking, scrubbing, statistics, and notifications.
 * 
 * @class WellnessUtils
 */

import { isExtensionContextValid } from '../../utils/chrome';

export class WellnessUtils {
  /**
   * @param {WellnessConfig} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    
    // Track total filtered in this session (not persisted)
    this.sessionFilterCount = 0;
  }

  /**
   * Log message to console if debug mode is enabled
   * 
   * @param {string} msg - Message to log
   */
  log(msg) {
    if (this.config.DEBUG_MODE) {
      console.log(`[Wellness Filter] ${msg}`);
    }
  }

  /**
   * Get a random replacement phrase
   * Selects randomly from configured replacement phrases
   * 
   * @returns {string} Random healthy phrase
   */
  getRandomReplacement() {
    const phrases = this.config.REPLACEMENT_PHRASES;
    if (!phrases || phrases.length === 0) {
      return 'wellness'; // Fallback
    }
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Check if text contains any blocked words
   * Case-insensitive search
   * 
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains a blocked word
   */
  containsBlockedWord(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.config.BLOCKED_WORDS.some(word => 
      lower.includes(word.toLowerCase())
    );
  }

  /**
   * Scrub text by replacing blocked words with healthy alternatives
   * Uses regex for case-insensitive replacement
   * Updates statistics for each replacement
   * 
   * @param {string} text - Text to scrub
   * @returns {string} Scrubbed text with replacements
   */
  scrubText(text) {
    let scrubbed = text;
    let foundCount = 0;
    
    // Replace each blocked word
    this.config.BLOCKED_WORDS.forEach(word => {
      // Create regex that matches word case-insensitively
      // Escape special regex characters in word
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'gi' // global, case-insensitive
      );
      
      // Count matches
      const matches = scrubbed.match(regex);
      if (matches) {
        foundCount += matches.length;
        
        // Replace all matches with random healthy phrase
        scrubbed = scrubbed.replace(regex, this.getRandomReplacement());
      }
    });
    
    // Update statistics if anything was found
    if (foundCount > 0) {
      this.sessionFilterCount += foundCount;
      this.updateFilterStats(foundCount);
    }
    
    return scrubbed;
  }

  /**
   * Check URL for blocked content
   * Checks both the URL itself and query parameters
   * Sends message to background script if blocked content found
   */
  checkURL() {
    // Check if extension context is valid
    if (!isExtensionContextValid()) {
      this.log('Extension context invalidated, skipping URL check');
      return;
    }

    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    
    // Check common search parameter names
    const query = params.get('q') || params.get('query') || params.get('p') || '';

    // If URL or query contains blocked words, notify background
    if (this.containsBlockedWord(url) || this.containsBlockedWord(query)) {
      this.log(`Detected blocked word in URL, notifying background script`);
      
      try {
        chrome.runtime.sendMessage({
          action: 'blockedUrl',
          url: window.location.href
        });
      } catch {
        this.log('Failed to send message: Extension context may be invalidated');
      }
    }
  }

  /**
   * Update filter statistics
   * Increments counters in local storage and updates badge
   * Handles extension context invalidation gracefully
   * 
   * @param {number} count - Number of items filtered
   */
  updateFilterStats(count) {
    // Check if extension context is valid
    if (!isExtensionContextValid()) {
      this.log('Extension context invalidated, skipping stats update');
      return;
    }

    console.log('[WellnessUtils] Updating stats with count:', count);
    
    // Update local storage stats
    try {
      chrome.storage.local.get(['filterCount', 'todayCount'], (result) => {
        // Check for chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          console.log('[WellnessUtils] Error reading stats:', chrome.runtime.lastError);
          return;
        }

        // Calculate new counts
        const newFilterCount = (result.filterCount || 0) + count;
        const newTodayCount = (result.todayCount || 0) + count;
        
        console.log('[WellnessUtils] New counts:', { newFilterCount, newTodayCount });
        
        // Save updated counts
        chrome.storage.local.set({
          filterCount: newFilterCount,
          todayCount: newTodayCount
        }, () => {
          // Check for errors
          if (chrome.runtime.lastError) {
            console.log('[WellnessUtils] Error saving stats:', chrome.runtime.lastError);
            return;
          }

          console.log('[WellnessUtils] Stats saved, sending updateBadge message');
          
          // Notify background to update badge
          try {
            chrome.runtime.sendMessage({
              action: 'updateBadge'
            });
          } catch {
            console.log('[WellnessUtils] Failed to send updateBadge message');
          }
        });
      });
    } catch (error) {
      console.log('[WellnessUtils] Error in updateFilterStats:', error);
    }
  }

  /**
   * Notify background script that content was filtered
   * Sends message with count of filtered items
   * Background script shows notification and updates stats
   * 
   * @param {number} count - Number of items filtered
   */
  notifyContentFiltered(count) {
    // Check if extension context is valid
    if (!isExtensionContextValid()) {
      return;
    }

    if (this.config.SHOW_ALERTS && count > 0) {
      try {
        chrome.runtime.sendMessage({
          action: 'contentFiltered',
          count: count
        });
      } catch {
        this.log('Failed to send notification: Extension context may be invalidated');
      }
    }
  }
}