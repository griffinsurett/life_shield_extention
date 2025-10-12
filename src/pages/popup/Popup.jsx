/**
 * Popup Component
 *
 * Main popup UI with checkbox-controlled modal.
 *
 * @component
 */

// src/pages/popup/Popup.jsx
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useFileOperations } from '../../hooks/useFileOperations';
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

  const renderTabContent = useCallback(() => {
    const props = {
      previewPhrase,
      refreshPreviewPhrase,
      handleExport,
      handleImport,
      openSettings,
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
            <WordsTab />
          </SimpleErrorBoundary>
        );
      case "sites":
        return (
          <SimpleErrorBoundary>
            <SitesTab />
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
    previewPhrase,
    refreshPreviewPhrase,
    handleExport,
    handleImport,
    openSettings,
  ]);

  return (
    <div className="w-[460px] h-[580px] m-0 p-0 btn-gradient overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col p-6 text-white overflow-hidden">
        <PopupHeader onSettingsClick={openSettings} />
        <PopupTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          {renderTabContent()}
        </div>

        <PopupFooter />
      </div>
    </div>
  );
};