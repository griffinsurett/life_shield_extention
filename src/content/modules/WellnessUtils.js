/**
 * Wellness Utils Module
 *
 * Core utility functions used throughout the content script.
 * Now supports hashed blocked words AND phrases.
 * Supports optional replacement phrases (can erase instead).
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
  }

  /**
   * Get a replacement string for blocked content
   * Returns empty string if replacements are disabled
   *
   * @returns {string} Replacement text or empty string
   */
  getReplacementString() {
    // If replacement phrases are disabled, return empty string (erase mode)
    if (!this.config.USE_REPLACEMENT_PHRASES) {
      return "";
    }

    // Otherwise, return a random healthy phrase
    const phrases = this.config.REPLACEMENT_PHRASES;
    if (!phrases || phrases.length === 0) {
      return "wellness";
    }
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Check if text contains any blocked words or phrases (hashed comparison)
   * Supports both single words and multi-word phrases
   *
   * @param {string} text - Text to check
   * @returns {Promise<boolean>} True if text contains a blocked word/phrase
   */
  async containsBlockedWord(text) {
    if (!text) return false;
    if (!this.config.ENABLED) return false;
    if (this.config.BLOCKED_WORDS.length === 0) return false;

    try {
      return await containsHashedWord(text, this.config.BLOCKED_WORDS);
    } catch (error) {
      logger.safeError("Error checking blocked word", error);
      return false;
    }
  }

  /**
   * Scrub text by replacing or erasing blocked words and phrases
   * Supports multi-word phrase detection
   * Behavior depends on USE_REPLACEMENT_PHRASES setting:
   * - true: replaces with random healthy phrases
   * - false: erases blocked content (replaces with empty string)
   *
   * @param {string} text - Text to scrub
   * @returns {Promise<string>} Scrubbed text with replacements or erasures
   */
  async scrubText(text) {
    if (!text) return text;
    if (!this.config.ENABLED) return text;
    if (this.config.BLOCKED_WORDS.length === 0) return text;

    try {
      const result = await scrubTextWithHashes(
        text,
        this.config.BLOCKED_WORDS,
        () => this.getReplacementString()
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
      const hasBlockedInQuery = query
        ? await this.containsBlockedWord(query)
        : false;

      if (hasBlockedInUrl || hasBlockedInQuery) {
        this.sessionFilterCount++;
        this.updateFilterStats(1);
        await this.redirectToBlockedPage();
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
    if (!isExtensionContextValid()) return;

    try {
      chrome.runtime.sendMessage({
        type: "UPDATE_STATS",
        count: count,
      });
    } catch (error) {
      logger.safeError("Error updating stats", error);
    }
  }

  /**
   * Redirect to blocked page
   */
  async redirectToBlockedPage() {
    if (!isExtensionContextValid()) return;

    try {
      const blockedPageUrl = chrome.runtime.getURL(
        "src/pages/blocked/index.html"
      );
      window.location.href = blockedPageUrl;
    } catch (error) {
      logger.safeError("Error redirecting to blocked page", error);
    }
  }
}