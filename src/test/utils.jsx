/**
 * Test Utilities
 * 
 * Helper functions for testing React components.
 */

import { render } from '@testing-library/react';
import { AppProvider } from '../contexts/AppContext';
import { ToastProvider } from '../components/ToastContainer';

/**
 * Render component with all necessary providers
 * 
 * @param {JSX.Element} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result
 */
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <AppProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AppProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Create mock chrome storage
 * 
 * @param {Object} initialData - Initial storage data
 * @returns {Object} Mock storage object
 */
export function createMockStorage(initialData = {}) {
  let data = { ...initialData };

  return {
    get: (keys, callback) => {
      const result = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => {
        if (key in data) result[key] = data[key];
      });
      callback(result);
    },
    set: (items, callback) => {
      data = { ...data, ...items };
      if (callback) callback();
    },
    clear: () => {
      data = {};
    },
    getData: () => data,
  };
}

/**
 * Wait for async updates
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));