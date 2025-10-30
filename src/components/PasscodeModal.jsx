// src/components/PasscodeModal.jsx
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import Button from './Button';
import Input from './Inputs/Input';
import { hashString } from '../utils/hashing';
import { STORAGE_KEYS } from '../config';
import { useRateLimiting } from '../hooks/useRateLimiting';

export const PasscodeModal = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'verify',
  title,
  message
}) => {
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rateLimiting = useRateLimiting({
    maxAttempts: 5,
    lockoutDuration: 60 * 60 * 1000, // 1 hour
  });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPasscode('');
        setConfirmPasscode('');
        setError('');
      }, 300);
    } else {
      // Check lockout status when modal opens
      rateLimiting.checkLockoutStatus();
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (!passcode.trim()) {
      setError('Please enter your passcode');
      return;
    }

    // Check if locked out
    if (rateLimiting.isLockedOut) {
      const minutesLeft = rateLimiting.getRemainingLockoutTime();
      setError(`Too many attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.PASSCODE_HASH]);
      const storedHash = result[STORAGE_KEYS.PASSCODE_HASH];

      if (!storedHash) {
        setError('No passcode set. Please set one first.');
        setLoading(false);
        return;
      }

      const enteredHash = await hashString(passcode);

      if (enteredHash === storedHash) {
        // Success
        await rateLimiting.clearAttempts();
        onSuccess(passcode);
        onClose();
      } else {
        // Failed attempt
        const result = await rateLimiting.recordFailedAttempt();
        
        if (result.locked) {
          setError('Too many failed attempts. Locked for 1 hour.');
        } else {
          setError(`Incorrect passcode (${result.attempts}/${5} attempts)`);
        }
        
        setPasscode('');
      }
    } catch (err) {
      console.error('Passcode verification error:', err);
      setError('Failed to verify passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!passcode.trim()) {
      setError('Please enter a passcode');
      return;
    }

    if (passcode.length < 4) {
      setError('Passcode must be at least 4 characters');
      return;
    }

    if (mode === 'setup' && passcode !== confirmPasscode) {
      setError('Passcodes do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const hash = await hashString(passcode);
      await chrome.storage.local.set({ [STORAGE_KEYS.PASSCODE_HASH]: hash });

      onSuccess(passcode);
      onClose();
    } catch (err) {
      console.error('Passcode setup error:', err);
      setError('Failed to save passcode');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'setup') {
      handleSetup();
    } else {
      handleVerify();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      animationType="slide-up"
      showCloseButton={true}
    >
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔐</span>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {title || (mode === 'setup' ? 'Set Passcode' : 'Enter Passcode')}
            </h2>
            {message && (
              <p className="text-white/90 text-sm mt-1">{message}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Lockout Warning */}
        {rateLimiting.isLockedOut && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🚫</span>
              <div>
                <p className="text-sm font-medium text-red-900">
                  Account Locked
                </p>
                <p className="text-xs text-red-800 mt-1">
                  Too many failed attempts. Please try again in {rateLimiting.getRemainingLockoutTime()} minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verify mode warning */}
        {mode === 'verify' && !rateLimiting.isLockedOut && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Protected Content
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  This list contains potentially triggering content. Enter your passcode to view.
                </p>
                {rateLimiting.remainingAttempts < 5 && (
                  <p className="text-xs text-yellow-900 mt-2 font-medium">
                    {rateLimiting.remainingAttempts} attempt{rateLimiting.remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Setup mode instructions */}
        {mode === 'setup' && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Choose a Memorable Passcode
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  This passcode will be required to view your blocked content lists. Make it something you'll remember.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Passcode Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passcode
          </label>
          <Input
            type="password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder={mode === 'setup' ? 'Enter at least 4 characters' : 'Enter your passcode'}
            required
            minLength={mode === 'setup' ? 4 : 1}
            className="input-base"
            autoFocus
            disabled={rateLimiting.isLockedOut}
          />
        </div>

        {/* Confirm Passcode (Setup mode only) */}
        {mode === 'setup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Passcode
            </label>
            <Input
              type="password"
              value={confirmPasscode}
              onChange={(e) => {
                setConfirmPasscode(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter passcode again"
              required
              minLength={4}
              className="input-base"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-800 flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 btn-base btn-md btn-secondary font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              loading || 
              !passcode.trim() || 
              (mode === 'setup' && !confirmPasscode.trim()) ||
              rateLimiting.isLockedOut
            }
            className="flex-1 btn-base btn-md btn-primary font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : mode === 'setup' ? (
              'Set Passcode'
            ) : (
              'Unlock'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasscodeModal;