// src/pages/settings/tabs/WordsTab.jsx
import { useApp } from "../../../contexts/AppContext";
import { useToast } from "../../../components/ToastContainer";
import { ListManager } from "../../../components/ListManager";
import { transformWordInput } from "../../../utils/validators";

const WordsTab = () => {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>
      <p className="text-gray-600 mb-6">
        Words and phrases that will be filtered from web pages
      </p>

      <ListManager
        items={settings.blockedWords}
        onItemsChange={(words) => updateSettings({ blockedWords: words })}
        itemName="Word"
        itemNamePlural="Blocked Words"
        placeholder="Enter word or phrase to block..."
        variant="danger"
        isProtected={true}
        confirmAdd="This will filter '{item}' from all web pages. Continue?"
        confirmRemove="Remove '{item}' from blocked sites?"
        transformItem={transformWordInput}
        minLength={1}
        showToast={showToast}
      />
    </div>
  );
};

export default WordsTab;