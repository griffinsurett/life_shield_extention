// src/hooks/useRateLimiting.js
import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../config';

/**
 * Custom hook for rate limiting passcode attempts
 * 
 * @param {Object} options
 * @param {number} options.maxAttempts - Maximum attempts before lockout (default: 5)
 * @param {number} options.lockoutDuration - Lockout duration in ms (default: 1 hour)
 * @returns {Object} Rate limiting state and controls
 */
export const useRateLimiting = ({
  maxAttempts = 5,
  lockoutDuration = 60 * 60 * 1000, // 1 hour
} = {}) => {
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts);
  const [lockoutEndsAt, setLockoutEndsAt] = useState(null);

  /**
   * Check lockout status on mount
   */
  useEffect(() => {
    checkLockoutStatus();
  }, []);

  /**
   * Check if currently locked out
   */
  const checkLockoutStatus = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get([
        'passcode_lockout',
        'failed_attempts'
      ]);

      const lockoutUntil = result.passcode_lockout;
      const failedAttempts = result.failed_attempts || 0;

      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLockedOut(true);
        setLockoutEndsAt(lockoutUntil);
        setRemainingAttempts(0);
      } else {
        // Lockout expired or doesn't exist
        if (lockoutUntil) {
          await chrome.storage.local.remove(['passcode_lockout', 'failed_attempts']);
        }
        setIsLockedOut(false);
        setLockoutEndsAt(null);
        setRemainingAttempts(maxAttempts - failedAttempts);
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  }, [maxAttempts]);

  /**
   * Record a failed attempt
   */
  const recordFailedAttempt = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get(['failed_attempts']);
      const failedAttempts = (result.failed_attempts || 0) + 1;

      await chrome.storage.local.set({ failed_attempts: failedAttempts });
      setRemainingAttempts(maxAttempts - failedAttempts);

      if (failedAttempts >= maxAttempts) {
        const lockoutUntil = Date.now() + lockoutDuration;
        await chrome.storage.local.set({ passcode_lockout: lockoutUntil });
        setIsLockedOut(true);
        setLockoutEndsAt(lockoutUntil);
        return { locked: true, attempts: failedAttempts };
      }

      return { locked: false, attempts: failedAttempts };
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      return { locked: false, attempts: 0 };
    }
  }, [maxAttempts, lockoutDuration]);

  /**
   * Clear failed attempts (on successful login)
   */
  const clearAttempts = useCallback(async () => {
    try {
      await chrome.storage.local.remove(['failed_attempts', 'passcode_lockout']);
      setRemainingAttempts(maxAttempts);
      setIsLockedOut(false);
      setLockoutEndsAt(null);
    } catch (error) {
      console.error('Error clearing attempts:', error);
    }
  }, [maxAttempts]);

  /**
   * Get remaining lockout time in minutes
   */
  const getRemainingLockoutTime = useCallback(() => {
    if (!lockoutEndsAt) return 0;
    const remaining = lockoutEndsAt - Date.now();
    return Math.ceil(remaining / 60000); // Convert to minutes
  }, [lockoutEndsAt]);

  return {
    isLockedOut,
    remainingAttempts,
    lockoutEndsAt,
    recordFailedAttempt,
    clearAttempts,
    checkLockoutStatus,
    getRemainingLockoutTime,
  };
};

export default useRateLimiting;