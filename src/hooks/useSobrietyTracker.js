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

  /**
   * COMPREHENSIVE MILESTONE DETECTION ALGORITHM
   * This detects ALL meaningful milestones in a recovery journey
   */
  const getCurrentMilestone = useCallback(() => {
    const { days, totalHours } = timeElapsed;
    
    // Early hours (first 24 hours) - crucial for immediate support
    if (totalHours < 24) {
      if (totalHours === 1) return { emoji: '💪', title: 'First Hour', message: 'You took the first step! One hour of strength!', priority: 'high' };
      if (totalHours === 2) return { emoji: '🌟', title: '2 Hours Strong', message: 'Two hours! Keep going!', priority: 'high' };
      if (totalHours === 3) return { emoji: '⭐', title: '3 Hours', message: 'Three hours of courage!', priority: 'high' };
      if (totalHours === 6) return { emoji: '🎯', title: '6 Hours', message: 'Six hours! You\'re building momentum!', priority: 'high' };
      if (totalHours === 12) return { emoji: '🔥', title: '12 Hours', message: 'Half a day! You\'re doing amazing!', priority: 'high' };
      if (totalHours === 18) return { emoji: '💫', title: '18 Hours', message: 'Nearly a full day! Keep pushing!', priority: 'high' };
    }
    
    // First week - celebrate every single day
    if (days === 1) return { emoji: '🌟', title: 'First Day Complete', message: 'You made it through day one! Every journey begins with a single step!', priority: 'critical' };
    if (days === 2) return { emoji: '💪', title: '2 Days Strong', message: 'Two days down! You\'re building strength!', priority: 'high' };
    if (days === 3) return { emoji: '🔥', title: '3 Days', message: 'Three days! You\'re on fire!', priority: 'high' };
    if (days === 4) return { emoji: '⚡', title: '4 Days', message: 'Four days of power!', priority: 'high' };
    if (days === 5) return { emoji: '✨', title: '5 Days', message: 'Five days! You\'re shining!', priority: 'high' };
    if (days === 6) return { emoji: '🎯', title: '6 Days', message: 'Six days! Almost a week!', priority: 'high' };
    
    // Major day milestones
    if (days === 7) return { emoji: '🏆', title: 'One Week', message: 'A full week! This is a huge achievement!', priority: 'critical' };
    if (days === 10) return { emoji: '💎', title: '10 Days', message: 'Ten days strong! Double digits!', priority: 'high' };
    if (days === 14) return { emoji: '🎖️', title: 'Two Weeks', message: 'Two weeks! You\'re forming new habits!', priority: 'critical' };
    if (days === 21) return { emoji: '🌈', title: '3 Weeks', message: 'Three weeks! You\'re creating lasting change!', priority: 'high' };
    if (days === 30) return { emoji: '🥇', title: 'One Month', message: 'A full month! This is a major milestone!', priority: 'critical' };
    if (days === 45) return { emoji: '⭐', title: '45 Days', message: 'Forty-five days! You\'re halfway to 90!', priority: 'high' };
    if (days === 60) return { emoji: '💪', title: 'Two Months', message: 'Two months! Your transformation is real!', priority: 'critical' };
    if (days === 75) return { emoji: '🔥', title: '75 Days', message: 'Seventy-five days of dedication!', priority: 'high' };
    if (days === 90) return { emoji: '🏅', title: '90 Days - Three Months', message: 'Three months! A quarter year of success!', priority: 'critical' };
    if (days === 100) return { emoji: '💯', title: '100 Days', message: 'One hundred days! Triple digits!', priority: 'critical' };
    if (days === 120) return { emoji: '🌟', title: '4 Months', message: 'Four months strong!', priority: 'high' };
    if (days === 150) return { emoji: '⭐', title: '150 Days', message: 'One hundred fifty days! Incredible!', priority: 'high' };
    if (days === 180) return { emoji: '💎', title: 'Six Months', message: 'Half a year! You\'re unstoppable!', priority: 'critical' };
    if (days === 200) return { emoji: '🎯', title: '200 Days', message: 'Two hundred days of strength!', priority: 'high' };
    if (days === 270) return { emoji: '🌈', title: '9 Months', message: 'Nine months! Three quarters of a year!', priority: 'high' };
    if (days === 300) return { emoji: '🔥', title: '300 Days', message: 'Three hundred days! Amazing!', priority: 'high' };
    if (days === 365) return { emoji: '👑', title: 'ONE YEAR!', message: 'A full year! You are a CHAMPION!', priority: 'critical' };
    
    // Multi-year milestones
    if (days === 730) return { emoji: '🏆', title: '2 Years!', message: 'Two years of strength and resilience!', priority: 'critical' };
    if (days === 1095) return { emoji: '⭐', title: '3 Years!', message: 'Three years of transformation!', priority: 'critical' };
    if (days === 1460) return { emoji: '💫', title: '4 Years!', message: 'Four years of unwavering commitment!', priority: 'critical' };
    if (days === 1825) return { emoji: '🌟', title: '5 Years!', message: 'Five years! You\'re an inspiration!', priority: 'critical' };
    
    // Decade and beyond
    if (days === 3650) return { emoji: '🎊', title: '10 YEARS!', message: 'A DECADE! You are a LEGEND!', priority: 'critical' };
    if (days === 5475) return { emoji: '🎉', title: '15 Years!', message: 'Fifteen years! Absolutely incredible!', priority: 'critical' };
    if (days === 7300) return { emoji: '🌟', title: '20 YEARS!', message: 'TWENTY YEARS! You\'ve changed your life!', priority: 'critical' };
    
    // Weekly milestones (every 7 days after first month, up to 1 year)
    if (days > 30 && days < 365 && days % 7 === 0) {
      const weeks = Math.floor(days / 7);
      return { emoji: '📅', title: `${weeks} Weeks`, message: `${weeks} weeks of dedication!`, priority: 'medium' };
    }
    
    // Monthly milestones (every 30 days after 6 months, up to multi-year)
    if (days > 180 && days % 30 === 0 && days % 365 !== 0) {
      const months = Math.floor(days / 30);
      return { emoji: '📆', title: `${months} Months`, message: `${months} months of transformation!`, priority: 'medium' };
    }
    
    // Yearly milestones (every 365 days)
    if (days > 1825 && days % 365 === 0) {
      const years = Math.floor(days / 365);
      return { emoji: '🎂', title: `${years} Years!`, message: `${years} years of victory!`, priority: 'critical' };
    }
    
    // Default: Show current progress
    if (days === 0) {
      return { emoji: '🌱', title: 'Starting Today', message: 'Your journey begins right now!', priority: 'high' };
    }
    
    return null;
  }, [timeElapsed]);

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

  return {
    sobrietyDate,
    timeElapsed,
    timeRemaining: getTimeRemaining(),
    dayProgressPercentage: getDayProgressPercentage(),
    currentMilestone: getCurrentMilestone(),
    setSobrietyDate: setSobrietyDateStorage,
    resetSobrietyDate,
    isTracking: !!sobrietyDate
  };
};