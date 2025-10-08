/**
 * Stats Hook
 * 
 * Manages statistics tracking with Chrome local storage.
 * Provides stats state and reset function.
 * 
 * Features:
 * - Loads stats from chrome.storage.local
 * - Auto-refreshes every 5 seconds
 * - Provides reset function
 * - Returns filterCount, todayCount, and installDate
 * 
 * @hook
 * @returns {Object} Object with stats, resetStats, and loadStats functions
 */

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

export const useStats = () => {
  const [stats, setStats] = useState({
    filterCount: 0,
    todayCount: 0,
    installDate: new Date().toLocaleDateString()
  });

  useEffect(() => {
    // Load initial stats
    loadStats();
    
    // Refresh every 5 seconds to stay up-to-date
    const interval = setInterval(loadStats, 5000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);

  /**
   * Load statistics from local storage
   */
  const loadStats = async () => {
    const result = await storage.getLocal([
      STORAGE_KEYS.FILTER_COUNT,
      STORAGE_KEYS.TODAY_COUNT,
      STORAGE_KEYS.INSTALL_DATE
    ]);

    setStats({
      filterCount: result.filterCount ?? 0,
      todayCount: result.todayCount ?? 0,
      installDate: result.installDate ?? new Date().toLocaleDateString()
    });
  };

  /**
   * Reset all statistics to zero
   * Keeps installDate but resets counts
   */
  const resetStats = async () => {
    await storage.setLocal({
      filterCount: 0,
      todayCount: 0,
      lastResetDate: new Date().toISOString()
    });
    
    // Reload to reflect changes
    loadStats();
  };

  return { stats, resetStats, loadStats };
};