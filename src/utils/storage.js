/**
 * Storage Utilities
 * 
 * Wrapper functions for Chrome storage APIs.
 * Provides Promise-based interface and convenience methods.
 * 
 * Chrome storage has two areas:
 * - sync: Synced across devices, limited to 100KB
 * - local: Local to device, up to 5MB
 * 
 * We use:
 * - sync for settings (user preferences)
 * - local for statistics (device-specific)
 * 
 * @module utils/storage
 */

import { createLogger } from './logger';

const logger = createLogger('Storage');

/**
 * Storage object with Promise-based methods
 * Wraps chrome.storage API for easier async/await usage
 */
export const storage = {
  /**
   * Get items from sync storage
   * 
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<Object>} Object with requested keys and values
   * 
   * @example
   * const result = await storage.get('blockedWords');
   * const words = result.blockedWords;
   * 
   * @example
   * const result = await storage.get(['blockedWords', 'redirectUrl']);
   * const { blockedWords, redirectUrl } = result;
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          logger.error('Get error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          logger.debug(`Retrieved: ${JSON.stringify(keys)} → ${JSON.stringify(result)}`);
          resolve(result);
        }
      });
    });
  },

  /**
   * Set items in sync storage
   * 
   * @param {Object} items - Object with key-value pairs to store
   * @returns {Promise<void>}
   * 
   * @example
   * await storage.set({ blockedWords: ['word1', 'word2'] });
   */
  async set(items) {
    return new Promise((resolve, reject) => {
      logger.debug(`Saving: ${JSON.stringify(items)}`);
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          logger.error('Set error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          logger.debug(`Successfully saved: ${JSON.stringify(items)}`);
          resolve();
        }
      });
    });
  },

  /**
   * Get items from local storage
   * Used for statistics that shouldn't sync across devices
   * 
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<Object>} Object with requested keys and values
   * 
   * @example
   * const result = await storage.getLocal('todayCount');
   * const count = result.todayCount;
   */
  async getLocal(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          logger.error('Get local error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Set items in local storage
   * 
   * @param {Object} items - Object with key-value pairs to store
   * @returns {Promise<void>}
   * 
   * @example
   * await storage.setLocal({ todayCount: 5 });
   */
  async setLocal(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          logger.error('Set local error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Register listener for storage changes
   * Callback receives changes object and namespace
   * 
   * @param {Function} callback - Called when storage changes
   * 
   * @example
   * storage.onChanged((changes, namespace) => {
   *   if (namespace === 'sync' && changes.blockedWords) {
   *     console.log('Words updated:', changes.blockedWords.newValue);
   *   }
   * });
   */
  onChanged(callback) {
    chrome.storage.onChanged.addListener(callback);
  }
};

/**
 * Send message to all content scripts
 * Useful for notifying tabs when settings change
 * 
 * Ignores errors (tab might not have content script loaded)
 * This is normal for chrome:// pages, extension pages, etc.
 * 
 * @param {Object} message - Message object to send
 * @returns {Promise<void>}
 * 
 * @example
 * await sendMessageToTabs({ action: 'reloadConfig' });
 */
export const sendMessageToTabs = async (message) => {
  // Get all tabs
  const tabs = await chrome.tabs.query({});
  
  // Send message to each tab
  tabs.forEach(tab => {
    // Catch errors (some tabs don't have content scripts)
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Silently ignore - this is normal for some tabs
    });
  });
};