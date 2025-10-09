/**
 * Sites Tab Component
 *
 * Full blocked sites management interface.
 * Now uses confirmation modal for clear all.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import ListManager from "../../../components/ListManager";

export const SitesTab = ({ siteManager, showConfirmation }) => {
  const { settings } = useApp();

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

      <ListManager
        items={settings.blockedSites}
        inputValue={siteManager.inputValue}
        onInputChange={siteManager.setInputValue}
        onAdd={handleAdd}
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
