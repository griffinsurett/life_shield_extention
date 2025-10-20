// src/pages/settings/tabs/PhrasesTab.jsx
import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useToast } from "../../../components/ToastContainer";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { ListManager } from "../../../components/ListManager";
import { DEFAULTS } from "../../../config";
import { transformPhraseInput, validatePhrase } from "../../../utils/validators";
import Button from '../../../components/Button';

const PhrasesTab = () => {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();
  const confirmation = useConfirmation();

  const resetPhrases = useCallback(() => {
    confirmation.showConfirmation({
      title: "Reset All Phrases?",
      message: "Are you sure you want to reset all replacement phrases to defaults? Your custom phrases will be lost.",
      confirmText: "Yes, Reset to Defaults",
      cancelText: "Cancel",
      confirmColor: "orange",
      onConfirm: async () => {
        await updateSettings({
          replacementPhrases: DEFAULTS.REPLACEMENT_PHRASES,
        });
        showToast("Phrases reset to defaults", "success");
      },
    });
  }, [confirmation, updateSettings, showToast]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Replacement Phrases
      </h2>
      <p className="text-gray-600 mb-6">
        Positive phrases that replace blocked words when filtered
      </p>

      <ListManager
        items={settings.replacementPhrases}
        onItemsChange={(phrases) => updateSettings({ replacementPhrases: phrases })}
        itemName="Phrase"
        itemNamePlural="Replacement Phrases"
        placeholder="Enter a positive replacement phrase..."
        variant="success"
        isProtected={false}
        confirmAdd={false}
        confirmRemove={false}
        maxItems={50}
        minLength={2}
        transformItem={transformPhraseInput}
        validateItem={validatePhrase}
        showToast={showToast}
      />

      <div className="mt-6 flex justify-end">
        <Button
          onClick={resetPhrases}
          className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          Reset to Default Phrases
        </Button>
      </div>

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.closeModal}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        confirmColor={confirmation.config.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
};

export default PhrasesTab;