// src/components/SobrietyTracker/SetDateModal.jsx
import { Modal } from '../Modal';
import Button from '../Button';
import Input from '../Inputs/Input';

export const SetDateModal = ({
  isOpen,
  onClose,
  dateInput,
  setDateInput,
  timeInput,
  setTimeInput,
  onSave,
  maxDate,
  existingDate
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      animationType="slide-up"
      showCloseButton={true}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
        <h2 className="text-2xl font-bold text-white">
          {existingDate ? 'Edit' : 'Set'} Your Sobriety Date
        </h2>
        <p className="text-white/80 text-sm mt-1">
          {existingDate ? 'Update when your journey began' : 'When did your journey begin?'}
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <Input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            max={maxDate}
            className="input-base"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time (optional)
          </label>
          <Input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className="input-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            Set the approximate time if you remember
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                Track Your Progress
              </p>
              <p className="text-xs text-blue-800">
                Your sobriety date will be used to display a live counter showing your progress in days, hours, minutes, and seconds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            className="flex-1 btn-base btn-md btn-secondary font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!dateInput}
            className="flex-1 btn-base btn-md btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingDate ? 'Update Date' : 'Set Date'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};