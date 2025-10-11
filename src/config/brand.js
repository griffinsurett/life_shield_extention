/**
 * Brand Configuration
 * 
 * Single source of truth for all brand-related constants.
 * Change brand identity in one place.
 * 
 * @module config/brand
 */

export const BRAND = {
  // Core brand identity
  NAME: 'Wellness Filter',
  ICON: '🌿',
  TAGLINE: 'Promoting healthy browsing habits',
  DESCRIPTION: 'Promote healthy browsing habits by filtering unwanted content',
  
  // Visual elements
  HEART: '💚',
  BADGE_COLOR: '#dc2626',
  
  // Get version from manifest
  get VERSION() {
    try {
      return chrome.runtime.getManifest().version;
    } catch {
      return '1.0.0';
    }
  }
};