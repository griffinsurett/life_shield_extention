/**
 * Chrome Utils Tests
 * 
 * Tests for Chrome API wrapper functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isExtensionContextValid,
  safeChrome,
  safeChromeAsync,
  isContextInvalidationError,
} from '../../utils/chrome';

describe('Chrome Utils', () => {
  describe('isExtensionContextValid', () => {
    it('should return true when chrome runtime exists', () => {
      expect(isExtensionContextValid()).toBe(true);
    });

    it('should return false when chrome runtime is missing', () => {
      const originalChrome = global.chrome;
      global.chrome = undefined;
      
      expect(isExtensionContextValid()).toBe(false);
      
      global.chrome = originalChrome;
    });
  });

  describe('safeChrome', () => {
    it('should execute function and return result', () => {
      const result = safeChrome(() => 'test result');
      expect(result).toBe('test result');
    });

    it('should return fallback on error', () => {
      const result = safeChrome(
        () => { throw new Error('Test error'); },
        'fallback'
      );
      expect(result).toBe('fallback');
    });

    it('should return null by default on error', () => {
      const result = safeChrome(() => { throw new Error('Test'); });
      expect(result).toBeNull();
    });
  });

  describe('safeChromeAsync', () => {
    it('should execute async function and return result', async () => {
      const result = await safeChromeAsync(async () => 'async result');
      expect(result).toBe('async result');
    });

    it('should return fallback on error', async () => {
      const result = await safeChromeAsync(
        async () => { throw new Error('Async error'); },
        'async fallback'
      );
      expect(result).toBe('async fallback');
    });
  });

  describe('isContextInvalidationError', () => {
    it('should detect context invalidation errors', () => {
      const error1 = new Error('Extension context invalidated');
      const error2 = new Error('Cannot access chrome');
      const error3 = new Error('Extension manifest');
      
      expect(isContextInvalidationError(error1)).toBe(true);
      expect(isContextInvalidationError(error2)).toBe(true);
      expect(isContextInvalidationError(error3)).toBe(true);
    });

    it('should not detect regular errors', () => {
      const error = new Error('Regular error message');
      expect(isContextInvalidationError(error)).toBe(false);
    });
  });
});