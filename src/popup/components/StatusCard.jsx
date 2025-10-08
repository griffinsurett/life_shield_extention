export const StatusCard = ({ todayCount }) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 animate-slide-up shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute w-3 h-3 rounded-full bg-green-400 animate-ping"></span>
            <span className="relative w-3 h-3 rounded-full bg-green-400 block"></span>
          </div>
          <div>
            <div className="font-semibold text-lg">Active</div>
            <div className="text-xs text-white/60">Filtering content</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{todayCount}</div>
          <div className="text-xs text-white/60">Today</div>
        </div>
      </div>
    </div>
  );
};