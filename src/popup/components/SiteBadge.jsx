export const SiteBadge = ({ site, onRemove }) => {
  return (
    <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 m-1 rounded-lg text-xs font-medium transition-all group">
      <span className="text-red-200">🚫</span>
      <span>{site}</span>
      <button 
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 hover:bg-red-500/30 rounded-full p-0.5 transition-all"
        title="Remove site"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};