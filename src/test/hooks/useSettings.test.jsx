/**
 * useSettings Hook Tests
 * 
 * Integration tests for settings management hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSettings } from '../../hooks/useSettings';
import { createMockStorage } from '../utils';

describe('useSettings Hook', () => {
  let mockStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStorage = createMockStorage({
      blockedWords: ['test'],
      blockedSites: ['example.com'],
      redirectUrl: 'https://safe.com',
    });

    global.chrome.storage.sync.get = mockStorage.get;
    global.chrome.storage.sync.set = mockStorage.set;
  });

  it('should load initial settings', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings.blockedWords).toEqual(['test']);
    expect(result.current.settings.blockedSites).toEqual(['example.com']);
    expect(result.current.settings.redirectUrl).toBe('https://safe.com');
  });

  it('should update settings', async () => {
    const { result } = renderHook(() => useSettings());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update settings wrapped in act
    await act(async () => {
      await result.current.updateSettings({
        blockedWords: ['test', 'word2']
      });
    });

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.settings.blockedWords).toEqual(['test', 'word2']);
    });
  });
});