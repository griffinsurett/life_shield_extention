/**
 * Date Helper Utilities
 * 
 * Common date/time formatting and manipulation functions.
 * Specialized for HTML5 date/time inputs and display formatting.
 * 
 * Why these helpers:
 * - HTML5 inputs require specific formats (YYYY-MM-DD, HH:MM)
 * - JavaScript Date API is verbose
 * - Consistent formatting across extension
 * - Timezone handling
 * 
 * Common patterns:
 * - Getting current date/time
 * - Formatting for inputs
 * - Formatting for display
 * - Validating date ranges
 * 
 * @module utils/dateHelpers
 */

/**
 * Get current date in YYYY-MM-DD format for date inputs
 * 
 * HTML5 date input format:
 * - Must be YYYY-MM-DD
 * - Must be zero-padded (01 not 1)
 * - No time component
 * 
 * Use cases:
 * - Default value for date inputs
 * - Maximum date (today)
 * - Date range validation
 * 
 * @returns {string} Current date in YYYY-MM-DD format
 * 
 * @example
 * // Set default date in form
 * <input 
 *   type="date" 
 *   value={getCurrentDate()} 
 * />
 * 
 * @example
 * // Prevent future dates
 * <input 
 *   type="date" 
 *   max={getCurrentDate()} 
 * />
 * 
 * @example
 * const today = getCurrentDate();
 * // "2025-01-15"
 */
export function getCurrentDate() {
  const now = new Date();
  
  // Extract components
  const year = now.getFullYear();
  
  // Months are 0-indexed, add 1
  // padStart ensures 2 digits (01 not 1)
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Days are 1-indexed
  const day = String(now.getDate()).padStart(2, '0');
  
  // Format as YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format for time inputs
 * 
 * HTML5 time input format:
 * - Must be HH:MM or HH:MM:SS
 * - 24-hour format
 * - Must be zero-padded
 * 
 * Why no seconds:
 * - Most time inputs don't need seconds
 * - Simpler for users
 * - Can add seconds if needed
 * 
 * Use cases:
 * - Default time in forms
 * - Current time display
 * - Time range validation
 * 
 * @returns {string} Current time in HH:MM format
 * 
 * @example
 * // Set default time
 * <input 
 *   type="time" 
 *   value={getCurrentTime()} 
 * />
 * 
 * @example
 * const now = getCurrentTime();
 * // "14:30" (2:30 PM)
 * // "09:05" (9:05 AM)
 */
export function getCurrentTime() {
  const now = new Date();
  
  // Extract hours and minutes
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  // Format as HH:MM
  return `${hours}:${minutes}`;
}

/**
 * Get max date for date inputs (today)
 * 
 * Prevents selecting future dates.
 * Common for:
 * - Birth dates
 * - Start dates
 * - Historical events
 * 
 * Why it exists:
 * - Clearer intent than getCurrentDate()
 * - Semantic naming
 * - Easy to understand in JSX
 * 
 * Implementation:
 * - Currently just calls getCurrentDate()
 * - Could be enhanced to support date math
 * - Future-proof for changes
 * 
 * @returns {string} Today's date in YYYY-MM-DD format
 * 
 * @example
 * // Prevent future dates
 * <input 
 *   type="date" 
 *   max={getMaxDate()} 
 *   placeholder="Select past date"
 * />
 * 
 * @example
 * // Sobriety date can't be in future
 * <input 
 *   type="date" 
 *   max={getMaxDate()}
 *   value={sobrietyDate}
 * />
 */
export function getMaxDate() {
  return getCurrentDate();
}

/**
 * Format date for display
 * 
 * Converts Date object to human-readable string.
 * Uses browser's locale for formatting.
 * 
 * Format varies by locale:
 * - US: "1/15/2025"
 * - UK: "15/1/2025"
 * - ISO: "2025-01-15"
 * 
 * Benefits of locale formatting:
 * - Respects user's region
 * - Automatically handles date format preferences
 * - No manual formatting needed
 * 
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 * 
 * @example
 * const date = new Date('2025-01-15');
 * const formatted = formatDate(date);
 * // "1/15/2025" (in US locale)
 * 
 * @example
 * // Display install date
 * <p>
 *   Installed: {formatDate(new Date(installDate))}
 * </p>
 */
export function formatDate(date) {
  // toLocaleDateString uses browser's locale settings
  return date.toLocaleDateString();
}

/**
 * Format time for display (12-hour format)
 * 
 * Converts Date object to human-readable time string.
 * Uses 12-hour format with AM/PM (in US locale).
 * 
 * Format examples:
 * - "2:30 PM"
 * - "9:05 AM"
 * - "12:00 PM"
 * 
 * Why 12-hour:
 * - More familiar to general users
 * - Matches most UI conventions
 * - toLocaleTimeString handles locale automatically
 * 
 * Options:
 * - hour: '2-digit' (09 not 9)
 * - minute: '2-digit' (05 not 5)
 * - No seconds (cleaner)
 * 
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string
 * 
 * @example
 * const date = new Date('2025-01-15T14:30:00');
 * const formatted = formatTime(date);
 * // "2:30 PM" (in US locale)
 * 
 * @example
 * // Display sobriety start time
 * <p>
 *   Started at: {formatTime(sobrietyDate)}
 * </p>
 */
export function formatTime(date) {
  // toLocaleTimeString with options for format control
  return date.toLocaleTimeString([], { 
    hour: '2-digit',   // 09 not 9
    minute: '2-digit'  // 05 not 5
  });
}