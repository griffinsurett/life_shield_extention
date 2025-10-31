// src/components/PasscodeSection/PasscodeSection.jsx
import { useState, useEffect } from 'react';
import { PasscodeModal } from '../../../components/PasscodeModal';
import Button from '../../../components/Button';
import { STORAGE_KEYS } from '../../../config';

/**
 * PasscodeSection Component
 * 
 * Manages passcode protection settings for blocked content lists.
 * Allows users to set, change, or remove their passcode.
 * 
 * @param {Object} props
 * @param {Function} props.showToast - Toast notification function
 * @param {Function} props.showConfirmation - Confirmation modal function
 */
export const PasscodeSection = ({ showToast, showConfirmation }) => {
  const [hasPasscode, setHasPasscode] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeMode, setPasscodeMode] = useState('setup');
  const [passcodeAction, setPasscodeAction] = useState(null); // 'change' or 'remove'
  const [loadingPasscode, setLoadingPasscode] = useState(true);

  // Check if passcode exists on mount
  useEffect(() => {
    const checkPasscode = async () => {
      try {
        const result = await chrome.storage.local.get([STORAGE_KEYS.PASSCODE_HASH]);
        setHasPasscode(!!result[STORAGE_KEYS.PASSCODE_HASH]);
      } catch (error) {
        console.error('Error checking passcode:', error);
      } finally {
        setLoadingPasscode(false);
      }
    };
    
    checkPasscode();

    // Listen for passcode changes
    const listener = (changes, namespace) => {
      if (namespace === 'local' && changes[STORAGE_KEYS.PASSCODE_HASH]) {
        setHasPasscode(!!changes[STORAGE_KEYS.PASSCODE_HASH].newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  /**
   * Handle setting up new passcode
   */
  const handleSetPasscode = () => {
    setPasscodeMode('setup');
    setPasscodeAction('setup');
    setShowPasscodeModal(true);
  };

  /**
   * Handle changing passcode
   */
  const handleChangePasscode = () => {
    setPasscodeMode('verify');
    setPasscodeAction('change');
    setShowPasscodeModal(true);
  };

  /**
   * Handle removing passcode - requires verification first
   */
  const handleRemovePasscode = () => {
    setPasscodeMode('verify');
    setPasscodeAction('remove');
    setShowPasscodeModal(true);
  };

  /**
   * Actually remove the passcode (called after confirmation)
   */
  const executeRemovePasscode = async () => {
    try {
      await chrome.storage.local.remove([
        STORAGE_KEYS.PASSCODE_HASH,
        'failed_attempts',
        'passcode_lockout'
      ]);
      setHasPasscode(false);
      showToast('Passcode removed successfully', 'success');
    } catch (error) {
      console.error('Error removing passcode:', error);
      showToast('Failed to remove passcode', 'error');
    }
  };

  /**
   * Handle passcode verification/setup success
   */
  const handlePasscodeSuccess = () => {
    // Handle different actions based on what was requested
    if (passcodeAction === 'setup') {
      // Setting up new passcode
      setHasPasscode(true);
      showToast('Passcode set successfully', 'success');
      setPasscodeAction(null);
    } else if (passcodeAction === 'change') {
      // Verified for change - now show setup modal for new passcode
      setPasscodeMode('setup');
      setPasscodeAction('setup');
      // Keep modal open, just change mode
    } else if (passcodeAction === 'remove') {
      // Verified for removal - now show confirmation dialog
      showConfirmation({
        title: 'Remove Passcode?',
        message: 'Your blocked content lists will no longer be protected. Anyone with access to this browser will be able to view them. Are you sure you want to remove your passcode?',
        confirmText: 'Remove Passcode',
        cancelText: 'Keep Passcode',
        confirmColor: 'red',
        onConfirm: executeRemovePasscode
      });
      setPasscodeAction(null);
      setShowPasscodeModal(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setShowPasscodeModal(false);
    setPasscodeAction(null);
    setPasscodeMode('setup');
  };

  /**
   * Get modal title based on action
   */
  const getModalTitle = () => {
    if (passcodeMode === 'verify') {
      if (passcodeAction === 'change') {
        return 'Verify Current Passcode';
      } else if (passcodeAction === 'remove') {
        return 'Verify Passcode to Remove';
      }
    } else if (passcodeMode === 'setup') {
      if (passcodeAction === 'setup' && hasPasscode) {
        return 'Set New Passcode';
      }
    }
    return undefined; // Use default
  };

  /**
   * Get modal message based on action
   */
  const getModalMessage = () => {
    if (passcodeMode === 'verify') {
      if (passcodeAction === 'change') {
        return 'Enter your current passcode to change it';
      } else if (passcodeAction === 'remove') {
        return 'Enter your current passcode to proceed with removal';
      }
    } else if (passcodeMode === 'setup') {
      if (passcodeAction === 'setup' && hasPasscode) {
        return 'Enter a new passcode to replace your current one';
      }
    }
    return undefined; // Use default
  };

  return (
    <>
      <div className="space-y-4">
        {/* Section Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Passcode Protection
          </h3>
          <p className="text-sm text-gray-600">
            {hasPasscode
              ? 'Your blocked content lists are protected with a passcode.'
              : 'Protect your blocked content lists with a passcode to prevent accidental viewing.'}
          </p>
        </div>

        {/* Loading State */}
        {loadingPasscode ? (
          <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Current Status */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              hasPasscode 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  hasPasscode ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <span className="text-2xl">{hasPasscode ? '🔒' : '🔓'}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {hasPasscode ? 'Passcode Active' : 'No Passcode Set'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasPasscode
                      ? 'You will need to enter your passcode to view blocked lists'
                      : 'Anyone with access to this browser can view your blocked lists'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!hasPasscode ? (
                <Button
                  onClick={handleSetPasscode}
                  className="w-full btn-base btn-lg btn-primary font-medium flex items-center justify-center gap-2"
                >
                  <span>🔐</span>
                  Set Passcode
                </Button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleChangePasscode}
                    className="btn-base btn-md btn-primary font-medium flex items-center justify-center gap-2"
                  >
                    <span>🔄</span>
                    Change Passcode
                  </Button>
                  <Button
                    onClick={handleRemovePasscode}
                    className="btn-base btn-md btn-danger font-medium flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    Remove Passcode
                  </Button>
                </div>
              )}
            </div>

            {/* Security Features Info */}
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Security Features
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Privacy:</strong> Blocked content stored as encrypted hashes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Auto-Lock:</strong> Lists lock after 5 minutes of inactivity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Tab Switch:</strong> Lists lock when you switch tabs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Screenshot Protection:</strong> Locks on screenshot attempt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Rate Limiting:</strong> 1 hour lockout after 5 failed attempts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span><strong>Verification Required:</strong> Passcode needed to change or remove</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Why Use Passcode (only show if no passcode) */}
            {!hasPasscode && (
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-2">
                      Why Use a Passcode?
                    </p>
                    <ul className="text-xs text-yellow-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span>Prevents accidental viewing of triggering content</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span>Adds accountability in your recovery journey</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span>Protects privacy if others use your device</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span>Creates a "speed bump" during moments of weakness</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Passcode Modal */}
      <PasscodeModal
        isOpen={showPasscodeModal}
        onClose={handleModalClose}
        onSuccess={handlePasscodeSuccess}
        mode={passcodeMode}
        title={getModalTitle()}
        message={getModalMessage()}
      />
    </>
  );
};

export default PasscodeSection;