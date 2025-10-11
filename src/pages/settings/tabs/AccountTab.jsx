// src/pages/settings/tabs/AccountTab.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthModal } from '../../../components/AuthModal';
import Button from '../../../components/Button';
import { BRAND, STORAGE_KEYS } from '../../../config';

const AccountTab = ({ showToast }) => {
  const { user, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check for verification success flag
  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEYS.VERIFICATION_SUCCESSFUL], (result) => {
      if (result[STORAGE_KEYS.VERIFICATION_SUCCESSFUL] && user) {
        // Clear the URL hash
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Account</h2>

        {user ? (
          // Signed in state
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    Signed In
                    <span className="text-green-500 text-lg">✓</span>
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-green-200">
                <p className="text-xs text-gray-600 mb-2">
                  <strong>User ID:</strong> {user.id}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSignOut}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          // Signed out state
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border-2 border-primary/20">
              <h3 className="font-semibold text-gray-800 mb-2">
                Sync Across Devices
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Sign in to sync your blocked words, sites, and settings across all your devices.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Access your settings anywhere
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Automatic cloud backup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Secure & private
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-colors"
            >
              Sign In / Sign Up
            </Button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default AccountTab;