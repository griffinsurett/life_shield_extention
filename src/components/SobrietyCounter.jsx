// src/components/SobrietyCounter.jsx
import Button from './Button';
import { useSobrietyTracker } from '../hooks/useSobrietyTracker';
import { MilestoneDisplay } from './MilestoneDisplay';

export const SobrietyCounter = () => {
  const { sobrietyDate, timeElapsed, currentMilestone, isTracking } = useSobrietyTracker();

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  // If no date is set, show setup prompt
  if (!isTracking) {
    return (
      <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <div className="text-center">
          <div className="text-5xl mb-3">🌱</div>
          <h3 className="text-lg font-bold mb-2">Track Your Journey</h3>
          <p className="text-sm opacity-80 mb-4">
            Set your sobriety date to track your progress
          </p>
          <Button
            onClick={openSettings}
            className="px-6 py-3 bg-white text-primary rounded-lg font-bold hover:shadow-xl hover:scale-105 transition-all"
          >
            Set Sobriety Date
          </Button>
        </div>
      </div>
    );
  }

  // Show counter with current milestone
  return (
    <div className="space-y-4">
      {/* Current Milestone - Always shown at top */}
      {currentMilestone && (
        <MilestoneDisplay milestone={currentMilestone} variant="compact" />
      )}
      
      <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-base font-bold">Your Journey</h3>
          <p className="text-xs opacity-70 mt-1">
            Since {sobrietyDate.toLocaleDateString()} at {sobrietyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Days Counter (Large) - Shows Years if applicable */}
        <div className="bg-white/10 rounded-xl p-5 mb-4 text-center backdrop-blur-sm">
          {timeElapsed.years > 0 ? (
            <>
              <div className="text-5xl font-bold mb-1">
                {timeElapsed.years}
                <span className="text-3xl ml-1">
                  {timeElapsed.years === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <div className="text-xl font-medium opacity-80 mb-1">
                {timeElapsed.months} {timeElapsed.months === 1 ? 'Month' : 'Months'}
              </div>
              <div className="text-sm opacity-70">
                {timeElapsed.days.toLocaleString()} total days
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl font-bold mb-2">{timeElapsed.days}</div>
              <div className="text-base font-medium opacity-90">
                {timeElapsed.days === 1 ? 'Day' : 'Days'} Clean
              </div>
            </>
          )}
        </div>

        {/* Time Breakdown - Hours, Minutes, Seconds */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">{String(timeElapsed.hours).padStart(2, '0')}</div>
            <div className="text-xs opacity-80">Hours</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">{String(timeElapsed.minutes).padStart(2, '0')}</div>
            <div className="text-xs opacity-80">Minutes</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">{String(timeElapsed.seconds).padStart(2, '0')}</div>
            <div className="text-xs opacity-80">Seconds</div>
          </div>
        </div>

        {/* View Full Progress Button */}
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

export default SobrietyCounter;