/**
 * Confirmation Hook
 * 
 * Now works with checkbox-based modals.
 * 
 * @hook
 */

import { useState, useCallback, useRef } from 'react';

export const useConfirmation = (modalId = 'confirmation-modal') => {
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'red',
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  const pendingActionRef = useRef(null);

  /**
   * Show confirmation modal
   */
  const showConfirmation = useCallback((config) => {
    setConfirmConfig({
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure?',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      confirmColor: config.confirmColor || 'red',
      onConfirm: config.onConfirm || (() => {}),
      onCancel: config.onCancel || (() => {})
    });
    
    // Open modal by checking the checkbox
    const checkbox = document.getElementById(modalId);
    if (checkbox) {
      checkbox.checked = true;
    }
  }, [modalId]);

  /**
   * Handle confirmation
   */
  const handleConfirm = useCallback(() => {
    confirmConfig.onConfirm();
    // Close modal
    const checkbox = document.getElementById(modalId);
    if (checkbox) {
      checkbox.checked = false;
    }
  }, [confirmConfig, modalId]);

  /**
   * Handle cancellation
   */
  const handleCancel = useCallback(() => {
    if (confirmConfig.onCancel) {
      confirmConfig.onCancel();
    }
    // Close modal
    const checkbox = document.getElementById(modalId);
    if (checkbox) {
      checkbox.checked = false;
    }
  }, [confirmConfig, modalId]);

  return {
    confirmConfig,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
};