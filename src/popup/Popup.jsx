import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { useListManager } from '../hooks/useListManager';
import { useFileOperations } from '../hooks/useFileOperations';
import { PopupHeader } from './components/PopupHeader';
import { StatusCard } from './components/StatusCard';
import { BlockedWordsSection } from './components/BlockedWordsSection';
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
    <div className="w-[360px] min-h-[500px] m-0 p-0 bg-gradient-to-br from-primary via-purple-600 to-secondary overflow-x-hidden">
      <div className="p-6 text-white">
        <PopupHeader onRefresh={() => window.location.reload()} />
        
        <StatusCard todayCount={stats.todayCount} />
        
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