import { useState, useEffect, useCallback } from 'react';

export const useSessionTimeout = (timeoutMinutes = 15, onTimeout) => {
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check for timeout every minute
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (timeSinceLastActivity > timeoutMs) {
        onTimeout();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity, timeoutMinutes, onTimeout, resetActivity]);

  return { resetActivity };
};