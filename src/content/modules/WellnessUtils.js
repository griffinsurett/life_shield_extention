/**
 * Wellness Utils Module
 * 
 * Core utility functions used throughout the content script.
 * Now with proper logging.
 * 
 * @class WellnessUtils
 */

import { isExtensionContextValid } from '../../utils/chrome';
import { createLogger } from '../../utils/logger';

const logger = createLogger('WellnessUtils');

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
   * Get a random replacement phrase
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
   * 
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains a blocked word
   */
  containsBlockedWord(text) {
    if (!text) return false;
    if (!this.config.ENABLED) return false; // Check if filter is enabled
    
    const lower = text.toLowerCase();
    return this.config.BLOCKED_WORDS.some(word => 
      lower.includes(word.toLowerCase())
    );
  }

  /**
   * Scrub text by replacing blocked words
   * 
   * @param {string} text - Text to scrub
   * @returns {string} Scrubbed text with replacements
   */
  scrubText(text) {
    if (!text) return text;
    if (!this.config.ENABLED) return text; // Don't scrub if disabled
    
    let scrubbed = text;
    let foundCount = 0;
    
    // Replace each blocked word
    this.config.BLOCKED_WORDS.forEach(word => {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'gi'
      );
      
      const matches = scrubbed.match(regex);
      if (matches) {
        foundCount += matches.length;
        // Replace each occurrence with a different random phrase
        scrubbed = scrubbed.replace(regex, () => this.getRandomReplacement());
      }
    });
    
    // Update statistics if anything was found
    if (foundCount > 0) {
      this.sessionFilterCount += foundCount;
      this.updateFilterStats(foundCount);
      logger.debug(`Scrubbed ${foundCount} words in text`);
    }
    
    return scrubbed;
  }

  /**
   * Check URL for blocked content
   */
  checkURL() {
    if (!isExtensionContextValid()) {
      logger.debug('Extension context invalidated, skipping URL check');
      return;
    }

    if (!this.config.ENABLED) return; // Don't check if disabled

    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    
    const query = params.get('q') || params.get('query') || params.get('p') || '';

    if (this.containsBlockedWord(url) || this.containsBlockedWord(query)) {
      logger.info(`Detected blocked word in URL, notifying background`);
      
      try {
        chrome.runtime.sendMessage({
          action: 'blockedUrl',
          url: window.location.href
        });
      } catch (error) {
        logger.safeError('Failed to send message', error);
      }
    }
  }

  /**
   * Update filter statistics
   * 
   * @param {number} count - Number of items filtered
   */
  updateFilterStats(count) {
    if (!isExtensionContextValid()) {
      logger.debug('Extension context invalidated, skipping stats update');
      return;
    }

    logger.debug(`Updating stats with count: ${count}`);
    
    try {
      chrome.storage.local.get(['filterCount', 'todayCount'], (result) => {
        if (chrome.runtime.lastError) {
          logger.safeError('Error reading stats', chrome.runtime.lastError);
          return;
        }

        const newFilterCount = (result.filterCount || 0) + count;
        const newTodayCount = (result.todayCount || 0) + count;
        
        logger.debug(`New counts: filter=${newFilterCount}, today=${newTodayCount}`);
        
        chrome.storage.local.set({
          filterCount: newFilterCount,
          todayCount: newTodayCount
        }, () => {
          if (chrome.runtime.lastError) {
            logger.safeError('Error saving stats', chrome.runtime.lastError);
            return;
          }

          logger.debug('Stats saved, sending updateBadge message');
          
          try {
            chrome.runtime.sendMessage({
              action: 'updateBadge'
            });
          } catch (error) {
            logger.safeError('Failed to send updateBadge message', error);
          }
        });
      });
    } catch (error) {
      logger.safeError('Error in updateFilterStats', error);
    }
  }

  /**
   * Notify background script that content was filtered
   * 
   * @param {number} count - Number of items filtered
   */
  notifyContentFiltered(count) {
    if (!isExtensionContextValid()) {
      return;
    }

    if (this.config.SHOW_ALERTS && count > 0) {
      try {
        chrome.runtime.sendMessage({
          action: 'contentFiltered',
          count: count
        });
      } catch (error) {
        logger.safeError('Failed to send notification', error);
      }
    }
  }
}