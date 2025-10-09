/**
 * Test Setup
 * 
 * Global test configuration and mocks.
 * Runs before all tests.
 */

import { afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setLogLevel } from '../utils/logger';

// Set log level to error only during tests (suppresses debug/info logs)
beforeAll(() => {
  setLogLevel('error');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Chrome APIs
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`),
  },
  storage: {
    sync: {
      get: vi.fn((keys, callback) => {
        callback({});
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback();
      }),
    },
    local: {
      get: vi.fn((keys, callback) => {
        callback({});
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  notifications: {
    create: vi.fn((id, options, callback) => {
      if (callback) callback('notification-id');
    }),
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn(() => Promise.resolve()),
    getDynamicRules: vi.fn(() => Promise.resolve([])),
  },
  webNavigation: {
    onBeforeNavigate: {
      addListener: vi.fn(),
    },
    onCommitted: {
      addListener: vi.fn(),
    },
    onBeforeRedirect: {
      addListener: vi.fn(),
    },
  },
};