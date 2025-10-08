/**
 * Sites Tab Component
 * 
 * Tab for managing blocked sites.
 * Now significantly simplified using ListManager and AppContext.
 * 
 * @component
 */

import { useApp } from "../../contexts/AppContext";
import { useListManager } from "../../hooks/useListManager";
import ListManager from "../../components/ListManager";

export const SitesTab = ({ showConfirmation }) => {
  const { settings, updateSettings } = useApp();
  
  const siteManager = useListManager(
    settings.blockedSites,
    (sites) => updateSettings({ blockedSites: sites }),
    {
      itemName: "site",
      transform: (val) =>
        val
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, ''),
      duplicateCheck: true,
      requireConfirmation: true,
      getConfirmMessage: (site) =>
        `Are you sure you want to block "${site}"? You will be redirected and unable to access this site until you unblock it.`
    }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Blocked Sites</h2>
      <p className="text-gray-600 mb-6">Sites that will be blocked and redirect to your chosen URL</p>

      <ListManager
        items={settings.blockedSites}
        inputValue={siteManager.inputValue}
        onInputChange={siteManager.setInputValue}
        onAdd={() => siteManager.addItem(showConfirmation)}
        onRemove={siteManager.removeItem}
        placeholder="Enter domain (e.g., example.com)..."
        buttonText="Block Site"
        emptyText="No blocked sites"
        title="Blocked Sites"
        variant="danger"
        itemIcon="🚫"
      />
    </div>
  );
};