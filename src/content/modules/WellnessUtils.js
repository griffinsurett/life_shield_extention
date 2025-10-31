// src/content/modules/WellnessUtils.js
/**
 * Wellness Utils Module
 *
 * Core utility functions used throughout the content script.
 * Now supports hashed blocked words AND phrases with performance caching.
 *
 * @class WellnessUtils
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { containsHashedWord, scrubTextWithHashes } from "../../utils/hashing";

const logger = createLogger("WellnessUtils");

export class WellnessUtils {
  /**
   * @param {WellnessConfig} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    this.sessionFilterCount = 0;
    this.checkCache = new Map(); // Cache check results for performance
  }

  /**
   * Get a random replacement phrase
   *
   * @returns {string} Random healthy phrase
   */
  getRandomReplacement() {
    const phrases = this.config.REPLACEMENT_PHRASES;
    if (!phrases || phrases.length === 0) {
      return "wellness";
    }
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Check if text contains any blocked words or phrases (hashed comparison)
   * Supports both single words and multi-word phrases
   * WITH PERFORMANCE CACHING
   *
   * @param {string} text - Text to check
   * @returns {Promise<boolean>} True if text contains a blocked word/phrase
   */
  async containsBlockedWord(text) {
    if (!text) return false;
    if (!this.config.ENABLED) return false;
    if (this.config.BLOCKED_WORDS.length === 0) return false;

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.checkCache.has(cacheKey)) {
      return this.checkCache.get(cacheKey);
    }

    try {
      const result = await containsHashedWord(text, this.config.BLOCKED_WORDS);
      
      // Cache result (with size limit to prevent memory issues)
      if (this.checkCache.size > 500) {
        // Remove oldest entry
        const firstKey = this.checkCache.keys().next().value;
        this.checkCache.delete(firstKey);
      }
      this.checkCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.safeError("Error checking blocked word", error);
      return false;
    }
  }

  /**
   * Scrub text by replacing blocked words and phrases
   * Supports multi-word phrase detection and replacement
   *
   * @param {string} text - Text to scrub
   * @returns {Promise<string>} Scrubbed text with replacements
   */
  async scrubText(text) {
    if (!text) return text;
    if (!this.config.ENABLED) return text;
    if (this.config.BLOCKED_WORDS.length === 0) return text;

    try {
      const result = await scrubTextWithHashes(
        text,
        this.config.BLOCKED_WORDS,
        () => this.getRandomReplacement()
      );

      // Update statistics if anything was found
      if (result.matchCount > 0) {
        this.sessionFilterCount += result.matchCount;
        this.updateFilterStats(result.matchCount);
        logger.debug(`Scrubbed ${result.matchCount} words/phrases in text`);
      }

      return result.scrubbedText;
    } catch (error) {
      logger.safeError("Error scrubbing text", error);
      return text; // Return original on error
    }
  }

  /**
   * Check URL for blocked content
   * Now uses hashed comparison
   */
  async checkURL() {
    if (!isExtensionContextValid()) {
      logger.debug("Extension context invalidated, skipping URL check");
      return;
    }

    if (!this.config.ENABLED) return;

    try {
      const url = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const query =
        params.get("q") || params.get("query") || params.get("p") || "";

      // Check URL and query parameters
      const hasBlockedInUrl = await this.containsBlockedWord(url);
      const hasBlockedInQuery = query ? await this.containsBlockedWord(query) : false;

      if (hasBlockedInUrl || hasBlockedInQuery) {
        logger.info(`Detected blocked word/phrase in URL, notifying background`);

        try {
          chrome.runtime.sendMessage({
            action: "blockedUrl",
            url: window.location.href,
          });
        } catch (error) {
          logger.safeError("Failed to send message", error);
        }
      }
    } catch (error) {
      logger.safeError("Error checking URL", error);
    }
  }

  /**
   * Update filter statistics
   *
   * @param {number} count - Number of items filtered
   */
  updateFilterStats(count) {
    if (!isExtensionContextValid()) {
      logger.debug("Extension context invalidated, skipping stats update");
      return;
    }

    logger.debug(`Updating stats with count: ${count}`);

    try {
      chrome.storage.local.get(["filterCount", "todayCount"], (result) => {
        if (chrome.runtime.lastError) {
          logger.safeError("Error reading stats", chrome.runtime.lastError);
          return;
        }

        const newFilterCount = (result.filterCount || 0) + count;
        const newTodayCount = (result.todayCount || 0) + count;

        logger.debug(
          `New counts: filter=${newFilterCount}, today=${newTodayCount}`
        );

        chrome.storage.local.set(
          {
            filterCount: newFilterCount,
            todayCount: newTodayCount,
          },
          () => {
            if (chrome.runtime.lastError) {
              logger.safeError("Error saving stats", chrome.runtime.lastError);
              return;
            }

            logger.debug("Stats saved, sending updateBadge message");

            try {
              chrome.runtime.sendMessage({
                action: "updateBadge",
              });
            } catch (error) {
              logger.safeError("Failed to send updateBadge message", error);
            }
          }
        );
      });
    } catch (error) {
      logger.safeError("Error in updateFilterStats", error);
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
          action: "contentFiltered",
          count: count,
        });
      } catch (error) {
        logger.safeError("Failed to send notification", error);
      }
    }
  }

  /**
   * Clear check cache (useful when blocked words change)
   */
  clearCache() {
    this.checkCache.clear();
    logger.debug('Check cache cleared');
  }
}