/**
 * Popup Component
 * 
 * Main popup UI with tabbed interface.
 * Now includes confirmation modals for all blocking actions.
 * 
 * Tabs:
 * - Home: Status card and quick actions
 * - Words: Blocked words management
 * - Sites: Blocked sites management
 * - More: Replacement phrases, import/export, settings
 * 
 * Features:
 * - Compact tabbed design (460px wide, ~500px tall)
 * - Gradient purple background
 * - Real-time updates
 * - Toast notifications
 * - Confirmation modals for all blocks
 * 
 * @component
 */

import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useListManager } from '../hooks/useListManager';
import { useFileOperations } from '../hooks/useFileOperations';
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PopupHeader } from './components/PopupHeader';
import { PopupTabs } from './components/PopupTabs';
import { HomeTab } from './tabs/HomeTab';
import { WordsTab as PopupWordsTab } from './tabs/WordsTab';
import { SitesTab as PopupSitesTab } from './tabs/SitesTab';
import { MoreTab } from './tabs/MoreTab';
import { PopupFooter } from './components/PopupFooter';

export const Popup = () => {
  // Load settings and stats
  const { settings, updateSettings } = useSettings();
  const { stats } = useStats();
  const { exportToFile, importFromFile } = useFileOperations();
  const [previewPhrase, setPreviewPhrase] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  
  // Confirmation modal state
  const confirmation = useConfirmation();

  /**
   * List manager for blocked words with confirmation
   */
  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    { 
      itemName: 'word',
      requireConfirmation: true,
      getConfirmMessage: (word) => 
        `Are you sure you want to block the word "${word}"? This will filter it from all web pages you visit.`
    }
  );

  /**
   * List manager for blocked sites with confirmation
   */
  const siteManager = useListManager(
    settings.blockedSites,
    (sites) => updateSettings({ blockedSites: sites }),
    {
      itemName: 'site',
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

  /**
   * Select and display a random replacement phrase
   */
  const refreshPreviewPhrase = () => {
    if (settings.replacementPhrases.length > 0) {
      const phrase = settings.replacementPhrases[
        Math.floor(Math.random() * settings.replacementPhrases.length)
      ];
      setPreviewPhrase(phrase);
    }
  };

  // Initialize preview phrase
  useEffect(() => {
    refreshPreviewPhrase();
  }, [settings.replacementPhrases]);

  /**
   * Export blocked words to JSON file
   */
  const handleExport = () => {
    exportToFile(settings.blockedWords, 'wellness-filter-words.json', 'words');
  };

  /**
   * Import blocked words from JSON file
   */
  const handleImport = async () => {
    await importFromFile(async (importedWords) => {
      const mergedWords = [...new Set([...settings.blockedWords, ...importedWords])];
      await updateSettings({ blockedWords: mergedWords });
    }, 'words');
  };

  /**
   * Open full settings page
   */
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  /**
   * Render active tab content
   */
  const renderTabContent = () => {
    const props = {
      settings,
      updateSettings,
      stats,
      wordManager,
      siteManager,
      previewPhrase,
      refreshPreviewPhrase,
      handleExport,
      handleImport,
      openSettings,
      showConfirmation: confirmation.showConfirmation
    };

    switch (activeTab) {
      case 'home':
        return <HomeTab {...props} />;
      case 'words':
        return <PopupWordsTab {...props} />;
      case 'sites':
        return <PopupSitesTab {...props} />;
      case 'more':
        return <MoreTab {...props} />;
      default:
        return <HomeTab {...props} />;
    }
  };

  return (
    <div className="w-[460px] h-[580px] m-0 p-0 bg-gradient-to-br from-primary via-purple-600 to-secondary overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col p-6 text-white overflow-hidden">
        {/* Header */}
        <PopupHeader onSettingsClick={openSettings} />
        
        {/* Tab Navigation */}
        <PopupTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Tab Content - scrollable */}
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {renderTabContent()}
        </div>
        
        {/* Footer */}
        <PopupFooter />
      </div>

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.confirmConfig.title}
        message={confirmation.confirmConfig.message}
        confirmText={confirmation.confirmConfig.confirmText}
        cancelText={confirmation.confirmConfig.cancelText}
        confirmColor={confirmation.confirmConfig.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
};