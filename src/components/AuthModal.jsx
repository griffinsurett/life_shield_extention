// src/components/AuthModal.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastContainer';

export const AuthModal = ({ isOpen, onClose }) => {
  const { signIn, signUp, resendVerification } = useAuth();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password);
        
        if (error) {
          showToast(error.message, 'error');
        } else {
          // With confirmation enabled, data.session will be null
          // User needs to verify email before they can sign in
          setPendingEmail(email);
          setShowEmailVerification(true);
          
          // Don't close modal - show verification screen instead
        }
      } else {
        // Sign in
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            showToast('Please verify your email first. Check your inbox!', 'error');
          } else {
            showToast(error.message, 'error');
          }
        } else {
          showToast('Signed in successfully!', 'success');
          onClose();
        }
      }
    } catch (err) {
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { error } = await resendVerification(pendingEmail);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Verification email sent!', 'success');
      }
    } catch (err) {
      showToast('Failed to resend email', 'error');
    }
  };

  // Email Verification Screen
  if (showEmailVerification) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-t-2xl text-center">
            <div className="text-6xl mb-3">📧</div>
            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
            <p className="text-white/90 text-sm mt-2">
              One click away from getting started!
            </p>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-2">
                We sent a verification link to:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-primary font-semibold break-all">
                  {pendingEmail}
                </p>
              </div>
              
              {/* What happens next */}
              <div className="text-left bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-blue-900 flex items-center gap-2">
                  <span className="text-2xl">✨</span> What happens next:
                </p>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                    <span>Check your email inbox (and spam folder)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                    <span>Click the verification link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600 flex-shrink-0">3.</span>
                    <span><strong>You'll be automatically logged in!</strong> 🎉</span>
                  </li>
                </ol>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-semibold transition-colors"
              >
                Got it!
              </button>
              
              <button
                onClick={() => {
                  setShowEmailVerification(false);
                  setIsSignUp(false);
                  setPassword('');
                }}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </div>

            {/* Resend link */}
            <p className="text-center text-xs text-gray-500">
              Didn't receive the email?{' '}
              <button 
                onClick={handleResend}
                className="text-primary hover:text-secondary underline font-medium"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Sign In / Sign Up Form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {isSignUp 
              ? 'Sign up to sync your settings across devices' 
              : 'Welcome back! Sign in to your account'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword('');
              }}
              className="text-sm text-primary hover:text-secondary transition-colors"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};