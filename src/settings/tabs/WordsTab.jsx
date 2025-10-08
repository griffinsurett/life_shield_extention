/**
 * Words Tab Component
 * 
 * Tab for managing blocked words.
 * 
 * Features:
 * - Add new words with validation
 * - List of current blocked words
 * - Remove individual words
 * - Clear all words with confirmation
 * - Grid layout for better organization
 * - Empty state message
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.settings - Current settings
 * @param {Function} props.updateSettings - Update settings function
 */

import { useListManager } from "../../hooks/useListManager";
import { AddItemInput } from "../../components/AddItemInput";
import { ListItem } from "../../components/ListItem";
import { SectionHeader } from "../../components/SectionHeader";

export const WordsTab = ({ settings, updateSettings }) => {
  /**
   * Use list manager hook for word operations
   * Handles add, remove, and clear functionality
   */
  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    { itemName: "word" }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>

      {/* Add word section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border-2 border-primary/20">
        <AddItemInput
          value={wordManager.inputValue}
          onChange={wordManager.setInputValue}
          onAdd={wordManager.addItem}
          placeholder="Enter word or phrase to block..."
          buttonText="Add Word"
        />
      </div>

      {/* Words list */}
      <div>
        <SectionHeader
          title="Current Blocked Words"
          count={settings.blockedWords.length}
        />

        {/* Grid layout for words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
          {settings.blockedWords.length === 0 ? (
            // Empty state
            <div className="col-span-2 text-center py-12 text-gray-400">
              <p className="font-medium">No blocked words yet</p>
              <p className="text-sm mt-1">Add one using the input above</p>
            </div>
          ) : (
            // Word items
            settings.blockedWords.map((word, index) => (
              <ListItem
                key={index}
                onRemove={() => wordManager.removeItem(index)}
              >
                {word}
              </ListItem>
            ))
          )}
        </div>
      </div>

      {/* Clear all button */}
      <div className="mt-6">
        <button
          onClick={() =>
            wordManager.clearAll(
              "Are you sure you want to remove all blocked words?"
            )
          }
          className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};