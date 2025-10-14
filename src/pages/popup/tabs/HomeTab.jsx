// src/pages/popup/tabs/HomeTab.jsx
import { useState } from "react";
import { useToast } from "../../../components/ToastContainer";
import { useApp } from "../../../contexts/AppContext";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { StatusCard } from "../components/StatusCard";
import { QuickBlockCurrent } from "../components/QuickBlockCurrent";
import { SobrietyPopup } from "../../../components/Sobriety/SobrietyPopup";
import { getRedirectUrlWithFallback } from "../../../utils/builders";
import Input from "../../../components/Inputs/Input";
import Button from "../../../components/Button";

export const HomeTab = ({ openSettings }) => {
  const { showToast } = useToast();
  const { settings, updateSettings, stats } = useApp();
  const confirmation = useConfirmation();

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

  return (
    <div className="space-y-4">
      <QuickBlockCurrent
        onBlockSite={handleBlockCurrentSite}
        showConfirmation={confirmation.showConfirmation}
      />

      <StatusCard todayCount={stats.todayCount} />

      {/* Sobriety Counter */}
      <SobrietyPopup showToast={showToast} />

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
