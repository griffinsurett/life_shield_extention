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
import { DEFAULTS, STORAGE_KEYS } from '../config';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    blockedWords: DEFAULTS.BLOCKED_WORDS,
    blockedSites: DEFAULTS.BLOCKED_SITES,
    redirectUrl: DEFAULTS.REDIRECT_URL,
    enableFilter: DEFAULTS.ENABLE_FILTER,
    showAlerts: DEFAULTS.SHOW_ALERTS,
    replacementPhrases: DEFAULTS.REPLACEMENT_PHRASES,
    useCustomUrl: DEFAULTS.USE_CUSTOM_URL,
    customMessage: DEFAULTS.CUSTOM_MESSAGE,
  });
  const [loading, setLoading] = useState(true);

  // Memoized loadSettings function
  const loadSettings = useCallback(async () => {
    const keys = Object.values(STORAGE_KEYS).filter(k => 
      !['filterCount', 'todayCount', 'installDate', 'lastResetDate', 'emailJustVerified', 'verificationSuccessful'].includes(k)
    );
    
    const result = await storage.get(keys);
    
    setSettings({
      blockedWords: result.blockedWords ?? DEFAULTS.BLOCKED_WORDS,
      blockedSites: result.blockedSites ?? DEFAULTS.BLOCKED_SITES,
      redirectUrl: result.redirectUrl ?? DEFAULTS.REDIRECT_URL,
      enableFilter: result.enableFilter ?? DEFAULTS.ENABLE_FILTER,
      showAlerts: result.showAlerts ?? DEFAULTS.SHOW_ALERTS,
      replacementPhrases: result.replacementPhrases ?? DEFAULTS.REPLACEMENT_PHRASES,
      useCustomUrl: result.useCustomUrl ?? DEFAULTS.USE_CUSTOM_URL,
      customMessage: result.customMessage ?? DEFAULTS.CUSTOM_MESSAGE,
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
    
    try {
      // Save to storage
      await storage.set(updates);
      
      // Immediately update local state
      setSettings(prev => {
        const newSettings = { ...prev, ...updates };
        console.log('[useSettings] New settings state:', newSettings);
        return newSettings;
      });
      
      // Broadcast changes
      await sendMessageToTabs({ action: 'reloadConfig' });
      
      console.log('[useSettings] Update successful');
    } catch (error) {
      console.error('[useSettings] Update failed:', error);
      throw error; // Re-throw to let caller handle
    }
  }, []);

  return { settings, updateSettings, loading };
};