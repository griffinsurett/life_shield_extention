/**
 * Stats Hook
 * 
 * Manages statistics tracking with Chrome local storage.
 * Now with optimized dependency arrays.
 * 
 * @hook
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { STATS_REFRESH_INTERVAL } from '../utils/timing';

export const useStats = () => {
  const [stats, setStats] = useState({
    filterCount: 0,
    todayCount: 0,
    installDate: new Date().toLocaleDateString()
  });

  /**
   * Load statistics from local storage
   * Memoized to prevent unnecessary re-creation
   */
  const loadStats = useCallback(async () => {
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
  }, []); // No dependencies - uses constants

  useEffect(() => {
    // Load initial stats
    loadStats();
    
    // Refresh every 5 seconds to stay up-to-date
    const interval = setInterval(loadStats, STATS_REFRESH_INTERVAL);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [loadStats]);

  /**
   * Reset all statistics to zero
   * Memoized to prevent unnecessary re-renders
   */
  const resetStats = useCallback(async () => {
    await storage.setLocal({
      filterCount: 0,
      todayCount: 0,
      lastResetDate: new Date().toISOString()
    });
    
    // Reload to reflect changes
    loadStats();
  }, [loadStats]);

  return { stats, resetStats, loadStats };
};