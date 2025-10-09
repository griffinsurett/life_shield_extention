/**
 * Centralized Error Logging Service
 * 
 * Provides consistent logging across the extension.
 * Different log levels for development vs production.
 * 
 * @module utils/logger
 */

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Current log level - can be configured
 */
let currentLogLevel = LOG_LEVELS.DEBUG;

/**
 * Set the current log level
 * 
 * @param {string} level - 'error', 'warn', 'info', or 'debug'
 */
export function setLogLevel(level) {
  const levelMap = {
    error: LOG_LEVELS.ERROR,
    warn: LOG_LEVELS.WARN,
    info: LOG_LEVELS.INFO,
    debug: LOG_LEVELS.DEBUG,
  };
  currentLogLevel = levelMap[level.toLowerCase()] ?? LOG_LEVELS.DEBUG;
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, context, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  return `[${timestamp}] [${level}] [${context}] ${message}`;
}

/**
 * Log error message
 */
export function logError(context, message, error = null) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', context, message), error || '');
  }
}

/**
 * Log warning message
 */
export function logWarn(context, message) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', context, message));
  }
}

/**
 * Log info message
 */
export function logInfo(context, message) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(formatMessage('INFO', context, message));
  }
}

/**
 * Log debug message
 */
export function logDebug(context, message) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', context, message));
  }
}

/**
 * Check if context invalidation error
 */
export function isContextError(error) {
  const message = error?.message || String(error);
  return (
    message.includes('Extension context invalidated') ||
    message.includes('Cannot access') ||
    message.includes('Extension manifest') ||
    message.includes('chrome-extension://')
  );
}

/**
 * Safe error logger that handles context invalidation
 */
export function logSafeError(context, message, error) {
  if (isContextError(error)) {
    return;
  }
  logError(context, message, error);
}

/**
 * Log chrome API call
 */
export function logChromeAPI(context, api, params = null) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    const paramStr = params ? JSON.stringify(params) : '';
    logDebug(context, `Chrome API: ${api}(${paramStr})`);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context) {
  return {
    error: (message, error) => logError(context, message, error),
    warn: (message) => logWarn(context, message),
    info: (message) => logInfo(context, message),
    debug: (message) => logDebug(context, message),
    safeError: (message, error) => logSafeError(context, message, error),
    chromeAPI: (api, params) => logChromeAPI(context, api, params),
  };
}