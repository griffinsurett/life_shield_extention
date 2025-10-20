// src/pages/settings/tabs/SitesTab.jsx
import { useApp } from "../../../contexts/AppContext";
import { useToast } from "../../../components/ToastContainer";
import { ListManager } from "../../../components/ListManager";
import { transformSiteInput, validateSite } from "../../../utils/validators";

const SitesTab = () => {
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Blocked Sites</h2>
      <p className="text-gray-600 mb-6">
        Websites and domains that will be blocked entirely. Protected for your recovery.
      </p>

      <ListManager
        items={settings.blockedSites}
        onItemsChange={(sites) => updateSettings({ blockedSites: sites })}
        itemName="Site"
        itemNamePlural="Blocked Sites"
        placeholder="e.g., example.com"
        variant="danger"
        isProtected={true}
        confirmAdd="Block '{item}'? You will be unable to access this site. The URL will be hashed and hidden for your protection. Continue?"
        confirmRemove="Unblock this site? You will be able to access it again."
        transformItem={transformSiteInput}
        validateItem={validateSite}
        minLength={3}
        showToast={showToast}
      />
    </div>
  );
};

export default SitesTab;