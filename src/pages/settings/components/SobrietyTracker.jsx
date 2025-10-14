// src/pages/settings/components/SobrietyTracker.jsx
import { useState } from 'react';
import Button from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import Input from '../../../components/Inputs/Input';
import { useSobrietyTracker } from '../../../hooks/useSobrietyTracker';

export const SobrietyTracker = ({ showToast, showConfirmation }) => {
  const {
    sobrietyDate,
    timeElapsed,
    timeRemaining,
    dayProgressPercentage,
    milestones,
    setSobrietyDate: setSobrietyDateStorage,
    resetSobrietyDate,
    isTracking
  } = useSobrietyTracker();

  const [showSetDateModal, setShowSetDateModal] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('12:00');

  // Handle setting sobriety date
  const handleSetDate = async () => {
    if (!dateInput) {
      showToast?.('Please select a date', 'error');
      return;
    }

    try {
      await setSobrietyDateStorage(dateInput, timeInput);
      setShowSetDateModal(false);
      setDateInput('');
      setTimeInput('12:00');
      showToast?.('Sobriety date set! 🎉', 'success');
    } catch (error) {
      showToast?.(error.message || 'Error setting date', 'error');
    }
  };

  const handleEditDate = () => {
    if (sobrietyDate) {
      const date = sobrietyDate.toISOString().split('T')[0];
      const time = sobrietyDate.toTimeString().slice(0, 5);
      setDateInput(date);
      setTimeInput(time);
    }
    setShowSetDateModal(true);
  };

  const handleResetSobriety = () => {
    showConfirmation({
      title: "Reset Sobriety Date?",
      message: "Are you sure you want to reset your sobriety date? This will clear your current progress tracker.",
      confirmText: "Yes, Reset",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await resetSobrietyDate();
          showToast?.("Sobriety date reset", "success");
        } catch {
          showToast?.("Error resetting date", "error");
        }
      }
    });
  };

  const maxDate = new Date().toISOString().split('T')[0];

  // If no date is set
  if (!isTracking) {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              🌱
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Start Tracking Your Journey
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Set your sobriety date to track your progress with a live counter showing days, hours, minutes, and seconds.
              </p>
              <ul className="space-y-1 text-xs text-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Real-time progress counter</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Motivational milestones</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Track your success visually</span>
                </li>
              </ul>
            </div>
          </div>
          
          <Button
            onClick={() => setShowSetDateModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Set Your Sobriety Date
          </Button>
        </div>

        <SetDateModal
          isOpen={showSetDateModal}
          onClose={() => {
            setShowSetDateModal(false);
            setDateInput('');
            setTimeInput('12:00');
          }}
          dateInput={dateInput}
          setDateInput={setDateInput}
          timeInput={timeInput}
          setTimeInput={setTimeInput}
          onSave={handleSetDate}
          maxDate={maxDate}
          existingDate={sobrietyDate}
        />
      </>
    );
  }

  // Show tracker with countdown
  return (
    <>
      <div className="space-y-4">
        {/* Journey Info Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
                🏆
              </div>
              <div>
                <h4 className="font-bold text-green-900">Your Journey</h4>
                <p className="text-xs text-green-700">
                  Started {sobrietyDate.toLocaleDateString()} at {sobrietyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEditDate}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
              >
                Edit
              </Button>
              <Button
                onClick={handleResetSobriety}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* DAYS COUNTER - NEW SECTION */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-center text-white shadow-lg">
          {timeElapsed.years > 0 ? (
            <>
              <div className="text-5xl font-bold mb-2">
                {timeElapsed.years}
                <span className="text-3xl ml-2">
                  {timeElapsed.years === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <div className="text-2xl font-medium mb-1">
                {timeElapsed.months} {timeElapsed.months === 1 ? 'Month' : 'Months'}
              </div>
              <div className="text-lg opacity-90">
                {timeElapsed.days.toLocaleString()} total days
              </div>
            </>
          ) : (
            <>
              <div className="text-7xl font-bold mb-3">{timeElapsed.days}</div>
              <div className="text-xl font-medium opacity-95">
                {timeElapsed.days === 1 ? 'Day' : 'Days'} Clean
              </div>
            </>
          )}
        </div>

        {/* Countdown Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
            <span>Time Until Next Day:</span>
            <span className="text-lg font-bold text-primary">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${100 - dayProgressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
                {(100 - dayProgressPercentage).toFixed(1)}% complete
              </span>
            </div>
          </div>
        </div>

        {/* Milestones Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⏰</span>
              <h5 className="text-xs font-bold text-blue-900">Total Hours</h5>
            </div>
            <p className="text-2xl font-bold text-blue-600">{timeElapsed.totalHours.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⏱️</span>
              <h5 className="text-xs font-bold text-purple-900">Total Minutes</h5>
            </div>
            <p className="text-2xl font-bold text-purple-600">{timeElapsed.totalMinutes.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚡</span>
              <h5 className="text-xs font-bold text-pink-900">Total Seconds</h5>
            </div>
            <p className="text-2xl font-bold text-pink-600">{timeElapsed.totalSeconds.toLocaleString()}</p>
          </div>
        </div>

        {/* Current Achievement */}
        {milestones.lastMilestone && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{milestones.lastMilestone.emoji}</span>
              <div className="flex-1">
                <h5 className="font-bold text-yellow-900 mb-0.5">{milestones.lastMilestone.title}</h5>
                <p className="text-sm text-yellow-800">{milestones.lastMilestone.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SetDateModal
        isOpen={showSetDateModal}
        onClose={() => {
          setShowSetDateModal(false);
          setDateInput('');
          setTimeInput('12:00');
        }}
        dateInput={dateInput}
        setDateInput={setDateInput}
        timeInput={timeInput}
        setTimeInput={setTimeInput}
        onSave={handleSetDate}
        maxDate={maxDate}
        existingDate={sobrietyDate}
      />
    </>
  );
};

// Set Date Modal Component
const SetDateModal = ({ isOpen, onClose, dateInput, setDateInput, timeInput, setTimeInput, onSave, maxDate, existingDate }) => {
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

export default SobrietyTracker;