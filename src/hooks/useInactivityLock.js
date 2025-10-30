// src/hooks/useInactivityLock.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook for automatic locking after inactivity
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether inactivity lock is enabled
 * @param {Function} options.onLock - Callback when locked due to inactivity
 * @param {number} options.timeout - Inactivity timeout in ms (default: 5 min)
 * @param {Array<string>} options.events - Events that reset timer (default: mouse, keyboard, scroll, touch)
 * @param {Function} options.showToast - Toast notification function
 */
export const useInactivityLock = ({
  enabled = false,
  onLock,
  timeout = 5 * 60 * 1000, // 5 minutes
  events = ['mousedown', 'keydown', 'scroll', 'touchstart'],
  showToast,
} = {}) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (onLock) {
          onLock('inactivity');
        }
        if (showToast) {
          showToast('List locked due to inactivity', 'info');
        }
      }, timeout);
    };

    // Set up event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, onLock, timeout, events, showToast]);

  /**
   * Manually reset the inactivity timer
   */
  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return { resetTimer };
};

export default useInactivityLock;