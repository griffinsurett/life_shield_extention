// src/pages/popup/tabs/HomeTab.jsx
import { useState } from "react";
import { useToast } from "../../../components/ToastContainer";
import { useApp } from "../../../contexts/AppContext";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { StatusCard } from "../components/StatusCard";
import { QuickBlockCurrent } from "../components/QuickBlockCurrent";
import { getRedirectUrlWithFallback } from "../../../utils/builders";
import Input from "../../../components/Inputs/Input";
import Button from "../../../components/Button";

export const HomeTab = ({ openSettings }) => {
  const { showToast } = useToast();
  const { settings, updateSettings, stats } = useApp();
  const confirmation = useConfirmation();
  const [wordInput, setWordInput] = useState("");
  const [siteInput, setSiteInput] = useState("");

  const handleBlockCurrentSite = async (domain) => {
    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    if (settings.blockedSites.includes(cleanDomain)) {
      showToast(`${cleanDomain} is already blocked`, "info");
      return;
    }

    await updateSettings({
      blockedSites: [...settings.blockedSites, cleanDomain],
    });

    showToast(`Blocked ${cleanDomain}`, "success");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, {
          url: getRedirectUrlWithFallback(settings.redirectUrl),
        });
      }
    });
  };

  const handleAddWord = () => {
    const word = wordInput.trim().toLowerCase();
    
    if (!word) {
      showToast("Please enter a word", "error");
      return;
    }

    if (settings.blockedWords.includes(word)) {
      showToast("Word already blocked", "error");
      return;
    }

    confirmation.showConfirmation({
      title: "Block Word?",
      message: `Are you sure you want to block "${word}"? This will filter it from all web pages.`,
      confirmText: "Yes, Block Word",
      confirmColor: "primary",
      onConfirm: async () => {
        await updateSettings({
          blockedWords: [...settings.blockedWords, word]
        });
        setWordInput("");
        showToast(`Blocked "${word}"`, "success");
      }
    });
  };

  const handleAddSite = () => {
    const site = siteInput.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    
    if (!site) {
      showToast("Please enter a site", "error");
      return;
    }

    if (!site.includes('.')) {
      showToast("Please enter a valid domain", "error");
      return;
    }

    if (settings.blockedSites.includes(site)) {
      showToast("Site already blocked", "error");
      return;
    }

    confirmation.showConfirmation({
      title: "Block Site?",
      message: `Are you sure you want to block "${site}"? You will be redirected and unable to access this site until you unblock it.`,
      confirmText: "Yes, Block Site",
      confirmColor: "red",
      onConfirm: async () => {
        await updateSettings({
          blockedSites: [...settings.blockedSites, site]
        });
        setSiteInput("");
        showToast(`Blocked "${site}"`, "success");
      }
    });
  };

  return (
    <div className="space-y-4">
      <QuickBlockCurrent
        onBlockSite={handleBlockCurrentSite}
        showConfirmation={confirmation.showConfirmation}
      />

      <StatusCard todayCount={stats.todayCount} />

      {/* Quick Block Words */}
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Block Words
        </h3>
        <div className="flex gap-2">
          <Input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddWord()}
            placeholder="Type word to block..."
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm"
          />
          <Button
            onClick={handleAddWord}
            className="px-4 py-2 bg-white text-primary rounded-lg font-semibold text-sm"
          >
            Block
          </Button>
        </div>
      </div>

      {/* Quick Block Site */}
      <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90 mb-3">
          Quick Block Site
        </h3>
        <div className="flex gap-2">
          <Input
            type="text"
            value={siteInput}
            onChange={(e) => setSiteInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddSite()}
            placeholder="e.g., example.com"
            className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-sm"
          />
          <Button
            onClick={handleAddSite}
            className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-sm"
          >
            Block
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.closeModal}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        confirmColor={confirmation.config.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
};