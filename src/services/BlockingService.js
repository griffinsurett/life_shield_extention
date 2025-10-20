/**
 * Blocking Service
 * 
 * Centralized service for all blocking logic.
 * Handles hash-based comparison for both sites and words.
 * 
 * Single source of truth for blocking decisions.
 * 
 * @service
 */

import { hashText } from '../utils/hash';
import { STORAGE_KEYS } from '../config';

class BlockingService {
  constructor() {
    this.blockedSiteHashes = [];
    this.blockedWordHashes = [];
    this.enabled = true;
    this.initialized = false;
  }

  /**
   * Initialize the service by loading hashes from storage
   */
  async initialize() {
    try {
      // Load hashes from local storage
      const localData = await chrome.storage.local.get([
        STORAGE_KEYS.BLOCKED_SITES,
        STORAGE_KEYS.BLOCKED_WORDS
      ]);

      // Load settings from sync storage
      const syncData = await chrome.storage.sync.get([
        STORAGE_KEYS.ENABLE_FILTER
      ]);

      this.blockedSiteHashes = localData[STORAGE_KEYS.BLOCKED_SITES] || [];
      this.blockedWordHashes = localData[STORAGE_KEYS.BLOCKED_WORDS] || [];
      this.enabled = syncData[STORAGE_KEYS.ENABLE_FILTER] ?? true;
      this.initialized = true;

      console.log('BlockingService initialized:', {
        sites: this.blockedSiteHashes.length,
        words: this.blockedWordHashes.length,
        enabled: this.enabled
      });
    } catch (error) {
      console.error('Failed to initialize BlockingService:', error);
      throw error;
    }
  }

  /**
   * Check if a URL should be blocked
   * @param {string} url - URL to check
   * @returns {Promise<boolean>}
   */
  async shouldBlockUrl(url) {
    if (!this.enabled || !this.initialized) return false;
    if (!url || this.blockedSiteHashes.length === 0) return false;

    try {
      const urlObj = new URL(url);
      
      // Extract domain and full path
      const domain = urlObj.hostname.replace(/^www\./, '');
      const fullPath = (domain + urlObj.pathname + urlObj.search).replace(/\/$/, '');

      // Hash both and check
      const domainHash = await hashText(domain);
      const pathHash = await hashText(fullPath);

      const isBlocked = this.blockedSiteHashes.includes(domainHash) || 
                       this.blockedSiteHashes.includes(pathHash);

      if (isBlocked) {
        console.log('🚫 Blocked URL:', domain);
      }

      return isBlocked;
    } catch (error) {
      console.error('Error checking URL:', error);
      return false;
    }
  }

  /**
   * Check if text contains blocked words
   * @param {string} text - Text to check
   * @returns {Promise<boolean>}
   */
  async containsBlockedWord(text) {
    if (!this.enabled || !this.initialized) return false;
    if (!text || this.blockedWordHashes.length === 0) return false;

    try {
      const normalized = text.toLowerCase().trim();
      const words = normalized.split(/\s+/);

      // Check each word
      for (const word of words) {
        if (!word) continue;
        
        const wordHash = await hashText(word);
        if (this.blockedWordHashes.includes(wordHash)) {
          console.log('🚫 Blocked word found (hash)');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking text:', error);
      return false;
    }
  }

  /**
   * Reload hashes from storage
   */
  async reload() {
    await this.initialize();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      blockedSiteHashes: this.blockedSiteHashes,
      blockedWordHashes: this.blockedWordHashes,
      enabled: this.enabled,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const blockingService = new BlockingService();