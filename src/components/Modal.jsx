/**
 * Modal Component with Hidden Checkbox Control
 * 
 * Uses hidden checkbox pattern for state management.
 * The modal is controlled by a checkbox with a unique ID.
 * 
 * @component
 */

// src/components/Modal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClass = '',
  closeOnOverlay = true,
  closeOnEscape = true,
  lockScroll = true,
  animationType = 'slide-up',
  showCloseButton = false,
}) => {
  const modalRef = useRef(null);

  // Handle scroll lock
  useEffect(() => {
    if (!lockScroll) return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, lockScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Animation classes
  const animationClasses = {
    'slide-up': 'animate-slide-up',
    'fade': 'animate-fade-in',
    'scale': 'animate-scale'
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${overlayClass}`}
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative max-w-full
          ${animationClasses[animationType]}
          ${className}
        `}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {children}
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};