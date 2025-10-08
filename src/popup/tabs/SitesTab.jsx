/**
 * Sites Tab Component
 * 
 * Full blocked sites management interface.
 * All add operations require confirmation.
 * 
 * Features:
 * - List of all blocked sites
 * - Add new sites (with confirmation)
 * - Remove sites
 * - Site count
 * 
 * @component
 */

import { useListManager } from "../../hooks/useListManager";
import { AddItemInput } from "../../components/AddItemInput";
import { ListItem } from "../../components/ListItem";
import { SectionHeader } from "../../components/SectionHeader";

export const SitesTab = ({ settings, updateSettings, showConfirmation }) => {
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

      <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
        <AddItemInput
          value={siteManager.inputValue}
          onChange={siteManager.setInputValue}
          onAdd={() => siteManager.addItem(showConfirmation)}
          placeholder="Enter domain (e.g., example.com)..."
          buttonText="Block Site"
          buttonColor="orange"
        />
      </div>

      <div>
        <SectionHeader
          title="Blocked Sites"
          count={settings.blockedSites.length}
          countColor="orange"
        />

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {settings.blockedSites.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No blocked sites</p>
              <p className="text-sm mt-1">Add sites to block them</p>
            </div>
          ) : (
            settings.blockedSites.map((site, index) => (
              <ListItem
                key={index}
                onRemove={() => siteManager.removeItem(index)}
                bgColor="orange"
              >
                {site}
              </ListItem>
            ))
          )}
        </div>
      </div>
    </div>
  );
};