// src/contexts/AuthContext.jsx
/**
 * Auth Context
 * 
 * Manages authentication state across the extension.
 * Handles email verification auto-login by manually processing URL tokens.
 * 
 * Flow:
 * 1. User signs up → Supabase sends verification email
 * 2. User clicks link → Redirects to extension with tokens in URL hash
 * 3. processUrlHash() extracts and validates tokens
 * 4. setSession() creates authenticated session
 * 5. User is automatically logged in ✅
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthContext');
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Process authentication tokens from URL hash
     * Called when user arrives via email verification link
     * 
     * @returns {Promise<boolean>} True if tokens were successfully processed
     */
    const processUrlHash = async () => {
      const hash = window.location.hash;
      
      // Check if we have tokens in the URL
      if (!hash.includes('access_token=')) {
        return false;
      }

      logger.info('📧 Found auth tokens in URL, processing...');
      
      try {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        
        // Validate required tokens
        if (!access_token || !refresh_token) {
          logger.warn('Missing required tokens in URL hash');
          return false;
        }

        logger.debug('Token details:', { 
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
          type: type
        });

        // Set session with tokens from URL
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (error) {
          logger.error('Failed to set session from URL tokens', error);
          
          // Clear invalid hash
          window.history.replaceState(null, '', window.location.pathname);
          return false;
        }

        // Success!
        logger.info('✅ Successfully authenticated from email verification!', {
          email: data.user?.email,
          verified: !!(data.user?.email_confirmed_at || data.user?.confirmed_at)
        });

        // Set flag for UI to show success message
        chrome.storage.local.set({ 
          emailJustVerified: true,
          verificationSuccessful: true
        });

        // Clean up URL hash
        window.history.replaceState(null, '', window.location.pathname);

        return true;
      } catch (error) {
        logger.error('Error processing URL hash', error);
        
        // Clean up on error
        window.history.replaceState(null, '', window.location.pathname);
        return false;
      }
    };

    /**
     * Initialize authentication state
     * 1. Process any URL tokens first (email verification)
     * 2. Then get existing session if any
     */
    const initializeAuth = async () => {
      // Try to process URL tokens first
      const processedFromUrl = await processUrlHash();
      
      // Get current session (either from URL or existing)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Error getting session', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        const isVerified = !!(session.user.email_confirmed_at || session.user.confirmed_at);
        logger.info('Session initialized', { 
          authenticated: true,
          emailVerified: isVerified,
          email: session.user.email,
          source: processedFromUrl ? 'email_verification' : 'existing_session'
        });
      } else {
        logger.info('Session initialized', { authenticated: false });
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('🔔 Auth event:', event, {
        hasSession: !!session,
        userEmail: session?.user?.email
      });
      
      setSession(session);
      setUser(session?.user ?? null);

      // Handle sign out - clean up storage
      if (event === 'SIGNED_OUT') {
        chrome.storage.local.remove([
          'emailJustVerified',
          'verificationSuccessful'
        ]);
        logger.info('Signed out - cleared storage flags');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  /**
   * Sign up with email and password
   * Sends verification email if confirmation is enabled in Supabase
   * 
   * @param {string} email - User email
   * @param {string} password - User password (min 6 characters)
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  const signUp = async (email, password) => {
    try {
      logger.info('Attempting sign up...', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: chrome.runtime.getURL('src/pages/settings/index.html')
        }
      });

      if (error) throw error;

      const hasSession = !!data.session;
      const hasUser = !!data.user;

      logger.info('Sign up successful', { 
        hasSession,
        hasUser,
        email: data.user?.email,
        needsVerification: hasUser && !hasSession
      });

      if (hasUser && !hasSession) {
        logger.info('📧 Verification email sent to:', data.user.email);
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error('Sign up failed', error);
      return { data: null, error };
    }
  };

  /**
   * Sign in with email and password
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  const signIn = async (email, password) => {
    try {
      logger.info('Attempting sign in...', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('Sign in successful', { 
        email: data.user?.email,
        verified: !!(data.user?.email_confirmed_at || data.user?.confirmed_at)
      });
      
      return { data, error: null };
    } catch (error) {
      logger.error('Sign in failed', error);
      return { data: null, error };
    }
  };

  /**
   * Sign out current user
   * Clears session and removes all auth-related storage
   * 
   * @returns {Promise<{error: object|null}>}
   */
  const signOut = async () => {
    try {
      logger.info('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      logger.info('✅ Signed out successfully');
      return { error: null };
    } catch (error) {
      logger.error('Sign out failed', error);
      return { error };
    }
  };

  /**
   * Send password reset email
   * 
   * @param {string} email - User email
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  const resetPassword = async (email) => {
    try {
      logger.info('Sending password reset email...', { email });
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: chrome.runtime.getURL('src/pages/settings/index.html'),
      });

      if (error) throw error;

      logger.info('✅ Password reset email sent');
      return { data, error: null };
    } catch (error) {
      logger.error('Password reset failed', error);
      return { data: null, error };
    }
  };

  /**
   * Resend verification email
   * Useful if user didn't receive the first email
   * 
   * @param {string} email - User email
   * @returns {Promise<{error: object|null}>}
   */
  const resendVerification = async (email) => {
    try {
      logger.info('Resending verification email...', { email });
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: chrome.runtime.getURL('src/pages/settings/index.html')
        }
      });

      if (error) throw error;

      logger.info('✅ Verification email resent');
      return { error: null };
    } catch (error) {
      logger.error('Resend verification failed', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 * 
 * @returns {object} Auth context value with user, session, and auth methods
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}