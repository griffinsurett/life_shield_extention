/**
 * Settings Hook
 * 
 * Manages extension settings with Chrome storage sync.
 * Performance settings removed - now hardcoded for simplicity.
 * Blur mode removed for better recovery focus.
 * 
 * @hook
 */

import { useState, useEffect, useCallback } from 'react';
import { storage, sendMessageToTabs } from '../utils/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../utils/constants';

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Memoized loadSettings function
  const loadSettings = useCallback(async () => {
    const keys = Object.values(STORAGE_KEYS).filter(k => 
      !['filterCount', 'todayCount', 'installDate', 'lastResetDate'].includes(k)
    );
    
    const result = await storage.get(keys);
    
    setSettings({
      blockedWords: result.blockedWords ?? DEFAULT_SETTINGS.blockedWords,
      blockedSites: result.blockedSites ?? DEFAULT_SETTINGS.blockedSites,
      redirectUrl: result.redirectUrl ?? DEFAULT_SETTINGS.redirectUrl,
      enableFilter: result.enableFilter ?? DEFAULT_SETTINGS.enableFilter,
      showAlerts: result.showAlerts ?? DEFAULT_SETTINGS.showAlerts,
      replacementPhrases: result.replacementPhrases ?? DEFAULT_SETTINGS.replacementPhrases,
      useCustomUrl: result.useCustomUrl ?? DEFAULT_SETTINGS.useCustomUrl,
      customMessage: result.customMessage ?? DEFAULT_SETTINGS.customMessage,
    });
    
    setLoading(false);
  }, []); // No dependencies - uses constants

  useEffect(() => {
    // Load initial settings
    loadSettings();

    // Listen for storage changes
    const listener = (changes, namespace) => {
      if (namespace === 'sync') {
        loadSettings();
      }
    };

    storage.onChanged(listener);
    
    // Cleanup
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [loadSettings]);

  /**
   * Update settings in storage
   * Now with immediate filter state broadcast
   */
  const updateSettings = useCallback(async (updates) => {
    console.log('[useSettings] Updating settings:', updates);
    
    // Save to storage
    await storage.set(updates);
    
    // Immediately update local state
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      console.log('[useSettings] New settings state:', newSettings);
      return newSettings;
    });
    
    // Verify what was saved
    setTimeout(async () => {
      const keys = Object.keys(updates);
      const result = await storage.get(keys);
      console.log('[useSettings] Verified storage contains:', result);
    }, 100);
    
    // If filter state changed, broadcast immediately to all tabs
    if ('enableFilter' in updates) {
      try {
        const tabs = await chrome.tabs.query({});
        
        // Send immediate filter state change message
        const broadcastPromises = tabs.map(tab =>
          chrome.tabs.sendMessage(tab.id, {
            action: 'filterStateChanged',
            enabled: updates.enableFilter,
            timestamp: Date.now()
          }).catch(() => {
            // Ignore errors - some tabs don't have content scripts
            // (chrome:// pages, extension pages, etc.)
          })
        );
        
        await Promise.allSettled(broadcastPromises);
      } catch (error) {
        console.warn('[useSettings] Error broadcasting filter state:', error);
      }
    }
    
    // Still send generic reload for other settings
    await sendMessageToTabs({ action: 'reloadConfig' });
  }, []);

  return { settings, updateSettings, loading };
};