/**
 * Sites Tab Component
 * 
 * Full blocked sites management interface.
 * Now significantly simplified using ListManager and AppContext.
 * 
 * @component
 */

import { useApp } from '../../contexts/AppContext';
import ListManager from '../../components/ListManager';

export const SitesTab = ({ siteManager, showConfirmation }) => {
  const { settings } = useApp();

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