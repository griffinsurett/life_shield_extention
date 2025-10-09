// src/contexts/AuthContext.jsx
/**
 * Auth Context
 * 
 * Manages authentication state across the extension.
 * Provides login, signup, logout, and user info.
 * Polls for email verification status when user is unverified.
 * 
 * Note: Email confirmation is disabled in Supabase for better UX.
 * Users are immediately logged in after signup but encouraged to verify.
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        const isVerified = !!(session.user.email_confirmed_at || session.user.confirmed_at);
        logger.info('Initial session loaded', { 
          authenticated: true,
          emailVerified: isVerified
        });
      } else {
        logger.info('Initial session loaded', 'Not authenticated');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed', event);
      
      const previousUser = user;
      setSession(session);
      setUser(session?.user ?? null);

      // Handle signup - user is now logged in!
      if (event === 'SIGNED_IN' && session?.user) {
        const wasJustCreated = !previousUser && session.user;
        const isVerified = !!(session.user.email_confirmed_at || session.user.confirmed_at);
        
        logger.info('User signed in', { 
          wasJustCreated,
          emailVerified: isVerified
        });
        
        // If account just created and unverified, set flag to show verification UI
        if (wasJustCreated && !isVerified) {
          chrome.storage.local.set({ 
            showVerificationPrompt: true,
            userJustSignedUp: true 
          });
        }
        
        // Check if this was from email verification
        if (window.location.hash.includes('type=signup') || 
            window.location.hash.includes('type=email')) {
          chrome.storage.local.set({ emailJustVerified: true });
          logger.info('Email verification detected from URL');
        }
      }

      // Handle token refresh - check if email was just verified
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const wasUnverified = !(previousUser?.email_confirmed_at || previousUser?.confirmed_at);
          const nowVerified = !!(session.user.email_confirmed_at || session.user.confirmed_at);
          
          if (wasUnverified && nowVerified) {
            chrome.storage.local.set({ emailJustVerified: true });
            logger.info('✅ Email verification detected via token refresh');
          }
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        chrome.storage.local.remove(['showVerificationPrompt', 'userJustSignedUp', 'emailJustVerified']);
        logger.info('User signed out, cleared verification flags');
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  // Poll for email verification when user is logged in but unverified
  useEffect(() => {
    let pollInterval;
    
    const isUnverified = user && !(user.email_confirmed_at || user.confirmed_at);
    
    if (isUnverified) {
      logger.info('Starting email verification polling (user is unverified)');
      
      pollInterval = setInterval(async () => {
        try {
          logger.debug('Polling: Checking email verification status...');
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (error) {
            logger.error('Error refreshing session during poll', error);
            return;
          }
          
          const nowVerified = !!(session?.user?.email_confirmed_at || session?.user?.confirmed_at);
          
          if (nowVerified) {
            logger.info('✅ Email verified detected via polling!');
            chrome.storage.local.set({ 
              emailJustVerified: true,
              showVerificationPrompt: false 
            });
            // Stop polling
            if (pollInterval) {
              clearInterval(pollInterval);
              logger.info('Stopped polling - email now verified');
            }
          }
        } catch (error) {
          logger.safeError('Error in verification polling', error);
        }
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        logger.debug('Stopped email verification polling (cleanup)');
      }
    };
  }, [user]);

  /**
   * Sign up with email and password
   * With email confirmation disabled, user gets immediate session
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  const signUp = async (email, password) => {
    try {
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
      const isVerified = !!(data.user?.email_confirmed_at || data.user?.confirmed_at);

      logger.info('Sign up successful', { 
        hasSession,
        hasUser,
        isVerified
      });

      // If user created but no session, email confirmation might still be enabled
      if (hasUser && !hasSession) {
        logger.warn('User created but no session - email confirmation may be enabled in Supabase');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const isVerified = !!(data.user?.email_confirmed_at || data.user?.confirmed_at);
      logger.info('Sign in successful', { emailVerified: isVerified });
      
      return { data, error: null };
    } catch (error) {
      logger.error('Sign in failed', error);
      return { data: null, error };
    }
  };

  /**
   * Sign out current user
   * 
   * @returns {Promise<{error: object|null}>}
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      logger.info('Sign out successful');
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
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: chrome.runtime.getURL('src/pages/settings/index.html'),
      });

      if (error) throw error;

      logger.info('Password reset email sent');
      return { data, error: null };
    } catch (error) {
      logger.error('Password reset failed', error);
      return { data: null, error };
    }
  };

  /**
   * Resend verification email
   * 
   * @param {string} email - User email  
   * @returns {Promise<{error: object|null}>}
   */
  const resendVerification = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: chrome.runtime.getURL('src/pages/settings/index.html')
        }
      });

      if (error) throw error;

      logger.info('Verification email resent');
      return { error: null };
    } catch (error) {
      logger.error('Resend verification failed', error);
      return { error };
    }
  };

  /**
   * Manually refresh session to check for email verification
   * 
   * @returns {Promise<{verified: boolean, error: object|null}>}
   */
  const checkEmailVerification = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      const verified = !!(session?.user?.email_confirmed_at || session?.user?.confirmed_at);
      
      logger.info('Email verification check', { verified });
      
      if (verified) {
        chrome.storage.local.set({ 
          emailJustVerified: true,
          showVerificationPrompt: false 
        });
      }
      
      return { verified, error: null };
    } catch (error) {
      logger.error('Email verification check failed', error);
      return { verified: false, error };
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
    checkEmailVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * 
 * @returns {object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}