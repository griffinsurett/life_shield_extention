/**
 * useListManager Hook Tests
 * 
 * Tests list management with add, remove, clear functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListManager } from '../../hooks/useListManager';
import { ToastProvider } from '../../components/ToastContainer';

// Wrapper with ToastProvider
const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('useListManager Hook', () => {
  let mockUpdateItems;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateItems = vi.fn();
  });

  it('should initialize with empty input', () => {
    const { result } = renderHook(
      () => useListManager(['item1', 'item2'], mockUpdateItems),
      { wrapper }
    );

    expect(result.current.inputValue).toBe('');
  });

  it('should update input value', () => {
    const { result } = renderHook(
      () => useListManager([], mockUpdateItems),
      { wrapper }
    );

    act(() => {
      result.current.setInputValue('test input');
    });

    expect(result.current.inputValue).toBe('test input');
  });

  it('should add item to list', async () => {
    const { result } = renderHook(
      () => useListManager(['existing'], mockUpdateItems, {
        requireConfirmation: false
      }),
      { wrapper }
    );

    act(() => {
      result.current.setInputValue('new item');
    });

    await act(async () => {
      await result.current.addItem();
    });

    expect(mockUpdateItems).toHaveBeenCalled();
    expect(result.current.inputValue).toBe('');
  });

  it('should remove item by index', async () => {
    const { result } = renderHook(
      () => useListManager(['item1', 'item2'], mockUpdateItems),
      { wrapper }
    );

    await act(async () => {
      await result.current.removeItem(0);
    });

    expect(mockUpdateItems).toHaveBeenCalled();
  });
});