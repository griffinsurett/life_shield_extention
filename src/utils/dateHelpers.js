// src/utils/dateHelpers.js

/**
 * Date Helper Utilities
 * 
 * Common date/time formatting and manipulation functions.
 * 
 * @module utils/dateHelpers
 */

/**
 * Get current date in YYYY-MM-DD format for date inputs
 * 
 * @returns {string} Current date in YYYY-MM-DD format
 * 
 * @example
 * const today = getCurrentDate(); // "2025-01-15"
 */
export function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format for time inputs
 * 
 * @returns {string} Current time in HH:MM format
 * 
 * @example
 * const now = getCurrentTime(); // "14:30"
 */
export function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Get max date for date inputs (today)
 * Prevents selecting future dates
 * 
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getMaxDate() {
  return getCurrentDate();
}

/**
 * Format date for display
 * 
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate(new Date()) // "1/15/2025"
 */
export function formatDate(date) {
  return date.toLocaleDateString();
}

/**
 * Format time for display (12-hour format)
 * 
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string
 * 
 * @example
 * formatTime(new Date()) // "2:30 PM"
 */
export function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}