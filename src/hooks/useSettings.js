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
    useReplacementPhrases: DEFAULTS.USE_REPLACEMENT_PHRASES,
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
      useReplacementPhrases: result.useReplacementPhrases ?? DEFAULTS.USE_REPLACEMENT_PHRASES,
      useCustomUrl: result.useCustomUrl ?? DEFAULTS.USE_CUSTOM_URL,
      customMessage: result.customMessage ?? DEFAULTS.CUSTOM_MESSAGE,
    });
    
    setLoading(false);
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes, areaName) => {
      if (areaName !== 'sync') return;
      
      setSettings(prevSettings => {
        const newSettings = { ...prevSettings };
        
        if (changes.blockedWords) newSettings.blockedWords = changes.blockedWords.newValue ?? DEFAULTS.BLOCKED_WORDS;
        if (changes.blockedSites) newSettings.blockedSites = changes.blockedSites.newValue ?? DEFAULTS.BLOCKED_SITES;
        if (changes.redirectUrl) newSettings.redirectUrl = changes.redirectUrl.newValue ?? DEFAULTS.REDIRECT_URL;
        if (changes.enableFilter) newSettings.enableFilter = changes.enableFilter.newValue ?? DEFAULTS.ENABLE_FILTER;
        if (changes.showAlerts) newSettings.showAlerts = changes.showAlerts.newValue ?? DEFAULTS.SHOW_ALERTS;
        if (changes.replacementPhrases) newSettings.replacementPhrases = changes.replacementPhrases.newValue ?? DEFAULTS.REPLACEMENT_PHRASES;
        if (changes.useReplacementPhrases) newSettings.useReplacementPhrases = changes.useReplacementPhrases.newValue ?? DEFAULTS.USE_REPLACEMENT_PHRASES;
        if (changes.useCustomUrl) newSettings.useCustomUrl = changes.useCustomUrl.newValue ?? DEFAULTS.USE_CUSTOM_URL;
        if (changes.customMessage) newSettings.customMessage = changes.customMessage.newValue ?? DEFAULTS.CUSTOM_MESSAGE;
        
        return newSettings;
      });
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  /**
   * Update settings in storage
   * Notifies all tabs of the change
   * 
   * @param {Object} updates - Settings to update
   */
  const updateSettings = useCallback(async (updates) => {
    // Update local state immediately
    setSettings(prev => ({ ...prev, ...updates }));
    
    // Save to storage
    await storage.set(updates);
    
    // Notify all tabs
    await sendMessageToTabs({ type: 'SETTINGS_UPDATED', settings: updates });
  }, []);

  return {
    settings,
    updateSettings,
    loading
  };
};