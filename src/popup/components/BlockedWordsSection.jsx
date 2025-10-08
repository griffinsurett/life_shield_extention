/**
 * Blocked Words Section Component
 * 
 * Section for managing blocked words in the popup.
 * 
 * Features:
 * - List of blocked words as badges
 * - Add new word input
 * - Count indicator
 * - Scrollable list
 * - Empty state message
 * 
 * @component
 * @param {Object} props
 * @param {string[]} props.words - Array of blocked words
 * @param {string} props.newWord - Current input value
 * @param {Function} props.onNewWordChange - Called when input changes
 * @param {Function} props.onAddWord - Called when add button clicked
 * @param {Function} props.onRemoveWord - Called when word removed
 */

import { WordBadge } from './WordBadge';

export const BlockedWordsSection = ({ 
  words, 
  newWord, 
  onNewWordChange, 
  onAddWord, 
  onRemoveWord 
}) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">Blocked Words</h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{words.length}</span>
      </div>
      
      {/* Words List - scrollable */}
      <div className="mb-3 max-h-32 overflow-y-auto pr-2">
        {words.length === 0 ? (
          // Empty state
          <div className="text-center py-4 text-white/50 text-sm">
            No blocked words yet. Add one below!
          </div>
        ) : (
          // Word badges
          words.map((word, index) => (
            <WordBadge 
              key={index}
              word={word}
              onRemove={() => onRemoveWord(index)}
            />
          ))
        )}
      </div>
      
      {/* Add Word Input */}
      <div className="space-y-2">
        <input 
          type="text" 
          value={newWord}
          onChange={(e) => onNewWordChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddWord()}
          placeholder="Type word to block..."
          className="w-full px-4 py-2.5 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
        />
        
        {/* Add button */}
        <button 
          onClick={onAddWord}
          className="w-full px-4 py-2.5 bg-white text-primary rounded-lg font-semibold text-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {/* Plus icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Word
        </button>
      </div>
    </div>
  );
};