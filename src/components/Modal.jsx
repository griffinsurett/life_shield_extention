/**
 * Modal Component with Hidden Checkbox Control
 * 
 * Uses hidden checkbox pattern for state management.
 * The modal is controlled by a checkbox with a unique ID.
 * 
 * @component
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  modalId, // Unique ID for the checkbox
  children,
  className = '',
  overlayClass = '',
  closeOnOverlay = true,
  closeOnEscape = true,
  lockScroll = true,
  animationType = 'slide-up',
  showCloseButton = false,
  closeButtonClass = 'absolute top-4 right-4 text-gray-100 hover:text-gray-900 z-10'
}) => {
  const checkboxRef = useRef(null);
  const modalRef = useRef(null);

  // Close modal helper
  const closeModal = () => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
  };

  // Handle scroll lock
  useEffect(() => {
    const checkbox = checkboxRef.current;
    if (!checkbox || !lockScroll) return;

    const handleChange = () => {
      if (checkbox.checked) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    checkbox.addEventListener('change', handleChange);
    return () => {
      checkbox.removeEventListener('change', handleChange);
      document.body.style.overflow = '';
    };
  }, [lockScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && checkboxRef.current?.checked) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape]);

  // Animation classes
  const animationClasses = {
    'slide-up': 'peer-checked:animate-slide-up translate-y-4 peer-checked:translate-y-0',
    'fade': 'peer-checked:animate-fade-in',
    'scale': 'peer-checked:scale-100 peer-checked:opacity-100 scale-95 opacity-0'
  };

  const modalContent = (
    <>
      {/* Hidden Checkbox */}
      <input
        ref={checkboxRef}
        type="checkbox"
        id={modalId}
        className="peer hidden"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="peer-checked:flex hidden fixed inset-0 z-50 items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
      >
        {/* Overlay */}
        <label
          htmlFor={closeOnOverlay ? modalId : undefined}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer ${overlayClass}`}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`
            relative max-w-full
            transform transition-all duration-300
            ${animationClasses[animationType]}
            ${className}
          `}
        >
          {/* Close Button */}
          {showCloseButton && (
            <label
              htmlFor={modalId}
              className={`cursor-pointer ${closeButtonClass}`}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </label>
          )}

          {children}
        </div>
      </div>
    </>
  );

  // For browser extensions, render directly
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

/**
 * Modal Trigger Component
 * Opens the modal when clicked
 */
export const ModalTrigger = ({ modalId, children, className = '' }) => (
  <label htmlFor={modalId} className={`cursor-pointer ${className}`}>
    {children}
  </label>
);

/**
 * Modal Close Component
 * Closes the modal when clicked
 */
export const ModalClose = ({ modalId, children, className = '' }) => (
  <label htmlFor={modalId} className={`cursor-pointer ${className}`}>
    {children}
  </label>
);