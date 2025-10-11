/**
 * Quick Block Current Component
 * 
 * Shows current site with quick block button.
 * Uses parent confirmation modal for consistency.
 * 
 * Features:
 * - Displays current URL/domain
 * - One-click blocking with confirmation
 * - Visual feedback
 * - Prominent placement
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onBlockSite - Called when block confirmed
 * @param {Function} props.showConfirmation - Show confirmation modal
 */

import { useState, useEffect } from 'react';
import Button from '../../../components/Button';

export const QuickBlockCurrent = ({ onBlockSite, showConfirmation }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentDomain, setCurrentDomain] = useState('');
  const [isChromePage, setIsChromePage] = useState(false);

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
        
        // Extract domain
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace(/^www\./, '');
          setCurrentDomain(domain);
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
      }
    });
  }, []);

  const handleBlockClick = () => {
    if (currentDomain) {
      showConfirmation({
        title: 'Block This Site?',
        message: `Are you sure you want to block ${currentDomain}? You will be immediately redirected and won't be able to access this site until you unblock it.`,
        confirmText: 'Yes, Block Site',
        cancelText: 'Cancel',
        confirmColor: 'red',
        onConfirm: () => onBlockSite(currentDomain)
      });
    }
  };

  // Don't show for chrome pages
  if (isChromePage || !currentDomain) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border-2 border-red-400/40 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🌐</span>
            <h3 className="text-sm font-bold uppercase tracking-wide">Current Site</h3>
          </div>
          <div className="bg-black/20 rounded-lg p-2 mb-3">
            <p className="text-xs font-mono truncate" title={currentDomain}>
              {currentDomain}
            </p>
          </div>
          <p className="text-xs opacity-80">
            Block this site with one click
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