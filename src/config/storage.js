/**
 * Storage Keys Configuration
 * 
 * Centralized storage key definitions.
 * Ensures consistency across the extension.
 * 
 * @module config/storage
 */

export const STORAGE_KEYS = {
  // Settings (stored in sync storage)
  BLOCKED_WORDS: 'blockedWords',
  BLOCKED_SITES: 'blockedSites',
  REDIRECT_URL: 'redirectUrl',
  ENABLE_FILTER: 'enableFilter',
  SHOW_ALERTS: 'showAlerts',
  REPLACEMENT_PHRASES: 'replacementPhrases',
  USE_CUSTOM_URL: 'useCustomUrl',
  USE_REPLACEMENT_PHRASES: 'useReplacementPhrases',  // NEW: Toggle for replacement phrases
  CUSTOM_MESSAGE: 'customMessage',
  
  // Statistics (stored in local storage)
  FILTER_COUNT: 'filterCount',
  TODAY_COUNT: 'todayCount',
  INSTALL_DATE: 'installDate',
  LAST_RESET_DATE: 'lastResetDate',
  
  // Auth related (stored in local storage)
  EMAIL_JUST_VERIFIED: 'emailJustVerified',
  VERIFICATION_SUCCESSFUL: 'verificationSuccessful'
};