/**
 * Sites Tab Component
 * 
 * Tab for managing blocked sites.
 * Sites are completely blocked at the network level.
 * 
 * Features:
 * - Add new sites with domain cleaning
 * - List of current blocked sites
 * - Remove individual sites
 * - Empty state message
 * - Orange/red theme to indicate blocking
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.settings - Current settings
 * @param {Function} props.updateSettings - Update settings function
 */

import { useListManager } from "../../hooks/useListManager";
import { AddItemInput } from "../../components/AddItemInput";
import { ListItem } from "../../components/ListItem";
import { SectionHeader } from "../../components/SectionHeader";

export const SitesTab = ({ settings, updateSettings }) => {
  /**
   * Use list manager hook for site operations
   * Transforms input to clean domain format:
   * - Removes https:// and http://
   * - Removes trailing slash
   * - Converts to lowercase
   */
  const siteManager = useListManager(
    settings.blockedSites,
    (sites) => updateSettings({ blockedSites: sites }),
    {
      itemName: "site",
      transform: (val) =>
        val
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '') // Remove protocol
          .replace(/\/$/, ''), // Remove trailing slash
      duplicateCheck: true,
    }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Blocked Sites</h2>
      <p className="text-gray-600 mb-6">Sites that will be blocked and redirect to your chosen URL</p>

      {/* Add site section with red/orange theme */}
      <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
        <AddItemInput
          value={siteManager.inputValue}
          onChange={siteManager.setInputValue}
          onAdd={siteManager.addItem}
          placeholder="Enter domain (e.g., example.com)..."
          buttonText="Block Site"
          buttonColor="orange"
        />
      </div>

      {/* Sites list */}
      <div>
        <SectionHeader
          title="Blocked Sites"
          count={settings.blockedSites.length}
          countColor="orange"
        />

        {/* Scrollable list */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {settings.blockedSites.length === 0 ? (
            // Empty state
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No blocked sites</p>
              <p className="text-sm mt-1">Add sites to block them</p>
            </div>
          ) : (
            // Site items
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