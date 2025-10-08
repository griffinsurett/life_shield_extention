/**
 * Words Tab Component
 * 
 * Tab for managing blocked words.
 * Now significantly simplified using ListManager and AppContext.
 * 
 * @component
 */

import { useApp } from "../../contexts/AppContext";
import { useListManager } from "../../hooks/useListManager";
import ListManager from "../../components/ListManager";

export const WordsTab = ({ showConfirmation }) => {
  const { settings, updateSettings } = useApp();
  
  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    { 
      itemName: "word",
      requireConfirmation: true,
      getConfirmMessage: (word) => 
        `Are you sure you want to block the word "${word}"? This will filter it from all web pages you visit.`
    }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>

      <ListManager
        items={settings.blockedWords}
        inputValue={wordManager.inputValue}
        onInputChange={wordManager.setInputValue}
        onAdd={() => wordManager.addItem(showConfirmation)}
        onRemove={wordManager.removeItem}
        onClear={() => wordManager.clearAll("Are you sure you want to remove all blocked words?")}
        placeholder="Enter word or phrase to block..."
        buttonText="Add Word"
        emptyText="No blocked words yet"
        title="Current Blocked Words"
        variant="default"
        maxHeight="max-h-96"
      />
    </div>
  );
};