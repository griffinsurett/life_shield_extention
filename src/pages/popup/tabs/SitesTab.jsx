// src/pages/popup/tabs/SitesTab.jsx
/**
 * Sites Tab Component (Popup)
 *
 * Quick add interface for blocked sites.
 * Uses ProtectedListManager with hideList for add-only mode.
 *
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { ProtectedListManager } from "../../../components/ProtectedListManager";

export const SitesTab = ({ siteManager, showConfirmation }) => {
  const { settings } = useApp();

  // Memoized add handler
  const handleAdd = useCallback(() => {
    siteManager.addItem(showConfirmation);
  }, [siteManager, showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Block Site
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Quickly add websites to your protected block list.
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
        hideList={true}
        showConfirmation={showConfirmation}
      />

      {/* Warning Card */}
      <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm text-orange-900 font-medium mb-1">Instant Protection</p>
            <p className="text-xs text-orange-800">
              Sites are blocked immediately after adding. Your block list is 
              working in the background to protect your wellness journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};