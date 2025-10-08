/**
 * Popup Component
 * 
 * Main popup UI that appears when clicking the extension icon.
 * Displays:
 * - Today's block count
 * - Quick access to add blocked words
 * - Quick access to add blocked sites
 * - Preview of replacement phrases
 * - Import/Export buttons
 * - Link to full settings
 * 
 * Features:
 * - Compact design (460px wide)
 * - Gradient purple background
 * - Real-time updates
 * - Toast notifications
 * - Quick actions for common tasks
 * 
 * @component
 */

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
  // Load settings and stats
  const { settings, updateSettings } = useSettings();
  const { stats } = useStats();
  const { exportToFile, importFromFile } = useFileOperations();
  const [previewPhrase, setPreviewPhrase] = useState('');

  /**
   * List manager for blocked words
   * Handles adding/removing words with validation
   */
  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    { itemName: 'word' }
  );

  /**
   * List manager for blocked sites
   * Transforms input to clean domain format
   */
  const siteManager = useListManager(
    settings.blockedSites,
    (sites) => updateSettings({ blockedSites: sites }),
    {
      itemName: 'site',
      // Transform: remove protocol and trailing slash
      transform: (val) =>
        val
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, ''),
      duplicateCheck: true,
    }
  );

  /**
   * Select and display a random replacement phrase
   * Called on mount and when user clicks refresh
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
   * Merges with existing words (no duplicates)
   */
  const handleImport = async () => {
    await importFromFile(async (importedWords) => {
      // Merge and deduplicate
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

  return (
    <div className="w-[460px] min-h-[500px] m-0 p-0 bg-gradient-to-br from-primary via-purple-600 to-secondary overflow-x-hidden">
      <div className="p-6 text-white">
        {/* Header with settings button */}
        <PopupHeader onSettingsClick={openSettings} />
        
        {/* Status card showing today's count */}
        <StatusCard todayCount={stats.todayCount} />
        
        {/* Blocked sites section (shown first for priority) */}
        <BlockedSitesSection
          sites={settings.blockedSites}
          newSite={siteManager.inputValue}
          onNewSiteChange={siteManager.setInputValue}
          onAddSite={siteManager.addItem}
          onRemoveSite={siteManager.removeItem}
        />

        {/* Blocked words section */}
        <BlockedWordsSection
          words={settings.blockedWords}
          newWord={wordManager.inputValue}
          onNewWordChange={wordManager.setInputValue}
          onAddWord={wordManager.addItem}
          onRemoveWord={wordManager.removeItem}
        />
        
        {/* Preview of random replacement phrase */}
        <ReplacementPhrasesPreview
          phrase={previewPhrase}
          onRefresh={refreshPreviewPhrase}
        />
        
        {/* Import/Export buttons */}
        <QuickActions
          onExport={handleExport}
          onImport={handleImport}
        />
        
        {/* Link to full settings */}
        <SettingsButton onClick={openSettings} />
        
        {/* Footer with version */}
        <PopupFooter />
      </div>
    </div>
  );
};