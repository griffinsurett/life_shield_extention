// src/pages/popup/components/QuickBlockCurrent.jsx
import { useState, useEffect } from 'react';
import Button from '../../../components/Button';

export const QuickBlockCurrent = ({ onBlockSite, showConfirmation }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [isChromePage, setIsChromePage] = useState(false);
  const [blockType, setBlockType] = useState('domain'); // 'domain' or 'url'

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = tabs[0].url;
        setCurrentUrl(url);
        
        // Check if it's a chrome:// or chrome-extension:// page
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
          setIsChromePage(true);
          return;
        }
        
        // Extract domain and path
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/^www\./, '');
          const fullPath = domain + urlObj.pathname + urlObj.search;
          
          setCurrentDomain(domain);
          setCurrentPath(fullPath.replace(/\/$/, '')); // Remove trailing slash
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
      }
    });
  }, []);

  const handleBlockClick = () => {
    const urlToBlock = blockType === 'domain' ? currentDomain : currentPath;
    
    if (urlToBlock) {
      showConfirmation({
        title: `Block This ${blockType === 'domain' ? 'Site' : 'URL'}?`,
        message: blockType === 'domain' 
          ? `Are you sure you want to block ${currentDomain}? You will be immediately redirected and won't be able to access this entire site until you unblock it.`
          : `Are you sure you want to block this specific URL? Only this exact page will be blocked, not the entire site.\n\n${currentPath}`,
        confirmText: `Yes, Block ${blockType === 'domain' ? 'Site' : 'URL'}`,
        cancelText: 'Cancel',
        confirmColor: 'red',
        onConfirm: () => onBlockSite(urlToBlock)
      });
    }
  };

  // Don't show for chrome pages
  if (isChromePage || !currentDomain) {
    return null;
  }

  const displayUrl = blockType === 'domain' ? currentDomain : currentPath;

  return (
    <div className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border-2 border-red-400/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌐</span>
        <h3 className="text-sm font-bold uppercase tracking-wide">
          {blockType === 'domain' ? 'CURRENT SITE' : 'CURRENT URL'}
        </h3>
      </div>

      {/* Toggle between Domain and URL */}
      <div className="flex gap-2 mb-3 bg-black/20 rounded-lg p-1">
        <Button
          onClick={() => setBlockType('domain')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
            blockType === 'domain'
              ? 'bg-white text-red-600'
              : 'text-white/70 hover:text-white'
          }`}
        >
          🌐 Domain
        </Button>
        <Button
          onClick={() => setBlockType('url')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
            blockType === 'url'
              ? 'bg-white text-red-600'
              : 'text-white/70 hover:text-white'
          }`}
        >
          📄 Specific URL
        </Button>
      </div>

      {/* Display Current URL/Domain */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="bg-black/20 rounded-lg p-3 mb-3">
            <p className="text-xs font-mono break-all" title={displayUrl}>
              {displayUrl}
            </p>
          </div>
          <p className="text-xs opacity-80">
            {blockType === 'domain' 
              ? '🌐 Block entire site and all pages'
              : '📄 Block only this specific page'
            }
          </p>
        </div>
        
        <Button
          onClick={handleBlockClick}
          className="flex-shrink-0 px-4 py-3 bg-white text-red-600 rounded-lg font-bold text-sm hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 flex flex-col items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-xs">Block</span>
        </Button>
      </div>
    </div>
  );
};