/**
 * Timing Constants
 * 
 * Centralized timing values used throughout the extension.
 * Makes it easy to tune performance and maintain consistency.
 * 
 * @module utils/timing
 */

/**
 * Badge update interval (1 minute)
 */
export const BADGE_UPDATE_INTERVAL = 60000;

/**
 * Statistics check interval (1 hour)
 */
export const STATS_CHECK_INTERVAL = 3600000;

/**
 * Stats refresh interval for UI (5 seconds)
 */
export const STATS_REFRESH_INTERVAL = 5000;

/**
 * Default content scan interval (2 seconds)
 */
export const DEFAULT_SCAN_INTERVAL = 2000;

/**
 * Default mutation debounce (200ms)
 */
export const DEFAULT_MUTATION_DEBOUNCE = 200;

/**
 * Minimum interval between cleaning operations (500ms)
 */
export const MIN_CLEAN_INTERVAL = 500;

/**
 * Early scan delays for catching dynamic inputs (ms)
 */
export const EARLY_SCAN_DELAYS = [0, 100, 500, 1000];

/**
 * Input safety net scan interval (5 seconds)
 */
export const INPUT_SCAN_INTERVAL = 5000;

/**
 * Google search setup interval (100ms)
 * More aggressive for Google's dynamic UI
 */
export const GOOGLE_SETUP_INTERVAL = 100;

/**
 * Yahoo value interception check interval (200ms)
 */
export const YAHOO_CHECK_INTERVAL = 200;

/**
 * Notification startup delay (1 second)
 */
export const STARTUP_NOTIFICATION_DELAY = 1000;

/**
 * Tab blocking debounce (2 seconds)
 * Prevents duplicate stat increments for same tab
 */
export const TAB_BLOCKING_DEBOUNCE = 2000;

/**
 * Toast auto-dismiss delay (3 seconds)
 */
export const TOAST_DISMISS_DELAY = 3000;

/**
 * Session timeout (15 minutes)
 */
export const SESSION_TIMEOUT_MINUTES = 15;