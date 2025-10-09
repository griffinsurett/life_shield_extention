/**
 * Words Tab Component
 *
 * Tab for managing blocked words.
 * Now uses confirmation modal for clear all.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useListManager } from "../../../hooks/useListManager";
import ListManager from "../../../components/ListManager";

const WordsTab = ({ showConfirmation }) => {
  const { settings, updateSettings } = useApp();

  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    {
      itemName: "word",
      requireConfirmation: true,
      getConfirmMessage: (word) =>
        `Are you sure you want to block the word "${word}"? This will filter it from all web pages you visit.`,
    }
  );

  // Memoized clear all handler
  const handleClearAll = useCallback(() => {
    wordManager.clearAll(
      showConfirmation,
      "Are you sure you want to remove all blocked words? This action cannot be undone."
    );
  }, [wordManager, showConfirmation]);

  // Memoized add handler
  const handleAdd = useCallback(() => {
    wordManager.addItem(showConfirmation);
  }, [wordManager, showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>

      <ListManager
        items={settings.blockedWords}
        inputValue={wordManager.inputValue}
        onInputChange={wordManager.setInputValue}
        onAdd={handleAdd}
        onRemove={wordManager.removeItem}
        onClear={handleClearAll}
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

export default WordsTab;
