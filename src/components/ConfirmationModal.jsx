/**
 * Confirmation Modal Component
 * 
 * Checkbox-controlled confirmation modal.
 * 
 * @component
 */

import { Modal } from './Modal';

export const ConfirmationModal = ({
  modalId = 'confirmation-modal',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = 'red'
}) => {
  // Color classes for confirm button
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-primary hover:bg-secondary',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    // Close modal
    const checkbox = document.getElementById(modalId);
    if (checkbox) checkbox.checked = false;
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    // Close modal
    const checkbox = document.getElementById(modalId);
    if (checkbox) checkbox.checked = false;
  };

  return (
    <Modal
      modalId={modalId}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      animationType="slide-up"
      showCloseButton={true}
      closeOnOverlay={false}
      closeOnEscape={true}
    >
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
          onClick={handleCancel}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`flex-1 px-4 py-3 ${colorClasses[confirmColor]} text-white rounded-xl font-semibold transition-colors`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};