/**
 * Home Tab Component
 * 
 * Main dashboard showing status and quick add functionality.
 * All blocking actions now require confirmation.
 * 
 * Features:
 * - Quick block current site with confirmation (most prominent)
 * - Status card with today's count
 * - Quick add for words (with confirmation)
 * - Quick add for sites (with confirmation)
 * - Compact design
 * 
 * @component
 */

import { StatusCard } from '../components/StatusCard';
import { QuickBlockCurrent } from '../components/QuickBlockCurrent';
import { useToast } from '../../components/ToastContainer';

export const HomeTab = ({ 
  settings, 
  updateSettings, 
  stats, 
  wordManager, 
  siteManager,
  showConfirmation 
}) => {
  const { showToast } = useToast();

  /**
   * Handle blocking current site
   * Shows confirmation before blocking
   */
  const handleBlockCurrentSite = async (domain) => {
    // Clean the domain
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    // Check if already blocked
    if (settings.blockedSites.includes(cleanDomain)) {
      showToast(`${cleanDomain} is already blocked`, 'info');
      return;
    }
    
    // Add to blocked sites
    await updateSettings({ 
      blockedSites: [...settings.blockedSites, cleanDomain] 
    });
    
    showToast(`Blocked ${cleanDomain}`, 'success');
    
    // Close current tab and redirect
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { 
          url: settings.redirectUrl || 'https://griffinswebservices.com' 
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Block Current Site - Most Prominent */}
      <QuickBlockCurrent 
        onBlockSite={handleBlockCurrentSite}
        showConfirmation={showConfirmation}
      />
      
      {/* Status Card */}
      <StatusCard todayCount={stats.todayCount} />
      
      {/* Quick Add Word */}
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Add Word
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={wordManager.inputValue}
            onChange={(e) => wordManager.setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && wordManager.addItem(showConfirmation)}
            placeholder="Type word to block..."
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button 
            onClick={() => wordManager.addItem(showConfirmation)}
            className="px-4 py-2 bg-white text-primary rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Quick Add Site */}
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Block Site
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={siteManager.inputValue}
            onChange={(e) => siteManager.setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && siteManager.addItem(showConfirmation)}
            placeholder="e.g., example.com"
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button 
            onClick={() => siteManager.addItem(showConfirmation)}
            className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
          >
            Block
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">{stats.filterCount}</div>
          <div className="text-xs opacity-70">Total Blocked</div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">
            {settings.blockedWords.length + settings.blockedSites.length}
          </div>
          <div className="text-xs opacity-70">Words + Sites</div>
        </div>
      </div>
    </div>
  );
};