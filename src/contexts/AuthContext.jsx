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
import { BRAND, STORAGE_KEYS } from '../config';
import { getSettingsPageUrl } from '../utils/builders';

const logger = createLogger('AuthContext');
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // NEW: Profile state with username

  /**
   * Generate username from email
   * Takes part before @ and adds number if needed for uniqueness
   * 
   * @param {string} email - User email
   * @returns {Promise<string>} Generated unique username
   */
  const generateUsername = async (email) => {
    // Extract base username from email (part before @)
    let baseUsername = email.split('@')[0].toLowerCase();
    // Remove any special characters, keep only alphanumeric and underscore
    baseUsername = baseUsername.replace(/[^a-z0-9_]/g, '');
    
    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = `user${baseUsername}`;
    }
    
    // Truncate if too long
    if (baseUsername.length > 15) {
      baseUsername = baseUsername.substring(0, 15);
    }
    
    // For simplicity, just add a random number to avoid checking
    const randomNum = Math.floor(Math.random() * 1000);
    const username = `${baseUsername}${randomNum}`;
    
    logger.info('Generated username:', username);
    return username;
  };

  /**
   * Load profile for a user
   * Separate function to load profile without blocking
   */
   const loadProfile = async (authUser) => {
    if (!authUser || !authUser.id) return;
    
    try {
      logger.info('Loading profile for user:', authUser.id);
      
      // Try to get profile
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (existingProfile) {
        logger.info('Profile loaded:', existingProfile.username);
        setProfile(existingProfile);
        return existingProfile;
      }
      
      // No profile exists, create one
      logger.info('No profile found, creating one');
      const username = await generateUsername(authUser.email);
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          username: username
          // REMOVED email field - it's not in the profiles table
        })
        .select()
        .single();
      
      if (newProfile) {
        logger.info('Profile created:', newProfile.username);
        setProfile(newProfile);
        return newProfile;
      }
      
      // Fallback: use local profile
      const fallbackProfile = {
        id: authUser.id,
        username: authUser.email.split('@')[0],
        _local: true
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
      
    } catch (err) {
      logger.error('Error loading profile:', err);
      // Set fallback profile
      const fallbackProfile = {
        id: authUser.id,
        username: authUser.email.split('@')[0],
        _local: true
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    let mounted = true;
    
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

        // Set flags for UI
        chrome.storage.local.set({ 
          [STORAGE_KEYS.EMAIL_JUST_VERIFIED]: true,  // For modal auto-close
          [STORAGE_KEYS.VERIFICATION_SUCCESSFUL]: true  // For toast notification
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
      try {
        // Try to process URL tokens first
        const processedFromUrl = await processUrlHash();
        
        // Get current session (either from URL or existing)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting session', error);
        }
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false IMMEDIATELY - don't wait for profile
        setLoading(false);
        
        // Load profile AFTER setting loading to false (non-blocking)
        if (session?.user) {
          loadProfile(session.user); // Don't await - let it run in background
          
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
      } catch (error) {
        logger.error('Error in initializeAuth:', error);
        if (mounted) {
          setLoading(false); // Always set loading to false
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      logger.info('🔔 Auth event:', event, {
        hasSession: !!session,
        userEmail: session?.user?.email
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Load profile on auth change (non-blocking)
      if (session?.user) {
        loadProfile(session.user); // Don't await
      } else {
        setProfile(null);
      }

      // Handle sign out - clean up storage
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        chrome.storage.local.remove([
          STORAGE_KEYS.EMAIL_JUST_VERIFIED,
          STORAGE_KEYS.VERIFICATION_SUCCESSFUL
        ]);
        logger.info('Signed out - cleared storage flags');
      }
    });

    return () => {
      mounted = false;
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
          emailRedirectTo: getSettingsPageUrl()
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

      // If we have a session (email confirmation disabled), load profile
      if (hasSession && data.user) {
        loadProfile(data.user); // Non-blocking
      }

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

      // Load profile after sign in (non-blocking)
      if (data.user) {
        loadProfile(data.user);
      }

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

      setProfile(null); // Clear profile on sign out
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
        redirectTo: getSettingsPageUrl(),
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
          emailRedirectTo: getSettingsPageUrl()
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

  /**
   * Update user's username
   * Updates the profile table with new username
   * Will create profile if it doesn't exist
   * 
   * @param {string} newUsername - New username to set
   * @returns {Promise<{data: object|null, error: object|null}>}
   */
  const updateUsername = async (newUsername) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      logger.info('Updating username to:', newUsername);
      
      // Validate username format
      const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (cleanUsername.length > 20) {
        throw new Error('Username must be less than 20 characters');
      }
      
      // Use upsert to handle both create and update
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: cleanUsername,
          updated_at: new Date().toISOString()
          // REMOVED email field - it's not in the profiles table
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (error) {
        // Check if it's a unique constraint error
        if (error.code === '23505' && error.message.includes('username')) {
          throw new Error('Username already taken');
        }
        throw error;
      }
      
      setProfile(data);
      logger.info('✅ Username updated successfully:', data.username);
      
      return { data, error: null };
    } catch (error) {
      logger.error('Username update failed', error);
      
      // Return a more user-friendly error message
      let errorMessage = error.message;
      if (error.message.includes('duplicate') || error.code === '23505') {
        errorMessage = 'Username already taken';
      }
      
      return { data: null, error: { message: errorMessage } };
    }
  };

  const value = {
    user,
    session,
    profile, // NEW: Include profile with username
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendVerification,
    updateUsername, // NEW: Function to update username
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 * 
 * @returns {object} Auth context value with user, session, profile, and auth methods
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * const { user, profile, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}