/**
 * Toast Container Component
 * 
 * Manages and displays multiple toast notifications.
 * Provides context for showing toasts from anywhere in the app.
 * 
 * Features:
 * - Toast queue management
 * - Auto-dismissal
 * - Fixed positioning (top-right)
 * - Context API for global access
 * 
 * Usage:
 * const { showToast } = useToast();
 * showToast('Success!', 'success');
 * 
 * @component
 */

import { useState, createContext, useContext } from 'react';
import { Toast } from './Toast';

// Create context for toast functionality
const ToastContext = createContext();

/**
 * Custom hook to access toast functions
 * Must be used within ToastProvider
 * 
 * @returns {Object} Object with showToast function
 * @throws {Error} If used outside ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

/**
 * Toast Provider Component
 * Wraps app to provide toast functionality
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const ToastProvider = ({ children }) => {
  // Array of active toasts
  const [toasts, setToasts] = useState([]);

  /**
   * Show a new toast notification
   * Adds toast to queue with unique ID
   * 
   * @param {string} message - Message to display
   * @param {string} type - Toast type ('success', 'error', 'info')
   */
  const showToast = (message, type = 'info') => {
    const id = Date.now(); // Use timestamp as unique ID
    setToasts(prev => [...prev, { id, message, type }]);
  };

  /**
   * Remove a toast from the queue
   * Called when toast auto-dismisses
   * 
   * @param {number} id - Toast ID to remove
   */
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container - fixed to top-right with very high z-index */}
      <div className="fixed top-4 right-4 space-y-2 z-[9999]">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};