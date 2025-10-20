// src/pages/popup/tabs/HomeTab.jsx
import { useToast } from "../../../components/ToastContainer";
import { useApp } from "../../../contexts/AppContext";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { StatusCard } from "../components/StatusCard";
import { QuickBlockCurrent } from "../components/QuickBlockCurrent";
import { SobrietyPopup } from "../../../components/Sobriety/SobrietyPopup";
import { 
  getBlockedPageUrl, 
  getRedirectUrlWithFallback 
} from "../../../utils/builders";
import { 
  transformSiteInput, 
  isFullUrl, 
  isDuplicate 
} from "../../../utils/validators";

export const HomeTab = ({ openSettings }) => {
  const { showToast } = useToast();
  const { settings, updateSettings, stats } = useApp();
  const confirmation = useConfirmation();

  const handleBlockCurrentSite = async (urlToBlock) => {
    const cleanUrl = transformSiteInput(urlToBlock);

    if (isDuplicate(cleanUrl, settings.blockedSites)) {
      showToast(`Already blocked: ${cleanUrl}`, "info");
      return;
    }

    await updateSettings({
      blockedSites: [...settings.blockedSites, cleanUrl],
    });

    showToast(
      `Blocked ${isFullUrl(cleanUrl) ? 'URL' : 'domain'}: ${cleanUrl}`, 
      "success"
    );

    // Calculate redirect URL based on settings
    const redirectUrl = settings.useCustomUrl
      ? getRedirectUrlWithFallback(settings.redirectUrl)
      : getBlockedPageUrl(cleanUrl);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url: redirectUrl });
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

      <SobrietyPopup showToast={showToast} />

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">{stats.filterCount}</div>
          <div className="text-xs opacity-70">Total Blocked</div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-center">
          <div className="text-2xl font-bold">
            {settings.blockedSites.length}
          </div>
          <div className="text-xs opacity-70">Sites Blocked</div>
        </div>
      </div>

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