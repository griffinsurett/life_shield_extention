/**
 * Settings Hook
 * 
 * Manages extension settings with Chrome storage sync.
 * Provides settings state and update function.
 * 
 * Features:
 * - Loads settings from chrome.storage.sync
 * - Provides default values
 * - Auto-reloads when storage changes
 * - Sends reload message to content scripts on update
 * - Loading state
 * 
 * @hook
 * @returns {Object} Object with settings, updateSettings, and loading state
 */

import { useState, useEffect } from 'react';
import { storage, sendMessageToTabs } from '../utils/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../utils/constants';

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial settings
    loadSettings();

    /**
     * Listen for storage changes
     * Reload settings when they change in storage
     */
    const listener = (changes, namespace) => {
      if (namespace === 'sync') {
        loadSettings();
      }
    };

    storage.onChanged(listener);
    
    // Cleanup
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  /**
   * Load settings from storage
   * Merges with defaults to ensure all settings exist
   */
  const loadSettings = async () => {
    // Get all setting keys except statistics
    const keys = Object.values(STORAGE_KEYS).filter(k => 
      !['filterCount', 'todayCount', 'installDate', 'lastResetDate'].includes(k)
    );
    
    const result = await storage.get(keys);
    
    // Merge with defaults using nullish coalescing
    setSettings({
      blockedWords: result.blockedWords ?? DEFAULT_SETTINGS.blockedWords,
      blockedSites: result.blockedSites ?? DEFAULT_SETTINGS.blockedSites,
      redirectUrl: result.redirectUrl ?? DEFAULT_SETTINGS.redirectUrl,
      enableFilter: result.enableFilter ?? DEFAULT_SETTINGS.enableFilter,
      debugMode: result.debugMode ?? DEFAULT_SETTINGS.debugMode,
      showAlerts: result.showAlerts ?? DEFAULT_SETTINGS.showAlerts,
      blurInsteadOfHide: result.blurInsteadOfHide ?? DEFAULT_SETTINGS.blurInsteadOfHide,
      scanInterval: result.scanInterval ?? DEFAULT_SETTINGS.scanInterval,
      mutationDebounce: result.mutationDebounce ?? DEFAULT_SETTINGS.mutationDebounce,
      replacementPhrases: result.replacementPhrases ?? DEFAULT_SETTINGS.replacementPhrases,
    });
    
    setLoading(false);
  };

  /**
   * Update settings in storage
   * Also updates local state and notifies content scripts
   * 
   * @param {Object} updates - Settings to update
   */
  const updateSettings = async (updates) => {
    // Save to storage
    await storage.set(updates);
    
    // Update local state
    setSettings(prev => ({ ...prev, ...updates }));
    
    // Notify all tabs to reload config
    await sendMessageToTabs({ action: 'reloadConfig' });
  };

  return { settings, updateSettings, loading };
};