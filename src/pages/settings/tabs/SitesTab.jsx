// src/pages/settings/tabs/SitesTab.jsx
/**
 * Sites Tab Component (Settings)
 *
 * Tab for managing blocked sites with vulnerability protection.
 * Now uses ProtectedListManager for consistency.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useListManager } from "../../../hooks/useListManager";
import { ProtectedListManager } from "../../../components/ProtectedListManager";

const SitesTab = ({ showConfirmation }) => {
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
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, ""),
      duplicateCheck: true,
      requireConfirmation: true,
      getConfirmMessage: (site) =>
        `Are you sure you want to block "${site}"? You will be redirected and unable to access this site until you unblock it.`,
    }
  );

  // Memoized add handler
  const handleAdd = useCallback(() => {
    siteManager.addItem(showConfirmation);
  }, [siteManager, showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Blocked Sites</h2>
      <p className="text-gray-600 mb-6">
        Sites that will be blocked and redirect to your chosen URL
      </p>

      <ProtectedListManager
        items={settings.blockedSites}
        itemName="Site"
        itemNamePlural="Blocked Sites"
        inputValue={siteManager.inputValue}
        onInputChange={siteManager.setInputValue}
        onAdd={handleAdd}
        onRemove={siteManager.removeItem}
        placeholder="Enter domain (e.g., example.com)..."
        variant="danger"
        itemIcon="🚫"
        showConfirmation={showConfirmation}
      />
    </div>
  );
};

export default SitesTab;