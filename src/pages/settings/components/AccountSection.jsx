// src/pages/settings/components/AccountSection.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { AuthModal } from "../../../components/AuthModal";
import {
  Dropdown,
  DropdownHeader,
  DropdownItem,
  DropdownDivider,
} from "../../../components/Dropdown";
import Button from "../../../components/Button";
import Input from "../../../components/Inputs/Input";
import { Modal } from "../../../components/Modal";
import { BRAND, STORAGE_KEYS } from "../../../config";

export const AccountSection = ({ showToast }) => {
  const { user, profile, signOut, updateUsername, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // Check for verification success flag
  useEffect(() => {
    if (!user) return;

    chrome.storage.local.get(
      [STORAGE_KEYS.VERIFICATION_SUCCESSFUL],
      (result) => {
        if (result[STORAGE_KEYS.VERIFICATION_SUCCESSFUL]) {
          // Clean up URL hash if present
          if (window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname);
          }

          // Show success toast
          showToast(`🎉 Email verified! Welcome to ${BRAND.NAME}!`, "success");

          // Clean up all verification flags
          chrome.storage.local.remove([
            STORAGE_KEYS.VERIFICATION_SUCCESSFUL,
            STORAGE_KEYS.EMAIL_JUST_VERIFIED,
          ]);
        }
      }
    );
  }, [user, showToast]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast("Sign out failed", "error");
    } else {
      showToast("Signed out successfully", "success");
    }
  };

  const getInitials = () => {
    // Use username if available, otherwise email
    const displayName = profile?.username || user?.email || "?";
    return displayName[0].toUpperCase();
  };

  const getDisplayName = () => {
    // Show username if available, otherwise email
    return profile?.username || user?.email || "User";
  };

  const getPlanName = () => {
    return "Free Plan";
  };

  const handleUsernameEdit = () => {
    setNewUsername(profile?.username || "");
    setUsernameError("");
    setShowUsernameModal(true);
  };

  const handleUsernameSave = async () => {
    // Validate username
    const cleanUsername = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (cleanUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    
    if (cleanUsername.length > 20) {
      setUsernameError("Username must be less than 20 characters");
      return;
    }
    
    setSavingUsername(true);
    const { error } = await updateUsername(cleanUsername);
    
    if (error) {
      if (error.message.includes('duplicate')) {
        setUsernameError("Username already taken");
      } else {
        setUsernameError(error.message);
      }
      setSavingUsername(false);
    } else {
      showToast("Username updated successfully!", "success");
      setShowUsernameModal(false);
      setSavingUsername(false);
    }
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
          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full btn-base btn-md btn-gradient font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Sign In / Sign Up
          </Button>

          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Sync settings across devices
            </p>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Signed in state with Dropdown
  return (
    <>
      <div>
        <Dropdown
          fullWidth={false}
          position="bottom-right"
          minWidth="280px"
          trigger={
            <div className="p-4">
              <div className="w-full p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                  {getInitials()}
                </div>

                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    @{getDisplayName()}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    {getPlanName()}
                  </div>
                </div>

                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          }
        >
          <div className="w-full">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-500">Account</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    @{profile?.username || "loading..."}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  onClick={handleUsernameEdit}
                  className="text-xs text-primary hover:text-secondary"
                  title="Edit username"
                >
                  Edit
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                ID: {user.id.slice(0, 8)}...
              </p>
            </div>

            <div className="py-0">
              <Button
                type="button"
                onClick={handleUsernameEdit}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>Edit Username</span>
              </Button>

              <Button
                type="button"
                onClick={() =>
                  showToast("Profile settings coming soon!", "info")
                }
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Profile Settings</span>
              </Button>

              <Button
                type="button"
                onClick={() => showToast("Pro plans coming soon!", "info")}
                className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-3 font-medium whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Upgrade to Pro</span>
              </Button>
            </div>

            <div className="border-t border-gray-100">
              <Button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </Dropdown>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Username Edit Modal */}
      <Modal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        animationType="slide-up"
        showCloseButton={true}
      >
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Edit Username</h2>
          <p className="text-white/80 text-sm mt-1">
            Choose a unique username (3-20 characters)
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <Input
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setUsernameError("");
              }}
              placeholder="Enter username"
              className="input-base"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only letters, numbers, and underscores allowed
            </p>
            {usernameError && (
              <p className="text-sm text-red-600 mt-2">{usernameError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowUsernameModal(false)}
              className="flex-1 btn-base btn-md btn-secondary font-semibold"
              disabled={savingUsername}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUsernameSave}
              disabled={savingUsername || !newUsername.trim()}
              className="flex-1 btn-base btn-md btn-primary font-semibold flex items-center justify-center gap-2"
            >
              {savingUsername ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Username"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};