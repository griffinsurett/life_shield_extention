export const ReplacementPhrasesPreview = ({ phrase, onRefresh }) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">Random Replacement</h2>
      <div className="bg-white/10 rounded-lg p-3 text-center">
        <p className="text-sm font-medium italic">&quot;{phrase || 'Loading...'}&quot;</p>
        <button 
          onClick={onRefresh}
          className="text-xs text-white/60 hover:text-white mt-2 transition-colors"
        >
          ↻ Show Another
        </button>
      </div>
    </div>
  );
};