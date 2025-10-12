/**
 * Confirmation Hook
 * 
 * Now works with checkbox-based modals.
 * 
 * @hook
 */

// src/hooks/useConfirmation.js
import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'red',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showConfirmation = useCallback((newConfig) => {
    setConfig({
      title: newConfig.title || 'Confirm Action',
      message: newConfig.message || 'Are you sure?',
      confirmText: newConfig.confirmText || 'Confirm',
      cancelText: newConfig.cancelText || 'Cancel',
      confirmColor: newConfig.confirmColor || 'red',
      onConfirm: newConfig.onConfirm || (() => {}),
      onCancel: newConfig.onCancel || (() => {})
    });
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    config.onConfirm();
    setIsOpen(false);
  }, [config]);

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      config.onCancel();
    }
    setIsOpen(false);
  }, [config]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    showConfirmation,
    handleConfirm,
    handleCancel,
    closeModal
  };
};