// src/pages/popup/tabs/WordsTab.jsx
import { useApp } from "../../../contexts/AppContext";
import { useToast } from "../../../components/ToastContainer";
import { ListManager } from "../../../components/ListManager";
import { BlockingNotice } from "../components/BlockingNotice";
import { transformWordInput } from "../../../utils/validators";

export const WordsTab = () => {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  return (
    <div className="space-y-4">
      <ListManager
        items={settings.blockedWords}
        onItemsChange={(words) => updateSettings({ blockedWords: words })}
        itemName="Word"
        itemNamePlural="Blocked Words"
        placeholder="Enter word or phrase to block..."
        variant="compact"
        icon="📝"
        showList={false}
        isProtected={true}
        confirmAdd="This will filter '{item}' from all web pages. Continue?"
        transformItem={transformWordInput}
        minLength={1}
        showToast={showToast}
      />

      <BlockingNotice type="words" variant="warning" />
    </div>
  );
};