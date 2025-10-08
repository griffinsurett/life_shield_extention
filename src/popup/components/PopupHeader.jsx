export const PopupHeader = ({ onRefresh }) => {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">🌿 Wellness Filter</h1>
        <button 
          onClick={onRefresh}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <p className="text-white/70 text-sm">Promoting healthy browsing habits</p>
    </div>
  );
};