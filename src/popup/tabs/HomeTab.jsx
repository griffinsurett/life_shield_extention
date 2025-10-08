/**
 * Home Tab Component
 * 
 * Main dashboard showing status and quick add functionality.
 * Now uses AppContext for cleaner code.
 * 
 * @component
 */

import { StatusCard } from '../components/StatusCard';
import { QuickBlockCurrent } from '../components/QuickBlockCurrent';
import { useToast } from '../../components/ToastContainer';
import { useApp } from '../../contexts/AppContext';

export const HomeTab = ({ 
  wordManager, 
  siteManager,
  showConfirmation 
}) => {
  const { showToast } = useToast();
  const { settings, updateSettings, stats } = useApp();

  /**
   * Handle blocking current site
   */
  const handleBlockCurrentSite = async (domain) => {
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    if (settings.blockedSites.includes(cleanDomain)) {
      showToast(`${cleanDomain} is already blocked`, 'info');
      return;
    }
    
    await updateSettings({ 
      blockedSites: [...settings.blockedSites, cleanDomain] 
    });
    
    showToast(`Blocked ${cleanDomain}`, 'success');
    
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
      <QuickBlockCurrent 
        onBlockSite={handleBlockCurrentSite}
        showConfirmation={showConfirmation}
      />
      
      <StatusCard todayCount={stats.todayCount} />
      
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