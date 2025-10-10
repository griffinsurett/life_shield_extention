// src/pages/settings/tabs/WordsTab.jsx
/**
 * Words Tab Component (Settings)
 *
 * Tab for managing blocked words with vulnerability protection.
 * Now uses ProtectedListManager for consistency.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useListManager } from "../../../hooks/useListManager";
import { ProtectedListManager } from "../../../components/ProtectedListManager";

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

  // Memoized add handler
  const handleAdd = useCallback(() => {
    wordManager.addItem(showConfirmation);
  }, [wordManager, showConfirmation]);

  // Memoized clear all handler
  const handleClearAll = useCallback(() => {
    wordManager.clearAll(
      showConfirmation,
      "Are you sure you want to remove all blocked words? This action cannot be undone."
    );
  }, [wordManager, showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>

      <ProtectedListManager
        items={settings.blockedWords}
        itemName="Word"
        itemNamePlural="Blocked Words"
        inputValue={wordManager.inputValue}
        onInputChange={wordManager.setInputValue}
        onAdd={handleAdd}
        onRemove={wordManager.removeItem}
        onClear={handleClearAll}
        placeholder="Enter word or phrase to block..."
        variant="default"
        itemIcon="📝"
        showConfirmation={showConfirmation}
      />
    </div>
  );
};

export default WordsTab;