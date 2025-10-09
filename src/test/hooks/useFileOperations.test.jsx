/**
 * useFileOperations Hook Tests
 * 
 * Tests file import/export functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileOperations } from '../../hooks/useFileOperations';
import { ToastProvider } from '../../components/ToastContainer';

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('useFileOperations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('exportToFile', () => {
    it('should create download with data', () => {
      const { result } = renderHook(() => useFileOperations(), { wrapper });

      act(() => {
        const data = ['word1', 'word2', 'word3'];
        result.current.exportToFile(data, 'test.json', 'words');
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      const { result } = renderHook(() => useFileOperations(), { wrapper });

      act(() => {
        result.current.exportToFile([], 'empty.json', 'items');
      });

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('importFromFile', () => {
    it('should trigger file input creation', () => {
      const { result } = renderHook(() => useFileOperations(), { wrapper });
      const mockCallback = vi.fn();

      // Mock document.createElement to spy on file input creation
      const createElementSpy = vi.spyOn(document, 'createElement');

      act(() => {
        result.current.importFromFile(mockCallback, 'words');
      });

      // Verify input element was created
      expect(createElementSpy).toHaveBeenCalledWith('input');
      
      createElementSpy.mockRestore();
    });

    it('should accept JSON files', () => {
      const { result } = renderHook(() => useFileOperations(), { wrapper });
      const mockCallback = vi.fn();

      let capturedInput = null;
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const element = originalCreateElement(tag);
        if (tag === 'input') {
          capturedInput = element;
        }
        return element;
      });

      act(() => {
        result.current.importFromFile(mockCallback, 'words');
      });

      // Check the captured input has correct accept attribute
      expect(capturedInput).toBeTruthy();
      expect(capturedInput.accept).toBe('.json');
      
      createElementSpy.mockRestore();
    });
  });
});