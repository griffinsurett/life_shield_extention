/**
 * Status Card Component
 * 
 * Displays extension status and today's block count.
 * 
 * Features:
 * - Active indicator with pulsing animation
 * - Large count display
 * - Glass morphism effect
 * - Slide-up animation
 * 
 * @component
 * @param {Object} props
 * @param {number} props.todayCount - Number of items blocked today
 */

export const StatusCard = ({ todayCount }) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 animate-slide-up shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side - Active status */}
        <div className="flex items-center gap-3">
          {/* Pulsing green dot indicator */}
          <div className="relative">
            <span className="absolute w-3 h-3 rounded-full bg-green-400 animate-ping"></span>
            <span className="relative w-3 h-3 rounded-full bg-green-400 block"></span>
          </div>
          
          {/* Status text */}
          <div>
            <div className="font-semibold text-lg">Active</div>
            <div className="text-xs text-white/60">Filtering content</div>
          </div>
        </div>
        
        {/* Right side - Count */}
        <div className="text-right">
          <div className="text-2xl font-bold">{todayCount}</div>
          <div className="text-xs text-white/60">Today</div>
        </div>
      </div>
    </div>
  );
};