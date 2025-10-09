/**
 * Phrases Tab Component
 *
 * Tab for managing replacement phrases.
 * Now uses confirmation modal instead of window.confirm.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useListManager } from "../../../hooks/useListManager";
import ListManager from "../../../components/ListManager";
import { DEFAULT_SETTINGS } from "../../../utils/constants";

const PhrasesTab = ({ showToast, showConfirmation }) => {
  const { settings, updateSettings } = useApp();

  const phraseManager = useListManager(
    settings.replacementPhrases,
    (phrases) => updateSettings({ replacementPhrases: phrases }),
    {
      itemName: "phrase",
      transform: (val) => val.trim(),
      duplicateCheck: true,
    }
  );

  /**
   * Reset phrases to default list with confirmation
   */
  const resetPhrases = useCallback(() => {
    showConfirmation({
      title: "Reset All Phrases?",
      message:
        "Are you sure you want to reset all replacement phrases to defaults? Your custom phrases will be lost.",
      confirmText: "Yes, Reset to Defaults",
      cancelText: "Cancel",
      confirmColor: "orange",
      onConfirm: async () => {
        await updateSettings({
          replacementPhrases: DEFAULT_SETTINGS.replacementPhrases,
        });
        showToast("Phrases reset to defaults", "success");
      },
    });
  }, [showConfirmation, updateSettings, showToast]);

  // Memoized custom item renderer for italic phrases
  const renderPhrase = useCallback(
    (phrase, index, onRemove) => (
      <div
        key={index}
        className="inline-flex items-center gap-2 bg-green-50 hover:bg-green-100 px-3 py-2 m-1 rounded-lg text-xs font-medium transition-all group"
      >
        <span className="italic">&quot;{phrase}&quot;</span>
        <button
          onClick={() => onRemove(index)}
          className="opacity-60 hover:opacity-100 hover:bg-red-500/30 rounded-full p-0.5 transition-all"
          title="Remove"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    ),
    []
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Replacement Phrases
      </h2>
      <p className="text-gray-600 mb-6">
        These healthy phrases replace blocked words when detected
      </p>

      <ListManager
        items={settings.replacementPhrases}
        inputValue={phraseManager.inputValue}
        onInputChange={phraseManager.setInputValue}
        onAdd={phraseManager.addItem}
        onRemove={phraseManager.removeItem}
        placeholder="Enter a healthy replacement phrase..."
        buttonText="Add Phrase"
        emptyText="No replacement phrases"
        title="Current Phrases"
        variant="success"
        renderItem={renderPhrase}
      />

      <div className="mt-6">
        <button
          onClick={resetPhrases}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default PhrasesTab;
