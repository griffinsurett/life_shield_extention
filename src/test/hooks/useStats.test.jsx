/**
 * useStats Hook Tests
 * 
 * Integration tests for statistics hook.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStats } from '../../hooks/useStats';
import { createMockStorage } from '../utils';

describe('useStats Hook', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage({
      filterCount: 100,
      todayCount: 5,
      installDate: '2024-01-01',
    });

    global.chrome.storage.local.get = mockStorage.get;
    global.chrome.storage.local.set = mockStorage.set;
  });

  it('should load initial stats', async () => {
    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.stats.filterCount).toBe(100);
    });

    expect(result.current.stats.todayCount).toBe(5);
    expect(result.current.stats.installDate).toBe('2024-01-01');
  });

  it('should reset stats', async () => {
    const { result } = renderHook(() => useStats());

    await waitFor(() => {
      expect(result.current.stats.filterCount).toBe(100);
    });

    await result.current.resetStats();

    await waitFor(() => {
      expect(result.current.stats.filterCount).toBe(0);
      expect(result.current.stats.todayCount).toBe(0);
    });
  });
});