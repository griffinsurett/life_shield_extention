/**
 * useConfirmation Hook Tests
 * 
 * Tests confirmation modal state management.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmation } from '../../hooks/useConfirmation';

describe('useConfirmation Hook', () => {
  it('should initialize with modal closed', () => {
    const { result } = renderHook(() => useConfirmation());

    expect(result.current.isOpen).toBe(false);
  });

  it('should open modal with config', () => {
    const { result } = renderHook(() => useConfirmation());
    const onConfirm = vi.fn();

    act(() => {
      result.current.showConfirmation({
        title: 'Delete Item?',
        message: 'Are you sure?',
        onConfirm
      });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.confirmConfig.title).toBe('Delete Item?');
  });

  it('should call onConfirm and close modal', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.showConfirmation({
        title: 'Test',
        onConfirm
      });
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('should close without calling onConfirm on cancel', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmation());

    act(() => {
      result.current.showConfirmation({
        title: 'Test',
        onConfirm
      });
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });
});