/**
 * Popup Component
 *
 * Main popup UI with tabbed interface.
 * Now with granular error boundaries around each tab.
 *
 * @component
 */

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useListManager } from '../../hooks/useListManager';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { SimpleErrorBoundary } from '../../components/ErrorBoundary';
import { PopupHeader } from './components/PopupHeader';
import { PopupTabs } from './components/PopupTabs';
import { HomeTab } from './tabs/HomeTab';
import { WordsTab } from './tabs/WordsTab';
import { SitesTab } from './tabs/SitesTab';
import { MoreTab } from './tabs/MoreTab';
import { PopupFooter } from './components/PopupFooter';

export const Popup = () => {
  const { settings, updateSettings } = useApp();

  const { exportToFile, importFromFile } = useFileOperations();
  const [previewPhrase, setPreviewPhrase] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  const confirmation = useConfirmation();

  const wordManager = useListManager(
    settings.blockedWords,
    (words) => updateSettings({ blockedWords: words }),
    {
      itemName: "word",
      requireConfirmation: true,
      getConfirmMessage: (word) =>
        `Are you sure you want to block the word "${word}"? This will filter it from all web pages you visit.`,
    }
  );

  const siteManager = useListManager(
    settings.blockedSites,
    (sites) => updateSettings({ blockedSites: sites }),
    {
      itemName: "site",
      transform: (val) =>
        val
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, ""),
      duplicateCheck: true,
      requireConfirmation: true,
      getConfirmMessage: (site) =>
        `Are you sure you want to block "${site}"? You will be redirected and unable to access this site until you unblock it.`,
    }
  );

  const refreshPreviewPhrase = useCallback(() => {
    if (settings.replacementPhrases.length > 0) {
      const phrase =
        settings.replacementPhrases[
          Math.floor(Math.random() * settings.replacementPhrases.length)
        ];
      setPreviewPhrase(phrase);
    }
  }, [settings.replacementPhrases]);

  useEffect(() => {
    refreshPreviewPhrase();
  }, [refreshPreviewPhrase]);

  const handleExport = useCallback(() => {
    exportToFile(settings.blockedWords, "wellness-filter-words.json", "words");
  }, [settings.blockedWords, exportToFile]);

  const handleImport = useCallback(async () => {
    await importFromFile(async (importedWords) => {
      const mergedWords = [
        ...new Set([...settings.blockedWords, ...importedWords]),
      ];
      await updateSettings({ blockedWords: mergedWords });
    }, "words");
  }, [settings.blockedWords, updateSettings, importFromFile]);

  const openSettings = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Render active tab with granular error boundaries
  const renderTabContent = useCallback(() => {
    const props = {
      wordManager,
      siteManager,
      previewPhrase,
      refreshPreviewPhrase,
      handleExport,
      handleImport,
      openSettings,
      showConfirmation: confirmation.showConfirmation,
    };

    switch (activeTab) {
      case "home":
        return (
          <SimpleErrorBoundary>
            <HomeTab {...props} />
          </SimpleErrorBoundary>
        );
      case "words":
        return (
          <SimpleErrorBoundary>
            <WordsTab {...props} />
          </SimpleErrorBoundary>
        );
      case "sites":
        return (
          <SimpleErrorBoundary>
            <SitesTab {...props} />
          </SimpleErrorBoundary>
        );
      case "more":
        return (
          <SimpleErrorBoundary>
            <MoreTab {...props} />
          </SimpleErrorBoundary>
        );
      default:
        return (
          <SimpleErrorBoundary>
            <HomeTab {...props} />
          </SimpleErrorBoundary>
        );
    }
  }, [
    activeTab,
    wordManager,
    siteManager,
    previewPhrase,
    refreshPreviewPhrase,
    handleExport,
    handleImport,
    openSettings,
    confirmation.showConfirmation,
  ]);

  return (
    <div className="w-[460px] h-[580px] m-0 p-0 bg-gradient-to-br from-primary via-purple-600 to-secondary overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col p-6 text-white overflow-hidden">
        <PopupHeader onSettingsClick={openSettings} />
        <PopupTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {renderTabContent()}
        </div>

        <PopupFooter />
      </div>

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
