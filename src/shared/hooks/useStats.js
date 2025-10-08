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
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const resetStats = async () => {
    await storage.setLocal({
      filterCount: 0,
      todayCount: 0,
      lastResetDate: new Date().toISOString()
    });
    loadStats();
  };

  return { stats, resetStats, loadStats };
};