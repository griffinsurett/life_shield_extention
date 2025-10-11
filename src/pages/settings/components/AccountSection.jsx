// src/pages/settings/components/AccountSection.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Modal, ModalTrigger } from '../../../components/Modal';
import { Dropdown } from '../../../components/Dropdown';
import { AuthModal } from '../../../components/AuthModal';
import { BRAND, STORAGE_KEYS } from '../../../config';

export const AccountSection = ({ showToast }) => {
  const { user, signOut, loading } = useAuth();
  const authModalId = 'auth-modal';
  const accountDropdownId = 'account-dropdown';

  // Check for verification success flag
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.VERIFICATION_SUCCESSFUL], (result) => {
      if (result[STORAGE_KEYS.VERIFICATION_SUCCESSFUL] && user) {
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        showToast(`🎉 Email verified! Welcome to ${BRAND.NAME}!`, 'success');
        chrome.storage.local.remove([STORAGE_KEYS.VERIFICATION_SUCCESSFUL, STORAGE_KEYS.EMAIL_JUST_VERIFIED]);
      }
    });
  }, [user, showToast]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast('Sign out failed', 'error');
    } else {
      showToast('Signed out successfully', 'success');
    }
  };

  const getInitials = () => {
    if (!user?.email) return '?';
    return user.email[0].toUpperCase();
  };

  const getPlanName = () => {
    return 'Free Plan';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="p-4">
          <ModalTrigger
            modalId={authModalId}
            className="w-full p-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In / Sign Up
          </ModalTrigger>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Sync settings across devices
            </p>
          </div>
        </div>

        <AuthModal modalId={authModalId} />
      </>
    );
  }

  // Signed in state with Full-Width Dropdown
  return (
    <div className="relative">
      <Dropdown
        dropdownId={accountDropdownId}
        fullWidth={true}
        trigger={
          <div className="p-4">
            <div className="w-full p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                {getInitials()}
              </div>
              
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.email}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  {getPlanName()}
                </div>
              </div>
              
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        }
      >
        <div className="mx-4 mb-4 overflow-hidden">
          <div className="p-3 bg-gray-50 rounded-t-xl">
            <p className="text-xs text-gray-500 mb-1">Account</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-600 mt-1">ID: {user.id.slice(0, 8)}...</p>
          </div>
          
          <div className="bg-white rounded-b-xl overflow-hidden">
            <button
              onClick={() => showToast('Account settings coming soon!', 'info')}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Settings
            </button>
            
            <button
              onClick={() => showToast('Pro plans coming soon!', 'info')}
              className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-2 font-medium border-b border-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade to Pro
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};