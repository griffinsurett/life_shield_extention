// src/components/Sobriety/SobrietyPopup.jsx
import { useState } from "react";
import Button from "../Button";
import { useSobrietyTracker } from "./hooks/useSobrietyTracker";
import { MilestoneDisplay } from "../MilestoneDisplay";
import { SetDateModal } from "./SetDateModal";
import { SobrietySetupPrompt } from "./SobrietySetupPrompt";
import { SobrietyDaysDisplay } from "./SobrietyDaysDisplay";
import { SobrietyTimeGrid } from "./SobrietyTimeGrid";
import { SobrietyJourneyHeader } from "./SobrietyJourneyHeader";

export const SobrietyPopup = () => {
  const {
    sobrietyDate,
    timeElapsed,
    currentMilestone,
    isTracking,
    setSobrietyDate: setSobrietyDateStorage,
  } = useSobrietyTracker();

  const [showSetDateModal, setShowSetDateModal] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("12:00");

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleSetDate = async () => {
    if (!dateInput) return;

    try {
      await setSobrietyDateStorage(dateInput, timeInput);
      setShowSetDateModal(false);
      setDateInput("");
      setTimeInput("12:00");
    } catch (error) {
      console.error("Error setting date:", error);
    }
  };

  const maxDate = new Date().toISOString().split("T")[0];

  // If no date is set, show setup prompt
  if (!isTracking) {
    return (
      <>
        <SobrietySetupPrompt
          onSetDate={() => setShowSetDateModal(true)}
          variant="popup"
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

  // Show tracker
  return (
    <div className="space-y-4">
      {/* Current Milestone */}
      {currentMilestone && (
        <MilestoneDisplay milestone={currentMilestone} variant="compact" />
      )}

      <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <SobrietyJourneyHeader sobrietyDate={sobrietyDate} variant="compact" />

        <SobrietyDaysDisplay timeElapsed={timeElapsed} variant="compact" />

        <SobrietyTimeGrid timeElapsed={timeElapsed} variant="compact" />

        <Button
          onClick={openSettings}
          className="w-full px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-all border border-white/20"
        >
          View Full Progress →
        </Button>
      </div>
    </div>
  );
};

export default SobrietyPopup;
