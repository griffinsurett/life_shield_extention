/**
 * Confirmation Modal Component
 * 
 * Checkbox-controlled confirmation modal.
 * 
 * @component
 */

import { Modal } from './Modal';
import Button from './Button';

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
    red: 'btn-danger',
    primary: 'btn-primary',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500'
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
      showCloseButton={false}
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
        <Button
          onClick={handleCancel}
          className="flex-1 btn-base btn-md btn-secondary font-semibold"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          className={`flex-1 btn-base btn-md ${colorClasses[confirmColor]} font-semibold`}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};