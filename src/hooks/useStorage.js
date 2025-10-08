/**
 * Storage Hook
 * 
 * Generic hook for managing a single value in Chrome storage.
 * Provides real-time synchronization with storage changes.
 * 
 * Features:
 * - Loads value from storage
 * - Auto-updates when storage changes
 * - Provides update function
 * - Loading state
 * - Default value support
 * 
 * @hook
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Array} [value, updateValue, loading]
 */

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial value
    storage.get([key]).then((result) => {
      setValue(result[key] ?? defaultValue);
      setLoading(false);
    });

    /**
     * Listen for storage changes
     * Update value when it changes in storage
     */
    const listener = (changes, namespace) => {
      if (namespace === 'sync' && changes[key]) {
        setValue(changes[key].newValue ?? defaultValue);
      }
    };

    storage.onChanged(listener);
    
    // Cleanup
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key, defaultValue]);

  /**
   * Update value in storage
   * Also updates local state
   * 
   * @param {*} newValue - New value to store
   */
  const updateValue = async (newValue) => {
    await storage.set({ [key]: newValue });
    setValue(newValue);
  };

  return [value, updateValue, loading];
};