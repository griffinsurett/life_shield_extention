import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useListManager } from '../hooks/useListManager';
import { useFileOperations } from '../hooks/useFileOperations';
import { PopupHeader } from './components/PopupHeader';
import { StatusCard } from './components/StatusCard';
import { BlockedWordsSection } from './components/BlockedWordsSection';
import { BlockedSitesSection } from './components/BlockedSitesSection';
import { ReplacementPhrasesPreview } from './components/ReplacementPhrasesPreview';
import { QuickActions } from './components/QuickActions';
import { SettingsButton } from './components/SettingsButton';
import { PopupFooter } from './components/PopupFooter';

export const Popup = () => {
  const { settings, updateSettings } = useSettings();
  const { stats } = useStats();
  const { exportToFile, importFromFile } = useFileOperations();
  const [previewPhrase, setPreviewPhrase] = useState('');

  // Use the list manager hook for word management
  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    { itemName: 'word' }
  );

  // Use the list manager hook for site management
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
    }
  );

  // Random phrase preview
  const refreshPreviewPhrase = () => {
    if (settings.replacementPhrases.length > 0) {
      const phrase = settings.replacementPhrases[
        Math.floor(Math.random() * settings.replacementPhrases.length)
      ];
      setPreviewPhrase(phrase);
    }
  };

  useEffect(() => {
    refreshPreviewPhrase();
  }, [settings.replacementPhrases]);

  // Export words
  const handleExport = () => {
    exportToFile(settings.blockedWords, 'wellness-filter-words.json', 'words');
  };

  // Import words
  const handleImport = async () => {
    await importFromFile(async (importedWords) => {
      const mergedWords = [...new Set([...settings.blockedWords, ...importedWords])];
      await updateSettings({ blockedWords: mergedWords });
    }, 'words');
  };

  // Open settings page
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-[460px] min-h-[500px] m-0 p-0 bg-gradient-to-br from-primary via-purple-600 to-secondary overflow-x-hidden">
      <div className="p-6 text-white">
        <PopupHeader onSettingsClick={openSettings} />
        
        <StatusCard todayCount={stats.todayCount} />
        
        <BlockedSitesSection
          sites={settings.blockedSites}
          newSite={siteManager.inputValue}
          onNewSiteChange={siteManager.setInputValue}
          onAddSite={siteManager.addItem}
          onRemoveSite={siteManager.removeItem}
        />

        <BlockedWordsSection
          words={settings.blockedWords}
          newWord={wordManager.inputValue}
          onNewWordChange={wordManager.setInputValue}
          onAddWord={wordManager.addItem}
          onRemoveWord={wordManager.removeItem}
        />
        
        <ReplacementPhrasesPreview
          phrase={previewPhrase}
          onRefresh={refreshPreviewPhrase}
        />
        
        <QuickActions
          onExport={handleExport}
          onImport={handleImport}
        />
        
        <SettingsButton onClick={openSettings} />
        
        <PopupFooter />
      </div>
    </div>
  );
};