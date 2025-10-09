/**
 * Logger Tests
 * 
 * Tests for centralized logging system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import individual functions instead of importing from chrome.js (which uses logger)
import {
  logError,
  logWarn,
  logInfo,
  logDebug,
  setLogLevel,
  createLogger,
  isContextError,
} from '../../utils/logger';

describe('Logger', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleLogSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    setLogLevel('debug');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Log Levels', () => {
    it('should log errors', () => {
      logError('TestContext', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('TestContext');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message');
    });

    it('should log warnings', () => {
      logWarn('TestContext', 'Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('TestContext');
    });

    it('should log info messages', () => {
      logInfo('TestContext', 'Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('should log debug messages', () => {
      logDebug('TestContext', 'Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('DEBUG');
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level - error only', () => {
      setLogLevel('error');
      
      logError('Test', 'Error');
      logWarn('Test', 'Warning');
      logInfo('Test', 'Info');
      logDebug('Test', 'Debug');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    });

    it('should respect log level - info', () => {
      setLogLevel('info');
      
      logError('Test', 'Error');
      logWarn('Test', 'Warning');
      logInfo('Test', 'Info');
      logDebug('Test', 'Debug');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Error Detection', () => {
    it('should detect extension context invalidation error', () => {
      const error = new Error('Extension context invalidated');
      expect(isContextError(error)).toBe(true);
    });

    it('should detect cannot access error', () => {
      const error = new Error('Cannot access chrome');
      expect(isContextError(error)).toBe(true);
    });

    it('should not detect regular errors', () => {
      const error = new Error('Regular error');
      expect(isContextError(error)).toBe(false);
    });
  });

  describe('Logger Factory', () => {
    it('should create logger with context', () => {
      const logger = createLogger('MyModule');
      
      logger.info('Test message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('MyModule');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Test message');
    });

    it('should provide all log methods', () => {
      const logger = createLogger('Test');
      
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('safeError');
    });
  });
});