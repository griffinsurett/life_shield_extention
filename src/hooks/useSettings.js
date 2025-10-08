import { useState, useEffect } from 'react';
import { storage, sendMessageToTabs } from '../utils/storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../utils/constants';

export const useSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();

    const listener = (changes, namespace) => {
      if (namespace === 'sync') {
        loadSettings();
      }
    };

    storage.onChanged(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const loadSettings = async () => {
    const keys = Object.values(STORAGE_KEYS).filter(k => 
      !['filterCount', 'todayCount', 'installDate', 'lastResetDate'].includes(k)
    );
    const result = await storage.get(keys);
    
    setSettings({
      blockedWords: result.blockedWords ?? DEFAULT_SETTINGS.blockedWords,
      blockedSites: result.blockedSites ?? DEFAULT_SETTINGS.blockedSites, // CHANGED
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

  const updateSettings = async (updates) => {
    await storage.set(updates);
    setSettings(prev => ({ ...prev, ...updates }));
    await sendMessageToTabs({ action: 'reloadConfig' });
  };

  return { settings, updateSettings, loading };
};