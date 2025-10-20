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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Sites Management
      </h2>
      <p className="text-gray-600 mb-6">
        Websites that will be blocked and redirect to your chosen URL
      </p>

      <ListManager
        items={settings.blockedSites}
        onItemsChange={(sites) => updateSettings({ blockedSites: sites })}
        itemName="Site"
        itemNamePlural="Blocked Sites"
        placeholder="Enter domain (e.g., example.com)..."
        variant="danger"
        isProtected={true}
        confirmAdd="You will be unable to access '{item}' until you unblock it. Continue?"
        confirmRemove="Remove '{item}' from blocked sites?"
        transformItem={transformSiteInput}
        validateItem={validateSite}
        minLength={3}
        showToast={showToast}
      />
    </div>
  );
};

export default SitesTab;