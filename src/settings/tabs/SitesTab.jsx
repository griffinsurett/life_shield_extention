import { useListManager } from "../../hooks/useListManager";
import { AddItemInput } from "../../components/AddItemInput";
import { ListItem } from "../../components/ListItem";
import { SectionHeader } from "../../components/SectionHeader";

export const SitesTab = ({ settings, updateSettings }) => {
  const siteManager = useListManager(
    settings.excludedSites,
    (sites) => updateSettings({ excludedSites: sites }),
    {
      itemName: "site",
      transform: (val) =>
        val
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, ""),
      duplicateCheck: true,
    }
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Excluded Sites</h2>
      <p className="text-gray-600 mb-6">Sites where the filter will NOT run</p>

      <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
        <AddItemInput
          value={siteManager.inputValue}
          onChange={siteManager.setInputValue}
          onAdd={siteManager.addItem}
          placeholder="Enter domain (e.g., example.com)..."
          buttonText="Add Site"
          buttonColor="orange"
        />
      </div>

      <div>
        <SectionHeader
          title="Excluded Sites"
          count={settings.excludedSites.length}
          countColor="orange"
        />

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {settings.excludedSites.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="font-medium">No excluded sites</p>
              <p className="text-sm mt-1">Filter runs on all sites</p>
            </div>
          ) : (
            settings.excludedSites.map((site, index) => (
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
