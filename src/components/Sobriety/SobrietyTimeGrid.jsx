// src/components/SobrietyTracker/SobrietyTimeGrid.jsx
export const SobrietyTimeGrid = ({ timeElapsed, variant = 'full' }) => {
  if (variant === 'compact') {
    // Popup version - 3 columns with smaller sizing
    return (
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
    );
  }

  // Full version - settings page with totals
  return (
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
  );
};