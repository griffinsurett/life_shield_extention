/**
 * Session Timeout Hook
 * 
 * Tracks user activity and triggers callback after inactivity period.
 * Can be used for auto-locking sensitive settings pages.
 * 
 * Features:
 * - Tracks mouse, keyboard, scroll, and touch events
 * - Configurable timeout period
 * - Automatic cleanup
 * - Activity reset function
 * 
 * @hook
 * @param {number} timeoutMinutes - Minutes of inactivity before timeout (default: 15)
 * @param {Function} onTimeout - Called when timeout occurs
 * @returns {Object} Object with resetActivity function
 */

import { useState, useEffect, useCallback } from 'react';

export const useSessionTimeout = (timeoutMinutes = 15, onTimeout) => {
  // Track last activity timestamp
  const [lastActivity, setLastActivity] = useState(Date.now());

  /**
   * Reset activity timestamp
   * Call this when user performs any action
   */
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Events to track for activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    /**
     * Handle any activity event
     * Resets the inactivity timer
     */
    const handleActivity = () => {
      resetActivity();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    /**
     * Check for timeout every minute
     * If inactive for longer than timeout period, trigger callback
     */
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity > timeoutMs) {
        onTimeout();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity, timeoutMinutes, onTimeout, resetActivity]);

  return { resetActivity };
};