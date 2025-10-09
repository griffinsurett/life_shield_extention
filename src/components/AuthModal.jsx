// src/components/AuthModal.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastContainer';

export const AuthModal = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
          // User is now logged in (but email unverified)
          showToast('Account created! Please verify your email.', 'success');
          onClose(); // Close modal - they're logged in!
        }
      } else {
        // Sign in
        const { error } = await signIn(email, password);
        
        if (error) {
          // Better error message for unverified email
          if (error.message.includes('Email not confirmed')) {
            showToast('Please verify your email before signing in. Check your inbox!', 'error');
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