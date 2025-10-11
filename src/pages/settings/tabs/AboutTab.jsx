// src/pages/settings/tabs/AboutTab.jsx
import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import Button from "../../../components/Button";
import { BRAND } from "../../../config";

const AboutTab = ({ showToast }) => {
  const { updateSettings } = useApp();
  const confirmation = useConfirmation('about-reset-modal');

  const handleResetAll = useCallback(async () => {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      showToast("All settings reset to default", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToast("Error resetting settings", "error");
      console.error("Reset error:", error);
    }
  }, [showToast]);

  const confirmReset = useCallback(() => {
    confirmation.showConfirmation({
      title: "⚠️ Reset Everything?",
      message: "This will permanently delete ALL settings, blocked words, blocked sites, replacement phrases, and statistics. Your extension will be restored to its original state. This action CANNOT be undone!",
      confirmText: "Yes, Delete Everything",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: handleResetAll
    });
  }, [confirmation, handleResetAll]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl">
            {BRAND.ICON}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {BRAND.NAME}
          </h2>
          <p className="text-gray-600">Version {BRAND.VERSION}</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">
              About This Extension
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {BRAND.NAME} helps you maintain healthy browsing habits by
              filtering unwanted content and replacing it with positive,
              wellness-focused alternatives. Take control of your digital
              experience and promote mental wellbeing.
            </p>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">
              Support & Resources
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• For support, visit our documentation</p>
              <p>• Report issues or suggest features</p>
              <p>• Made with {BRAND.HEART} for healthier browsing</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Danger Zone</h3>
              <p className="text-sm text-red-700">
                These actions are permanent and cannot be undone. Use with
                caution.
              </p>
            </div>
          </div>

          <Button
            onClick={confirmReset}
            className="w-full btn-base btn-md btn-danger font-semibold flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset All Settings to Default
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        modalId="about-reset-modal"
        title={confirmation.confirmConfig.title}
        message={confirmation.confirmConfig.message}
        confirmText={confirmation.confirmConfig.confirmText}
        cancelText={confirmation.confirmConfig.cancelText}
        confirmColor={confirmation.confirmConfig.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </>
  );
};

export default AboutTab;