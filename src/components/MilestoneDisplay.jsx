// src/components/MilestoneDisplay.jsx
import { useMemo } from 'react';

/**
 * Milestone Display Component
 * Shows the current milestone with appropriate styling based on priority
 * 
 * @param {Object} milestone - Milestone object with emoji, title, message, priority
 * @param {string} variant - 'compact' for popup, 'full' for settings
 */
export const MilestoneDisplay = ({ milestone, variant = 'full' }) => {
  if (!milestone) return null;

  // Priority-based styling
  const priorityStyles = useMemo(() => {
    switch (milestone.priority) {
      case 'critical':
        return {
          bg: 'from-yellow-50 to-orange-50',
          border: 'border-yellow-400',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800',
          animation: 'animate-pulse'
        };
      case 'high':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-300',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800',
          animation: ''
        };
      case 'medium':
        return {
          bg: 'from-blue-50 to-blue-50',
          border: 'border-blue-200',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800',
          animation: ''
        };
      default:
        return {
          bg: 'from-gray-50 to-gray-50',
          border: 'border-gray-200',
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-800',
          animation: ''
        };
    }
  }, [milestone.priority]);

  // Compact variant for popup
  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-gradient-to-r ${priorityStyles.bg} rounded-lg border-2 ${priorityStyles.border} ${priorityStyles.animation}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl flex-shrink-0">{milestone.emoji}</span>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm ${priorityStyles.titleColor}`}>
              {milestone.title}
            </h4>
            <p className={`text-xs ${priorityStyles.messageColor} leading-tight`}>
              {milestone.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full variant for settings
  return (
    <div className={`p-6 bg-gradient-to-r ${priorityStyles.bg} rounded-xl border-2 ${priorityStyles.border} ${priorityStyles.animation}`}>
      <div className="flex items-center gap-4">
        <span className="text-5xl flex-shrink-0">{milestone.emoji}</span>
        <div className="flex-1">
          <h3 className={`font-bold text-xl ${priorityStyles.titleColor} mb-1`}>
            {milestone.title}
          </h3>
          <p className={`text-base ${priorityStyles.messageColor} leading-relaxed`}>
            {milestone.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MilestoneDisplay;