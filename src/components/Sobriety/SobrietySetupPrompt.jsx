// src/components/SobrietyTracker/SobrietySetupPrompt.jsx
import Button from '../Button';

export const SobrietySetupPrompt = ({ onSetDate, variant = 'settings' }) => {
  if (variant === 'popup') {
    return (
      <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <div className="text-center">
          <div className="text-5xl mb-3">🌱</div>
          <h3 className="text-lg font-bold mb-2">Track Your Journey</h3>
          <p className="text-sm opacity-80 mb-4">
            Set your sobriety date to track your progress
          </p>
          <Button
            onClick={onSetDate}
            className="px-6 py-3 bg-white text-primary rounded-lg font-bold hover:shadow-xl hover:scale-105 transition-all"
          >
            Set Sobriety Date
          </Button>
        </div>
      </div>
    );
  }

  // Settings variant (full)
  return (
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
        onClick={onSetDate}
        className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        Set Your Sobriety Date
      </Button>
    </div>
  );
};