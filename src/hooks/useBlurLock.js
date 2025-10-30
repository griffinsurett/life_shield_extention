// src/hooks/useBlurLock.js
import { useEffect } from 'react';

/**
 * Custom hook for automatic locking when tab/window loses focus
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether blur lock is enabled
 * @param {Function} options.onLock - Callback when locked due to blur
 * @param {boolean} options.lockOnVisibilityChange - Lock on tab switch (default: true)
 * @param {boolean} options.lockOnWindowBlur - Lock on window blur (default: false)
 * @param {Function} options.showToast - Toast notification function
 */
export const useBlurLock = ({
  enabled = false,
  onLock,
  lockOnVisibilityChange = true,
  lockOnWindowBlur = false,
  showToast,
} = {}) => {
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (lockOnVisibilityChange && document.hidden) {
        if (onLock) {
          onLock('visibility_change');
        }
        if (showToast) {
          showToast('List locked - you switched tabs', 'info');
        }
      }
    };

    const handleWindowBlur = () => {
      if (lockOnWindowBlur) {
        if (onLock) {
          onLock('window_blur');
        }
      }
    };

    if (lockOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    if (lockOnWindowBlur) {
      window.addEventListener('blur', handleWindowBlur);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, onLock, lockOnVisibilityChange, lockOnWindowBlur, showToast]);
};

export default useBlurLock;