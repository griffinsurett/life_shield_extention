// src/components/Sobriety/SobrietyPopup.jsx
import { useState } from 'react';
import Button from '../Button';
import { useSobrietyTracker } from './hooks/useSobrietyTracker';
import { MilestoneDisplay } from '../MilestoneDisplay';
import { SetDateModal } from './SetDateModal';
import { SobrietySetupPrompt } from './SobrietySetupPrompt';
import { SobrietyDaysDisplay } from './SobrietyDaysDisplay';
import { SobrietyTimeGrid } from './SobrietyTimeGrid';
import { SobrietyJourneyHeader } from './SobrietyJourneyHeader';
import { getCurrentDate, getCurrentTime, getMaxDate } from '../../utils/dateHelpers';

export const SobrietyPopup = () => {
  const { 
    sobrietyDate, 
    timeElapsed, 
    currentMilestone, 
    isTracking,
    setSobrietyDate: setSobrietyDateStorage
  } = useSobrietyTracker();

  const [showSetDateModal, setShowSetDateModal] = useState(false);
  const [dateInput, setDateInput] = useState(getCurrentDate());
  const [timeInput, setTimeInput] = useState(getCurrentTime());

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleSetDate = async () => {
    if (!dateInput) return;

    try {
      await setSobrietyDateStorage(dateInput, timeInput);
      setShowSetDateModal(false);
      // Reset to current date/time after successful save
      setDateInput(getCurrentDate());
      setTimeInput(getCurrentTime());
    } catch (error) {
      console.error('Error setting date:', error);
    }
  };

  const handleOpenModal = () => {
    // Reset to current date/time when opening modal
    setDateInput(getCurrentDate());
    setTimeInput(getCurrentTime());
    setShowSetDateModal(true);
  };

  const handleCloseModal = () => {
    setShowSetDateModal(false);
    // Reset to current date/time when closing
    setDateInput(getCurrentDate());
    setTimeInput(getCurrentTime());
  };

  // If no date is set, show setup prompt
  if (!isTracking) {
    return (
      <>
        <SobrietySetupPrompt 
          onSetDate={handleOpenModal} 
          variant="popup" 
        />

        <SetDateModal
          isOpen={showSetDateModal}
          onClose={handleCloseModal}
          dateInput={dateInput}
          setDateInput={setDateInput}
          timeInput={timeInput}
          setTimeInput={setTimeInput}
          onSave={handleSetDate}
          maxDate={getMaxDate()}
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
        <SobrietyJourneyHeader 
          sobrietyDate={sobrietyDate} 
          variant="compact"
        />

        <SobrietyDaysDisplay 
          timeElapsed={timeElapsed} 
          variant="compact" 
        />

        <SobrietyTimeGrid 
          timeElapsed={timeElapsed} 
          variant="compact" 
        />

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