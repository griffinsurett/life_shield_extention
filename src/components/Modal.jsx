/**
 * Base Modal Component
 * 
 * Reusable modal with all the heavy lifting abstracted.
 * Handles animations, escape key, overlay click, scroll lock.
 * 
 * @component
 */

import { useEffect, useRef, useState } from 'react';
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
  animationType = 'slide-up', // 'slide-up', 'fade', 'scale'
  showCloseButton = false,
  closeButtonClass = 'absolute top-4 right-4 text-white/80 hover:text-white'
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const modalRef = useRef(null);

  // Handle mounting
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Small delay for animation
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else {
      setVisible(false);
      // Wait for animation before unmounting
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle scroll lock
  useEffect(() => {
    if (!lockScroll || !mounted) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [mounted, lockScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !mounted) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mounted, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  // Animation classes based on type
  const animationClasses = {
    'slide-up': visible ? 'animate-slide-up' : 'translate-y-4 opacity-0',
    'fade': visible ? 'animate-fade-in' : 'opacity-0',
    'scale': visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
  };

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      {/* Overlay */}
      <div 
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          ${overlayClass}
        `}
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className={closeButtonClass}
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

  // For browser extensions, we don't need portals since we're in isolated contexts
  // But we'll keep it for flexibility
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};