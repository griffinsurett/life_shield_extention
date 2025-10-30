// src/hooks/useSecurityLock.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing security lock state with automatic locking features
 * 
 * @param {Object} options
 * @param {boolean} options.isProtected - Whether content is protected
 * @param {Function} options.onLock - Callback when content is locked
 * @param {Function} options.showToast - Toast notification function
 * @param {number} options.inactivityTimeout - Inactivity timeout in ms (default: 5 min)
 * @param {boolean} options.lockOnBlur - Lock when tab loses focus (default: true)
 * @param {boolean} options.lockOnScreenshot - Lock on screenshot attempt (default: true)
 * @returns {Object} Security lock state and controls
 */
export const useSecurityLock = ({
  isProtected = false,
  onLock,
  showToast,
  inactivityTimeout = 5 * 60 * 1000, // 5 minutes
  lockOnBlur = true,
  lockOnScreenshot = true,
} = {}) => {
  const [isUnlocked, setIsUnlocked] = useState(!isProtected);
  const [unlockTimestamp, setUnlockTimestamp] = useState(null);

  /**
   * Unlock the content and set timestamp
   */
  const unlock = useCallback(() => {
    const timestamp = Date.now();
    setUnlockTimestamp(timestamp);
    sessionStorage.setItem('unlock_timestamp', timestamp);
    setIsUnlocked(true);
  }, []);

  /**
   * Lock the content and clear timestamp
   */
  const lock = useCallback((reason) => {
    setIsUnlocked(false);
    setUnlockTimestamp(null);
    sessionStorage.removeItem('unlock_timestamp');
    
    if (onLock) {
      onLock(reason);
    }
  }, [onLock]);

  /**
   * Check and restore unlock state from session storage
   */
  useEffect(() => {
    if (!isProtected) {
      setIsUnlocked(true);
      return;
    }

    const timestamp = sessionStorage.getItem('unlock_timestamp');
    if (timestamp) {
      const timeElapsed = Date.now() - parseInt(timestamp);
      
      if (timeElapsed < inactivityTimeout) {
        setIsUnlocked(true);
        setUnlockTimestamp(parseInt(timestamp));
      } else {
        sessionStorage.removeItem('unlock_timestamp');
      }
    }
  }, [isProtected, inactivityTimeout]);

  /**
   * Get remaining time until auto-lock
   */
  const getRemainingTime = useCallback(() => {
    if (!unlockTimestamp) return 0;
    const elapsed = Date.now() - unlockTimestamp;
    const remaining = inactivityTimeout - elapsed;
    return Math.max(0, remaining);
  }, [unlockTimestamp, inactivityTimeout]);

  return {
    isUnlocked,
    unlock,
    lock,
    getRemainingTime,
  };
};

export default useSecurityLock;