// src/pages/popup/tabs/WordsTab.jsx
/**
 * Words Tab Component (Popup)
 *
 * Quick add interface for blocked words.
 * Uses ProtectedListManager with hideList for add-only mode.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { ProtectedListManager } from "../../../components/ProtectedListManager";

export const WordsTab = ({ wordManager, showConfirmation }) => {
  const { settings } = useApp();

  // Memoized add handler
  const handleAdd = useCallback(() => {
    wordManager.addItem(showConfirmation);
  }, [wordManager, showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Block Words
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Quickly add words to your protected block list.
      </p>

      <ProtectedListManager
        items={settings.blockedWords}
        itemName="Word"
        itemNamePlural="Blocked Words"
        inputValue={wordManager.inputValue}
        onInputChange={wordManager.setInputValue}
        onAdd={handleAdd}
        onRemove={wordManager.removeItem}
        placeholder="Enter word or phrase to block..."
        variant="default"
        itemIcon="📝"
        hideList={true}
        showConfirmation={showConfirmation}
      />

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">Quick Block Mode</p>
            <p className="text-xs text-blue-800">
              This interface is designed for fast blocking. Your blocked words 
              are stored securely and working in the background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};