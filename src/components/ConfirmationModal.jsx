/**
 * Confirmation Modal Component
 * 
 * Reusable modal for confirming destructive actions.
 * 
 * Features:
 * - Backdrop overlay
 * - Custom title and message
 * - Confirm/Cancel buttons
 * - Keyboard support (ESC to cancel)
 * - Smooth animations
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {string} props.confirmText - Confirm button text (default: "Confirm")
 * @param {string} props.cancelText - Cancel button text (default: "Cancel")
 * @param {Function} props.onConfirm - Called when confirmed
 * @param {Function} props.onCancel - Called when cancelled
 * @param {string} props.confirmColor - Confirm button color (default: "red")
 */

import { useEffect } from 'react';

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = 'red'
}) => {
  // Handle ESC key to cancel
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Color classes for confirm button
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-primary hover:bg-secondary',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${colorClasses[confirmColor]} text-white rounded-xl font-semibold transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};