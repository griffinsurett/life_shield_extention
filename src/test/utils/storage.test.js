/**
 * Storage Tests
 * 
 * Tests for storage wrapper functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage } from '../../utils/storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storage.get', () => {
    it('should get items from sync storage', async () => {
      global.chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ blockedWords: ['test'] });
      });

      const result = await storage.get('blockedWords');
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('blockedWords', expect.any(Function));
      expect(result).toEqual({ blockedWords: ['test'] });
    });
  });

  describe('storage.set', () => {
    it('should set items in sync storage', async () => {
      await storage.set({ blockedWords: ['test'] });
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { blockedWords: ['test'] },
        expect.any(Function)
      );
    });
  });

  describe('storage.getLocal', () => {
    it('should get items from local storage', async () => {
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ todayCount: 5 });
      });

      const result = await storage.getLocal('todayCount');
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('todayCount', expect.any(Function));
      expect(result).toEqual({ todayCount: 5 });
    });
  });

  describe('storage.setLocal', () => {
    it('should set items in local storage', async () => {
      await storage.setLocal({ todayCount: 10 });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { todayCount: 10 },
        expect.any(Function)
      );
    });
  });

  describe('storage.onChanged', () => {
    it('should register change listener', () => {
      const callback = vi.fn();
      storage.onChanged(callback);
      
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalledWith(callback);
    });
  });
});