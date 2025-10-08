/**
 * Toast Component
 * 
 * Displays temporary notification messages.
 * Auto-dismisses after 3 seconds.
 * 
 * Features:
 * - Success, error, and info variants
 * - Auto-dismiss with timer
 * - Icon for each type
 * - Fade-in animation
 * 
 * @component
 * @param {Object} props
 * @param {string} props.message - Message to display
 * @param {string} props.type - Toast type: 'success', 'error', or 'info' (default)
 * @param {Function} props.onClose - Called when toast should be dismissed
 */

import { useEffect } from 'react';

export const Toast = ({ message, type = 'info', onClose }) => {
  /**
   * Auto-dismiss after 3 seconds
   * Cleanup timer on unmount
   */
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Color classes for each type
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  // Icon SVG paths for each type
  const icons = {
    success: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    ),
    error: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    ),
    info: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  };

  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in flex items-center gap-2 max-w-xs`}>
      {/* Icon */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[type]}
      </svg>
      
      {/* Message */}
      <span>{message}</span>
    </div>
  );
};