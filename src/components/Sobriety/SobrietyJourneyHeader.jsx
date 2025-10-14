// src/components/SobrietyTracker/SobrietyJourneyHeader.jsx
import Button from '../Button';

export const SobrietyJourneyHeader = ({ 
  sobrietyDate, 
  onEdit, 
  onReset,
  variant = 'full' 
}) => {
  if (variant === 'compact') {
    // Popup version - minimal header
    return (
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🏆</div>
        <h3 className="text-base font-bold">Your Journey</h3>
        <p className="text-xs opacity-70 mt-1">
          Since {sobrietyDate.toLocaleDateString()} at {sobrietyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    );
  }

  // Full version - settings page with action buttons
  return (
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
            onClick={onEdit}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            Edit
          </Button>
          <Button
            onClick={onReset}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};