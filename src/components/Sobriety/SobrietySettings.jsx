// src/components/Sobriety/SobrietySettings.jsx
import { useState } from "react";
import { useSobrietyTracker } from "./hooks/useSobrietyTracker";
import { MilestoneDisplay } from "../MilestoneDisplay";
import { SetDateModal } from "./SetDateModal";
import { SobrietySetupPrompt } from "./SobrietySetupPrompt";
import { SobrietyDaysDisplay } from "./SobrietyDaysDisplay";
import { SobrietyTimeGrid } from "./SobrietyTimeGrid";
import { SobrietyJourneyHeader } from "./SobrietyJourneyHeader";

export const SobrietySettings = ({ showToast, showConfirmation }) => {
  const {
    sobrietyDate,
    timeElapsed,
    timeRemaining,
    dayProgressPercentage,
    currentMilestone,
    setSobrietyDate: setSobrietyDateStorage,
    resetSobrietyDate,
    isTracking,
  } = useSobrietyTracker();

  const [showSetDateModal, setShowSetDateModal] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("12:00");

  const handleSetDate = async () => {
    if (!dateInput) {
      showToast?.("Please select a date", "error");
      return;
    }

    try {
      await setSobrietyDateStorage(dateInput, timeInput);
      setShowSetDateModal(false);
      setDateInput("");
      setTimeInput("12:00");
      showToast?.("Sobriety date set! 🎉", "success");
    } catch (error) {
      showToast?.(error.message || "Error setting date", "error");
    }
  };

  const handleEditDate = () => {
    if (sobrietyDate) {
      const date = sobrietyDate.toISOString().split("T")[0];
      const time = sobrietyDate.toTimeString().slice(0, 5);
      setDateInput(date);
      setTimeInput(time);
    }
    setShowSetDateModal(true);
  };

  const handleResetSobriety = () => {
    showConfirmation({
      title: "Reset Sobriety Date?",
      message:
        "Are you sure you want to reset your sobriety date? This will clear your current progress tracker.",
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
      },
    });
  };

  const maxDate = new Date().toISOString().split("T")[0];

  // If no date is set
  if (!isTracking) {
    return (
      <>
        <SobrietySetupPrompt
          onSetDate={() => setShowSetDateModal(true)}
          variant="settings"
        />

        <SetDateModal
          isOpen={showSetDateModal}
          onClose={() => {
            setShowSetDateModal(false);
            setDateInput("");
            setTimeInput("12:00");
          }}
          dateInput={dateInput}
          setDateInput={setDateInput}
          timeInput={timeInput}
          setTimeInput={setTimeInput}
          onSave={handleSetDate}
          maxDate={maxDate}
          existingDate={null}
        />
      </>
    );
  }

  // Show tracker with countdown
  return (
    <>
      <div className="space-y-4">
        <SobrietyJourneyHeader
          sobrietyDate={sobrietyDate}
          onEdit={handleEditDate}
          onReset={handleResetSobriety}
          variant="full"
        />

        <SobrietyDaysDisplay timeElapsed={timeElapsed} variant="full" />

        {/* Countdown Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-700 font-medium">
            <span>Time Until Next Day:</span>
            <span className="text-lg font-bold text-primary">
              {String(timeRemaining.hours).padStart(2, "0")}:
              {String(timeRemaining.minutes).padStart(2, "0")}:
              {String(timeRemaining.seconds).padStart(2, "0")}
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

        <SobrietyTimeGrid timeElapsed={timeElapsed} variant="full" />

        {/* Current Milestone */}
        {currentMilestone && (
          <MilestoneDisplay milestone={currentMilestone} variant="full" />
        )}
      </div>

      <SetDateModal
        isOpen={showSetDateModal}
        onClose={() => {
          setShowSetDateModal(false);
          setDateInput("");
          setTimeInput("12:00");
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

export default SobrietySettings;
