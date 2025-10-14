// src/hooks/useSobrietyTracker.js
import { useState, useEffect, useCallback } from 'react';

export const useSobrietyTracker = () => {
  const [sobrietyDate, setSobrietyDate] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalHours: 0,
    totalMinutes: 0,
    totalSeconds: 0,
    years: 0,
    months: 0
  });

  // Load sobriety date from storage
  useEffect(() => {
    loadSobrietyDate();
    
    // Listen for storage changes (when date is set/reset from other components)
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes.sobrietyDate) {
        if (changes.sobrietyDate.newValue) {
          setSobrietyDate(new Date(changes.sobrietyDate.newValue));
        } else {
          setSobrietyDate(null);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadSobrietyDate = () => {
    chrome.storage.local.get(['sobrietyDate'], (result) => {
      if (result.sobrietyDate) {
        setSobrietyDate(new Date(result.sobrietyDate));
      }
    });
  };

  // Calculate time elapsed
  const calculateTimeElapsed = useCallback(() => {
    if (!sobrietyDate) return;

    const now = new Date();
    const diff = now - sobrietyDate;

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    // Calculate years and months
    const years = Math.floor(days / 365);
    const remainingDaysAfterYears = days % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);

    setTimeElapsed({
      days,
      hours,
      minutes,
      seconds,
      totalHours,
      totalMinutes,
      totalSeconds,
      years,
      months
    });
  }, [sobrietyDate]);

  // Update counter every second
  useEffect(() => {
    if (!sobrietyDate) return;

    calculateTimeElapsed();
    const interval = setInterval(calculateTimeElapsed, 1000);

    return () => clearInterval(interval);
  }, [sobrietyDate, calculateTimeElapsed]);

  // Calculate countdown percentage (starts at 100%, counts down to 0%)
  const getDayProgressPercentage = useCallback(() => {
    const totalSecondsInDay = 24 * 60 * 60;
    const currentDaySeconds = (timeElapsed.hours * 3600) + (timeElapsed.minutes * 60) + timeElapsed.seconds;
    const remainingSeconds = totalSecondsInDay - currentDaySeconds;
    return (remainingSeconds / totalSecondsInDay) * 100;
  }, [timeElapsed.hours, timeElapsed.minutes, timeElapsed.seconds]);

  // Calculate time remaining in the day
  const getTimeRemaining = useCallback(() => {
    const hoursRemaining = 23 - timeElapsed.hours;
    const minutesRemaining = 59 - timeElapsed.minutes;
    const secondsRemaining = 59 - timeElapsed.seconds;
    
    return {
      hours: hoursRemaining,
      minutes: minutesRemaining,
      seconds: secondsRemaining
    };
  }, [timeElapsed.hours, timeElapsed.minutes, timeElapsed.seconds]);

  // Set sobriety date
  const setSobrietyDateStorage = useCallback((date, time = '12:00') => {
    const dateTimeString = `${date}T${time}`;
    const newDate = new Date(dateTimeString);

    if (isNaN(newDate.getTime())) {
      return Promise.reject(new Error('Invalid date'));
    }

    if (newDate > new Date()) {
      return Promise.reject(new Error('Date cannot be in the future'));
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ sobrietyDate: newDate.toISOString() }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          setSobrietyDate(newDate);
          resolve(newDate);
        }
      });
    });
  }, []);

  // Reset sobriety date
  const resetSobrietyDate = useCallback(() => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(['sobrietyDate'], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          setSobrietyDate(null);
          resolve();
        }
      });
    });
  }, []);

  // Get milestones - now supports multiple years
  const getMilestones = useCallback(() => {
    const milestones = [
      { days: 1, emoji: '🌟', title: 'First Day', message: 'Every journey begins with a single step!' },
      { days: 3, emoji: '💪', title: '3 Days Strong', message: 'You\'re building momentum!' },
      { days: 7, emoji: '🔥', title: 'One Week', message: 'A full week of commitment!' },
      { days: 14, emoji: '🎯', title: 'Two Weeks', message: 'You\'re forming new habits!' },
      { days: 30, emoji: '🌈', title: 'One Month', message: 'A major milestone achieved!' },
      { days: 60, emoji: '⭐', title: 'Two Months', message: 'Your transformation is real!' },
      { days: 90, emoji: '🏅', title: 'Three Months', message: 'A quarter year of success!' },
      { days: 180, emoji: '💎', title: 'Six Months', message: 'Half a year of dedication!' },
      { days: 365, emoji: '👑', title: 'One Year', message: 'A full year! You\'re a champion!' },
      { days: 730, emoji: '🏆', title: 'Two Years', message: 'Two years of strength and resilience!' },
      { days: 1095, emoji: '⭐', title: 'Three Years', message: 'Three years of transformation!' },
      { days: 1460, emoji: '💫', title: 'Four Years', message: 'Four years of unwavering commitment!' },
      { days: 1825, emoji: '🌟', title: 'Five Years', message: 'Five years! You\'re an inspiration!' },
    ];

    // If beyond 5 years, generate year milestones dynamically
    const years = timeElapsed.years;
    if (years > 5) {
      // Add milestones for each year beyond 5
      for (let year = 6; year <= years + 1; year++) {
        milestones.push({
          days: year * 365,
          emoji: year % 5 === 0 ? '🎊' : '🎉', // Special emoji every 5 years
          title: `${year} Years`,
          message: year % 5 === 0 
            ? `${year} years! A legendary achievement!` 
            : `${year} years of dedication and strength!`
        });
      }
    }

    const nextMilestone = milestones.find(m => m.days > timeElapsed.days);
    const reachedMilestones = milestones.filter(m => m.days <= timeElapsed.days);

    return { 
      nextMilestone, 
      lastMilestone: reachedMilestones[reachedMilestones.length - 1],
      allMilestones: milestones 
    };
  }, [timeElapsed.days, timeElapsed.years]);

  return {
    sobrietyDate,
    timeElapsed,
    timeRemaining: getTimeRemaining(),
    dayProgressPercentage: getDayProgressPercentage(),
    milestones: getMilestones(),
    setSobrietyDate: setSobrietyDateStorage,
    resetSobrietyDate,
    isTracking: !!sobrietyDate
  };
};