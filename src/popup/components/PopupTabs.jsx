/**
 * Popup Tabs Component
 * 
 * Tab navigation for the popup.
 * 
 * Features:
 * - 4 tabs: Home, Words, Sites, More
 * - Icons for each tab
 * - Active state highlighting
 * - Compact design
 * 
 * @component
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Called when tab is clicked
 */

export const PopupTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'words', label: 'Words', icon: '📝' },
    { id: 'sites', label: 'Sites', icon: '🚫' },
    { id: 'more', label: 'More', icon: '⋯' }
  ];

  return (
    <div className="flex gap-2 bg-white/10 rounded-xl p-2 backdrop-blur-sm border border-white/20">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === tab.id
              ? 'bg-white text-primary shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};