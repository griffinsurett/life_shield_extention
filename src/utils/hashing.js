/**
 * Hashing Utilities
 * 
 * Provides secure hashing for protected content.
 * Supports both individual words and complete phrases/sentences.
 * Uses SHA-256 via Web Crypto API for consistent hashing.
 * 
 * @module utils/hashing
 */

/**
 * Hash a string using SHA-256
 * Always normalizes to lowercase and trims whitespace
 * Preserves internal spaces for phrase matching
 * 
 * @param {string} str - String to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashString(str) {
  if (!str) return '';
  
  // Normalize: lowercase, trim, but preserve internal spaces
  const normalized = str.toLowerCase().trim();
  
  // Encode string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Hash an array of strings
 * 
 * @param {string[]} strings - Array of strings to hash
 * @returns {Promise<string[]>} Array of hashes
 */
export async function hashArray(strings) {
  if (!Array.isArray(strings)) return [];
  
  const hashes = await Promise.all(
    strings.map(str => hashString(str))
  );
  
  return hashes;
}

/**
 * Extract words from text for hashing/comparison
 * Splits on whitespace and common punctuation
 * 
 * @param {string} text - Text to extract words from
 * @returns {string[]} Array of words
 */
export function extractWords(text) {
  if (!text) return [];
  
  // Split on whitespace and common punctuation, keep alphanumeric
  const words = text
    .toLowerCase()
    .split(/[\s,.\-_!?;:()\[\]{}'"\/\\]+/)
    .filter(word => word.length > 0);
  
  return words;
}

/**
 * Generate n-grams (consecutive word sequences) from text
 * Used for phrase matching
 * 
 * @param {string} text - Text to generate n-grams from
 * @param {number} maxN - Maximum n-gram size (default: 6)
 * @returns {string[]} Array of n-grams
 * 
 * @example
 * generateNGrams("trending amazon products", 3)
 * // Returns: ["trending", "amazon", "products", "trending amazon", "amazon products", "trending amazon products"]
 */
export function generateNGrams(text, maxN = 6) {
  if (!text) return [];
  
  const words = extractWords(text);
  const ngrams = [];
  
  // Generate n-grams of all sizes from 1 to maxN
  for (let n = 1; n <= Math.min(maxN, words.length); n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      ngrams.push(ngram);
    }
  }
  
  return ngrams;
}

/**
 * Check if text contains any hashed words or phrases
 * Generates n-grams and checks each against blocked hashes
 * 
 * @param {string} text - Text to check
 * @param {string[]} hashedWords - Array of hashed words/phrases to check against
 * @returns {Promise<boolean>} True if any word or phrase matches
 */
export async function containsHashedWord(text, hashedWords) {
  if (!text || !hashedWords || hashedWords.length === 0) return false;
  
  // Generate all possible n-grams (up to 6 words)
  const ngrams = generateNGrams(text, 6);
  const hashSet = new Set(hashedWords);
  
  // Check each n-gram
  for (const ngram of ngrams) {
    const hash = await hashString(ngram);
    if (hashSet.has(hash)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Scrub text by replacing blocked words/phrases
 * Now supports phrase replacement
 * 
 * @param {string} text - Text to scrub
 * @param {string[]} hashedWords - Array of hashed words/phrases
 * @param {Function} getReplacementFn - Function that returns replacement text
 * @returns {Promise<{scrubbedText: string, matchCount: number}>} Scrubbed text and match count
 */
export async function scrubTextWithHashes(text, hashedWords, getReplacementFn) {
  if (!text || !hashedWords || hashedWords.length === 0) {
    return { scrubbedText: text, matchCount: 0 };
  }
  
  const words = extractWords(text);
  const hashSet = new Set(hashedWords);
  const replacements = new Map(); // Map of ngram -> replacement
  let matchCount = 0;
  
  // Check all n-grams (longest first to prefer longer matches)
  for (let n = 6; n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      
      // Skip if we already have a replacement that overlaps
      let hasOverlap = false;
      for (let j = i; j < i + n; j++) {
        if (replacements.has(j)) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) continue;
      
      // Check if this n-gram is blocked
      const hash = await hashString(ngram);
      if (hashSet.has(hash)) {
        // Mark these word positions as replaced
        for (let j = i; j < i + n; j++) {
          replacements.set(j, getReplacementFn());
        }
        matchCount++;
      }
    }
  }
  
  // Build scrubbed text
  if (replacements.size === 0) {
    return { scrubbedText: text, matchCount: 0 };
  }
  
  // Reconstruct text with replacements
  let scrubbedText = text;
  let offset = 0;
  
  // Group consecutive replacements
  const groups = [];
  let currentGroup = null;
  
  for (let i = 0; i < words.length; i++) {
    if (replacements.has(i)) {
      if (!currentGroup) {
        currentGroup = { start: i, end: i, replacement: replacements.get(i) };
      } else {
        currentGroup.end = i;
      }
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
    }
  }
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  // Apply replacements (in reverse to maintain positions)
  for (let g = groups.length - 1; g >= 0; g--) {
    const group = groups[g];
    const originalPhrase = words.slice(group.start, group.end + 1).join(' ');
    
    // Find and replace in original text (case-insensitive)
    const regex = new RegExp(
      originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi'
    );
    scrubbedText = scrubbedText.replace(regex, group.replacement);
  }
  
  return { scrubbedText, matchCount };
}

/**
 * Check if URL contains any hashed sites
 * Checks domain and path parts separately
 * 
 * @param {string} url - URL to check
 * @param {string[]} hashedSites - Array of hashed sites to check against
 * @returns {Promise<boolean>} True if any part matches
 */
export async function containsHashedSite(url, hashedSites) {
  if (!url || !hashedSites || hashedSites.length === 0) return false;
  
  try {
    const urlLower = url.toLowerCase();
    const hashSet = new Set(hashedSites);
    
    // Extract parts to check
    // Remove protocol
    const withoutProtocol = urlLower.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Split into parts (domain, path segments)
    const parts = withoutProtocol.split('/').filter(p => p.length > 0);
    
    // Check each part and combinations
    for (let i = 0; i < parts.length; i++) {
      // Check individual part
      const partHash = await hashString(parts[i]);
      if (hashSet.has(partHash)) return true;
      
      // Check cumulative parts (e.g., "example.com", "example.com/page")
      const combined = parts.slice(0, i + 1).join('/');
      const combinedHash = await hashString(combined);
      if (hashSet.has(combinedHash)) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking hashed site:', error);
    return false;
  }
}