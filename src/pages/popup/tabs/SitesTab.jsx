// src/pages/popup/tabs/SitesTab.jsx
import { useApp } from "../../../contexts/AppContext";
import { useToast } from "../../../components/ToastContainer";
import { ListManager } from "../../../components/ListManager";
import { BlockingNotice } from "../components/BlockingNotice";
import { transformSiteInput, validateSite } from "../../../utils/validators";

export const SitesTab = () => {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  return (
    <div className="space-y-4">
      <ListManager
        items={settings.blockedSites}
        onItemsChange={(sites) => updateSettings({ blockedSites: sites })}
        itemName="Site"
        itemNamePlural="Blocked Sites"
        placeholder="e.g., example.com"
        variant="compact"
        icon="🚫"
        showList={false}
        confirmAdd="You will be unable to access '{item}' until you unblock it. Continue?"
        transformItem={transformSiteInput}
        validateItem={validateSite}
        minLength={3}
        showToast={showToast}
      />

      <BlockingNotice type="sites" variant="warning" />
    </div>
  );
};