/**
 * Replacement Phrases Preview Component
 * 
 * Shows a random replacement phrase with refresh button.
 * Gives users a preview of what blocked words will be replaced with.
 * Shows "Erase Mode" when replacement phrases are disabled.
 * 
 * Features:
 * - Displays random phrase or erase mode message
 * - Refresh button to show another phrase
 * - Italic styling for phrase
 * - Glass morphism card
 * 
 * @component
 * @param {Object} props
 * @param {string} props.phrase - The phrase to display
 * @param {Function} props.onRefresh - Called when refresh button clicked
 * @param {boolean} props.useReplacements - Whether replacement phrases are enabled
 */

import Button from '../../../components/Button';

export const ReplacementPhrasesPreview = ({ phrase, onRefresh, useReplacements }) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
      {/* Header */}
      <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
        {useReplacements ? 'Random Replacement' : 'Replacement Mode'}
      </h2>
      
      {/* Phrase display or erase mode message */}
      <div className="bg-white/10 rounded-lg p-3 text-center">
        {useReplacements ? (
          <>
            {/* Phrase in quotes */}
            <p className="text-sm font-medium italic">&quot;{phrase || 'Loading...'}&quot;</p>
            
            {/* Refresh button */}
            <Button
              onClick={onRefresh}
              className="text-xs text-white/60 hover:text-white mt-2 transition-colors"
            >
              ↻ Show Another
            </Button>
          </>
        ) : (
          <p className="text-sm font-medium">
            🗑️ Erase Mode Active
            <br />
            <span className="text-xs opacity-75">Blocked words will be removed</span>
          </p>
        )}
      </div>
    </div>
  );
};