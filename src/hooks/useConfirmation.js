/**
 * Confirmation Hook
 * 
 * Manages confirmation modal state and callbacks.
 * Provides clean API for showing confirmations before actions.
 * 
 * Features:
 * - Show/hide modal
 * - Pending action storage
 * - Confirm/cancel handlers
 * - Customizable messages
 * 
 * @hook
 * @returns {Object} Confirmation state and handlers
 */

import { useState } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'red',
    onConfirm: () => {}
  });

  /**
   * Show confirmation modal
   * 
   * @param {Object} config - Confirmation configuration
   * @param {string} config.title - Modal title
   * @param {string} config.message - Modal message
   * @param {Function} config.onConfirm - Called when confirmed
   * @param {string} config.confirmText - Confirm button text
   * @param {string} config.cancelText - Cancel button text
   * @param {string} config.confirmColor - Button color (red/primary/orange)
   */
  const showConfirmation = (config) => {
    setConfirmConfig({
      title: config.title || 'Confirm Action',
      message: config.message || 'Are you sure?',
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      confirmColor: config.confirmColor || 'red',
      onConfirm: config.onConfirm || (() => {})
    });
    setIsOpen(true);
  };

  /**
   * Handle confirmation
   * Calls the pending action and closes modal
   */
  const handleConfirm = () => {
    confirmConfig.onConfirm();
    setIsOpen(false);
  };

  /**
   * Handle cancellation
   * Just closes modal without action
   */
  const handleCancel = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    confirmConfig,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
};