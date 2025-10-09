/**
 * Replacement Phrases Preview Component
 * 
 * Shows a random replacement phrase with refresh button.
 * Gives users a preview of what blocked words will be replaced with.
 * 
 * Features:
 * - Displays random phrase
 * - Refresh button to show another
 * - Italic styling for phrase
 * - Glass morphism card
 * 
 * @component
 * @param {Object} props
 * @param {string} props.phrase - The phrase to display
 * @param {Function} props.onRefresh - Called when refresh button clicked
 */

export const ReplacementPhrasesPreview = ({ phrase, onRefresh }) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
      {/* Header */}
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">Random Replacement</h2>
      
      {/* Phrase display */}
      <div className="bg-white/10 rounded-lg p-3 text-center">
        {/* Phrase in quotes */}
        <p className="text-sm font-medium italic">&quot;{phrase || 'Loading...'}&quot;</p>
        
        {/* Refresh button */}
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