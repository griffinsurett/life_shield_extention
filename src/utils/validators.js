// src/utils/validators.js
/**
 * Site/URL Validation Utilities
 * 
 * Centralized validation and transformation for sites and URLs.
 * Used by ListManager, QuickBlockCurrent, and site blocking logic.
 * 
 * @module utils/validators
 */

/**
 * Transform raw URL input to clean format
 * Removes protocol, www, and trailing slashes
 * 
 * @param {string} value - Raw URL/domain input
 * @returns {string} Cleaned URL/domain
 * 
 * @example
 * transformSiteInput('https://www.example.com/') // => 'example.com'
 * transformSiteInput('example.com/page') // => 'example.com/page'
 */
export const transformSiteInput = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
};

/**
 * Transform raw word input to clean format
 * 
 * @param {string} value - Raw word input
 * @returns {string} Cleaned word
 */
export const transformWordInput = (value) => {
  return value.trim().toLowerCase();
};

/**
 * Transform raw phrase input to clean format
 * 
 * @param {string} value - Raw phrase input
 * @returns {string} Cleaned phrase
 */
export const transformPhraseInput = (value) => {
  return value.trim();
};

/**
 * Validate site/domain format
 * 
 * @param {string} site - Site to validate
 * @returns {string|null} Error message or null if valid
 * 
 * @example
 * validateSite('example.com') // => null (valid)
 * validateSite('notasite') // => 'Please enter a valid domain'
 */
export const validateSite = (site) => {
  if (!site || site.length < 3) {
    return 'Site must be at least 3 characters';
  }
  
  if (!site.includes('.')) {
    return 'Please enter a valid domain (e.g., example.com)';
  }
  
  if (site.startsWith('.') || site.endsWith('.')) {
    return 'Invalid domain format';
  }
  
  return null;
};

/**
 * Validate word/phrase format
 * 
 * @param {string} word - Word to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateWord = (word) => {
  // Words can be single characters, so no minimum length check needed
  if (!word || word.length === 0) {
    return 'Word cannot be empty';
  }
  
  return null;
};

/**
 * Validate replacement phrase format
 * 
 * @param {string} phrase - Phrase to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePhrase = (phrase) => {
  if (!phrase || phrase.length < 2) {
    return 'Phrase must be at least 2 characters';
  }
  
  if (phrase.length > 50) {
    return 'Phrase must be less than 50 characters';
  }
  
  return null;
};

/**
 * Check if item already exists in list
 * 
 * @param {string} item - Item to check
 * @param {string[]} list - Existing items
 * @returns {boolean} True if duplicate
 */
export const isDuplicate = (item, list) => {
  return list.includes(item);
};

/**
 * Extract domain from full URL
 * 
 * @param {string} url - Full URL
 * @returns {string} Domain only
 * 
 * @example
 * extractDomain('example.com/page/path') // => 'example.com'
 */
export const extractDomain = (url) => {
  const firstSlash = url.indexOf('/');
  return firstSlash === -1 ? url : url.substring(0, firstSlash);
};

/**
 * Check if URL is a full path (has /)
 * 
 * @param {string} url - URL to check
 * @returns {boolean} True if has path
 */
export const isFullUrl = (url) => {
  return url.includes('/');
};