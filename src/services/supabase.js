// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://runjyhgxyzihmknahryr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1bmp5aGd4eXppaG1rbmFocnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTY2NzAsImV4cCI6MjA3NTU5MjY3MH0.02JqsTDGBKCdOyDZuPmRg5OJz6Rnmym_nKMV7HQzlFY'

// Custom storage implementation using chrome.storage
const chromeStorage = {
  getItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },
  setItem: async (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  },
  removeItem: async (key) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], () => {
        resolve();
      });
    });
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});