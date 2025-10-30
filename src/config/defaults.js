/**
 * Default Values Configuration
 * 
 * Central location for all default values and fallbacks.
 * Includes URLs, messages, and initial settings.
 * 
 * @module config/defaults
 */

export const DEFAULTS = {
  // URLs
  REDIRECT_URL: 'https://griffinswebservices.com',
  
  // Messages
  CUSTOM_MESSAGE: 'This page has been blocked to support your wellness journey. Take a moment to breathe and consider a healthier alternative.',
  
  // Extension pages
  PAGES: {
    BLOCKED: 'src/pages/blocked/index.html',
    SETTINGS: 'src/pages/settings/index.html',
    POPUP: 'src/pages/popup/index.html'
  },
  
  // Icon paths
  ICONS: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  
  // Replacement phrases
  REPLACEMENT_PHRASES: [
    "yoga for beginners", "meditation techniques", "healthy recipes",
    "stress relief tips", "walking benefits", "sleep improvement",
    "breathing exercises", "mindfulness practice", "stretching routine",
    "water intake benefits", "morning exercise", "immune system boost",
    "vitamin d benefits", "relaxation techniques", "healthy meal prep",
    "nature walk benefits", "gratitude journal", "posture improvement",
    "herbal tea benefits", "workout motivation", "mental health tips",
    "nutrition basics", "hydration tips", "self care ideas", "wellness routine"
  ],
  
  // Settings defaults
  BLOCKED_WORDS: [],  // Empty in production
  BLOCKED_SITES: [],
  ENABLE_FILTER: true,
  SHOW_ALERTS: false,
  USE_CUSTOM_URL: false,
  USE_REPLACEMENT_PHRASES: true,  // Enable/disable replacement phrases
  INPUT_BEHAVIOR: 'remove_words'  // NEW: 'remove_words' or 'clear_input'
};

// Test data - clearly separated
export const TEST_DATA = {
  BLOCKED_WORDS: ["chair", "a chair"]
};