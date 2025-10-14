// src/components/SobrietyTracker/SobrietyDaysDisplay.jsx
export const SobrietyDaysDisplay = ({ timeElapsed, variant = 'full' }) => {
  const hasYears = timeElapsed.years > 0;

  if (variant === 'compact') {
    // Popup version - smaller sizing
    return (
      <div className="bg-white/10 rounded-xl p-5 mb-4 text-center backdrop-blur-sm">
        {hasYears ? (
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
    );
  }

  // Full version - settings page
  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-center text-white shadow-lg">
      {hasYears ? (
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
  );
};