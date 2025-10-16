/**
 * Wellness Utils Module
 *
 * Core utility functions used throughout the content script.
 * Provides word checking, text replacement, URL validation, and stats.
 * 
 * Central module that connects to:
 * - Configuration (blocked words, replacement phrases)
 * - Chrome storage (statistics)
 * - Background script (notifications, badge updates)
 * 
 * Key responsibilities:
 * - Check if text contains blocked words
 * - Replace blocked words with healthy phrases
 * - Validate URLs for blocked content
 * - Track and update filter statistics
 * - Send notifications to background
 * 
 * @class WellnessUtils
 * @module content/modules/WellnessUtils
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";

const logger = createLogger("WellnessUtils");

export class WellnessUtils {
  /**
   * Create utilities instance
   * 
   * @param {WellnessConfig} config - Configuration object with settings
   */
  constructor(config) {
    this.config = config;

    // Track total filtered this session (not persisted to storage)
    // Used for determining when to show notifications
    this.sessionFilterCount = 0;
  }

  /**
   * Get a random replacement phrase
   * 
   * Selects randomly from configured replacement phrases.
   * These are positive, wellness-focused alternatives.
   * 
   * Default phrases include:
   * - "yoga for beginners"
   * - "meditation techniques"
   * - "healthy recipes"
   * - etc.
   * 
   * Randomization ensures variety and natural feel.
   * 
   * @returns {string} Random healthy phrase
   * 
   * @example
   * const phrase = utils.getRandomReplacement();
   * // "breathing exercises" or "mindfulness practice"
   */
  getRandomReplacement() {
    const phrases = this.config.REPLACEMENT_PHRASES;
    
    // Fallback if no phrases configured
    if (!phrases || phrases.length === 0) {
      return "wellness";
    }
    
    // Return random phrase
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Check if text contains any blocked words
   * 
   * Process:
   * 1. Convert text to lowercase for case-insensitive matching
   * 2. Check each blocked word against text
   * 3. Return true if ANY match found
   * 
   * Why lowercase:
   * - Blocked words stored in lowercase
   * - Ensures case-insensitive matching
   * - "BLOCKED" matches "blocked" matches "BLoCKeD"
   * 
   * Performance:
   * - Uses Array.some() (stops at first match)
   * - More efficient than checking all words
   * 
   * @param {string} text - Text to check for blocked words
   * @returns {boolean} True if text contains any blocked word
   * 
   * @example
   * if (utils.containsBlockedWord("some text here")) {
   *   // Text contains blocked content
   * }
   */
  containsBlockedWord(text) {
    if (!text) return false;
    
    // Respect the enable filter setting
    if (!this.config.ENABLED) return false;

    // Convert to lowercase for comparison
    const lower = text.toLowerCase();
    
    // Check if any blocked word is present
    // Array.some() returns true on first match (efficient)
    return this.config.BLOCKED_WORDS.some((word) =>
      lower.includes(word.toLowerCase())
    );
  }

  /**
   * Scrub text by replacing blocked words
   * 
   * Process:
   * 1. Start with original text
   * 2. For each blocked word:
   *    - Find all occurrences (case-insensitive)
   *    - Replace each with a different random phrase
   *    - Count replacements
   * 3. Update statistics if replacements made
   * 4. Return scrubbed text
   * 
   * Why different random phrases:
   * - Each occurrence gets unique replacement
   * - More natural result
   * - Less repetitive
   * 
   * Regex construction:
   * - Escapes special characters in word
   * - 'gi' flags: global + case-insensitive
   * - Finds all matches, not just first
   * 
   * @param {string} text - Text to scrub
   * @returns {string} Scrubbed text with replacements
   * 
   * @example
   * const clean = utils.scrubText("text with blocked word");
   * // "text with meditation techniques" (or other random phrase)
   */
  scrubText(text) {
    if (!text) return text;
    
    // Respect the enable filter setting
    if (!this.config.ENABLED) return text;

    let scrubbed = text;
    let foundCount = 0;

    // Process each blocked word
    this.config.BLOCKED_WORDS.forEach((word) => {
      /**
       * Create case-insensitive regex for this word
       * 
       * Steps:
       * 1. Escape special regex characters in word
       *    (e.g., "." becomes "\.", prevents regex interpretation)
       * 2. Create RegExp with 'gi' flags:
       *    - g: global (find all matches, not just first)
       *    - i: case-insensitive
       */
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), // Escape special chars
        "gi" // Flags: global + case-insensitive
      );

      // Find all matches of this word
      const matches = scrubbed.match(regex);
      
      if (matches) {
        // Count total matches found
        foundCount += matches.length;
        
        /**
         * Replace each occurrence with a different random phrase
         * 
         * Using arrow function as replacer:
         * - Called once for each match
         * - Returns different phrase each time
         * - Creates more natural variation
         */
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
   * 
   * Checks both:
   * 1. URL itself (full URL string)
   * 2. Query parameters (especially search queries)
   * 
   * Common query parameters checked:
   * - q: Google, DuckDuckGo
   * - query: Generic search
   * - p: Yahoo
   * 
   * If blocked content found:
   * - Sends message to background script
   * - Background handles redirection
   * 
   * Why not redirect directly:
   * - Content scripts have limited permissions
   * - Background script handles navigation
   * - Allows proper stats tracking
   * 
   * @returns {void}
   * 
   * @example
   * // Called automatically on page load and navigation
   * utils.checkURL();
   */
  checkURL() {
    // Verify extension context still valid
    if (!isExtensionContextValid()) {
      logger.debug("Extension context invalidated, skipping URL check");
      return;
    }

    // Respect the enable filter setting
    if (!this.config.ENABLED) return;

    // Get current URL
    const url = window.location.href;
    
    // Parse query parameters
    const params = new URLSearchParams(window.location.search);

    // Extract search query from common parameter names
    const query =
      params.get("q") ||      // Google, DuckDuckGo
      params.get("query") ||  // Generic
      params.get("p") ||      // Yahoo
      "";

    // Check URL or query for blocked words
    if (this.containsBlockedWord(url) || this.containsBlockedWord(query)) {
      logger.info(`Detected blocked word in URL, notifying background`);

      try {
        /**
         * Send blockedUrl message to background script
         * 
         * Background script will:
         * - Increment statistics
         * - Show notification (if enabled)
         * - Redirect to blocked page or custom URL
         */
        chrome.runtime.sendMessage({
          action: "blockedUrl",
          url: window.location.href,
        });
      } catch (error) {
        logger.safeError("Failed to send message", error);
      }
    }
  }

  /**
   * Update filter statistics
   * 
   * Updates two counters:
   * - filterCount: Total all-time blocks
   * - todayCount: Today's blocks (resets daily)
   * 
   * Process:
   * 1. Read current counts from storage
   * 2. Add new count to both
   * 3. Save updated counts
   * 4. Trigger badge update
   * 
   * Storage used:
   * - chrome.storage.local (device-specific)
   * - Not synced across devices
   * 
   * Badge update:
   * - Sends message to background
   * - Background updates extension icon badge
   * - Shows today's count on icon
   * 
   * @param {number} count - Number of items filtered
   * @returns {void}
   * 
   * @example
   * // Called automatically by scrubText()
   * // Can also be called manually:
   * utils.updateFilterStats(5);
   */
  updateFilterStats(count) {
    // Verify extension context still valid
    if (!isExtensionContextValid()) {
      logger.debug("Extension context invalidated, skipping stats update");
      return;
    }

    logger.debug(`Updating stats with count: ${count}`);

    try {
      /**
       * Read current stats from storage
       * 
       * Gets:
       * - filterCount: Total lifetime count
       * - todayCount: Today's count
       * 
       * Defaults to 0 if not found.
       */
      chrome.storage.local.get(["filterCount", "todayCount"], (result) => {
        // Check for storage errors
        if (chrome.runtime.lastError) {
          logger.safeError("Error reading stats", chrome.runtime.lastError);
          return;
        }

        // Calculate new counts
        const newFilterCount = (result.filterCount || 0) + count;
        const newTodayCount = (result.todayCount || 0) + count;

        logger.debug(
          `New counts: filter=${newFilterCount}, today=${newTodayCount}`
        );

        /**
         * Save updated counts to storage
         * 
         * Both counters updated atomically.
         */
        chrome.storage.local.set(
          {
            filterCount: newFilterCount,
            todayCount: newTodayCount,
          },
          () => {
            // Check for save errors
            if (chrome.runtime.lastError) {
              logger.safeError("Error saving stats", chrome.runtime.lastError);
              return;
            }

            logger.debug("Stats saved, sending updateBadge message");

            try {
              /**
               * Trigger badge update
               * 
               * Background script listens for this message and:
               * - Reads todayCount
               * - Updates extension icon badge
               * - Badge shows number on extension icon
               */
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
   * Sends notification only if:
   * - Alerts are enabled
   * - Count is greater than 0
   * 
   * Background script will:
   * - Show browser notification
   * - Include count in notification
   * 
   * Used for:
   * - Informing user of filtering activity
   * - Transparency about what was blocked
   * - Can be disabled in settings
   * 
   * @param {number} count - Number of items filtered
   * @returns {void}
   * 
   * @example
   * // After filtering 5 words
   * utils.notifyContentFiltered(5);
   */
  notifyContentFiltered(count) {
    // Verify extension context still valid
    if (!isExtensionContextValid()) {
      return;
    }

    // Only notify if alerts enabled and count > 0
    if (this.config.SHOW_ALERTS && count > 0) {
      try {
        /**
         * Send contentFiltered message to background
         * 
         * Background script will:
         * - Check showAlerts setting (double-check)
         * - Create browser notification
         * - Show "X words filtered" message
         */
        chrome.runtime.sendMessage({
          action: "contentFiltered",
          count: count,
        });
      } catch (error) {
        logger.safeError("Failed to send notification", error);
      }
    }
  }
}