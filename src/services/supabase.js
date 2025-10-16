/**
 * Supabase Client Configuration
 * 
 * Initializes Supabase client for authentication and database access.
 * Configured specifically for Chrome extension environment.
 * 
 * 
 * Extension-specific challenges:
 * - No localStorage in service workers
 * - Need persistent session storage
 * - Must handle extension updates
 * 
 * Solution:
 * - Custom storage adapter using chrome.storage.local
 * - Persists auth tokens across extension lifecycle
 * - Works in both service workers and content scripts
 * 
 * @module services/supabase
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase project URL
 * 
 * Format: https://{project-id}.supabase.co
 * Each Supabase project gets unique subdomain.
 * 
 * This URL points to:
 * - Authentication endpoints
 * - Database REST API
 * - Storage API
 * - Real-time subscriptions
 */
const SUPABASE_URL = 'https://runjyhgxyzihmknahryr.supabase.co';

/**
 * Supabase anonymous key
 * 
 * Public key safe to expose in client code.
 * 
 * What it allows:
 * - Public API access
 * - User authentication
 * - Row-level security enforced
 * 
 * What it doesn't allow:
 * - Admin operations
 * - Bypassing security rules
 * - Direct database access
 * 
 * Security:
 * - Safe to commit to version control
 * - Database protected by RLS (Row Level Security)
 * - Each user can only access their own data
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bmp5aGd4eXppaG1rbmFocnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTY2NzAsImV4cCI6MjA3NTU5MjY3MH0.02JqsTDGBKCdOyDZuPmRg5OJz6Rnmym_nKMV7HQzlFY'

/**
 * Custom storage implementation using chrome.storage
 * 
 * Problem: Supabase defaults to localStorage
 * - Not available in service workers
 * - Cleared on extension update
 * 
 * Solution: Use chrome.storage.local instead
 * - Available everywhere (service worker, content script, popup)
 * - Persists across extension updates
 * - Survives browser restarts
 * 
 * Storage interface required by Supabase:
 * - getItem(key): Get value from storage
 * - setItem(key, value): Save value to storage
 * - removeItem(key): Delete value from storage
 * 
 * All methods are async (return Promises).
 * Chrome storage API is async, so this is natural fit.
 */
const chromeStorage = {
  /**
   * Get item from chrome.storage.local
   * 
   * Wraps chrome.storage.local.get in Promise.
   * Returns null if key doesn't exist (Supabase requirement).
   * 
   * @param {string} key - Storage key to retrieve
   * @returns {Promise<string|null>} Stored value or null
   * 
   * @example
   * const token = await chromeStorage.getItem('supabase.auth.token');
   */
  getItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        // Return value or null if not found
        resolve(result[key] || null);
      });
    });
  },
  
  /**
   * Set item in chrome.storage.local
   * 
   * Wraps chrome.storage.local.set in Promise.
   * Stores auth tokens and session data.
   * 
   * @param {string} key - Storage key
   * @param {string} value - Value to store (usually JSON string)
   * @returns {Promise<void>}
   * 
   * @example
   * await chromeStorage.setItem('supabase.auth.token', jsonToken);
   */
  setItem: async (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  
  /**
   * Remove item from chrome.storage.local
   * 
   * Wraps chrome.storage.local.remove in Promise.
   * Used when user signs out.
   * 
   * @param {string} key - Storage key to remove
   * @returns {Promise<void>}
   * 
   * @example
   * await chromeStorage.removeItem('supabase.auth.token');
   */
  removeItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  }
};

/**
 * Create and configure Supabase client
 * 
 * Configuration options:
 * 
 * auth.storage:
 * - Uses our custom chromeStorage adapter
 * - Persists tokens in chrome.storage.local
 * 
 * auth.autoRefreshToken:
 * - Automatically refreshes expired tokens
 * - Keeps user signed in
 * - No manual token management needed
 * 
 * auth.persistSession:
 * - Saves session across extension restarts
 * - User stays logged in
 * 
 * auth.detectSessionInUrl:
 * - Set to false for extensions
 * - Extensions handle URL tokens manually
 * - Prevents automatic URL token processing
 * 
 * @exports supabase - Configured Supabase client instance
 * 
 * @example
 * import { supabase } from './supabase';
 * 
 * // Sign in
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * 
 * @example
 * // Query database
 * const { data, error } = await supabase
 *   .from('profiles')
 *   .select('*')
 *   .eq('id', userId)
 *   .single();
 * 
 * @example
 * // Sign out
 * await supabase.auth.signOut();
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorage,           // Use our custom storage adapter
    autoRefreshToken: true,            // Auto-refresh expired tokens
    persistSession: true,              // Persist across restarts
    detectSessionInUrl: false          // Manual URL token handling
  }
});