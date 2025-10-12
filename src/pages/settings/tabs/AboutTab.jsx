// src/pages/settings/tabs/AboutTab.jsx
import { useCallback } from "react";
import { useApp } from "../../../contexts/AppContext";
import { useConfirmation } from "../../../hooks/useConfirmation";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import Button from "../../../components/Button";
import { BRAND, DEFAULTS } from "../../../config";

const AboutTab = ({ showToast }) => {
  const { updateSettings, stats } = useApp();
  const confirmation = useConfirmation();

  const resetAllSettings = useCallback(() => {
    confirmation.showConfirmation({
      title: "⚠️ Reset All Settings?",
      message:
        "This will reset ALL settings to defaults including blocked words, sites, and preferences. This action cannot be undone.",
      confirmText: "Yes, Reset Everything",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        await updateSettings(DEFAULTS);
        showToast("All settings reset to defaults", "success");
      },
    });
  }, [confirmation, updateSettings, showToast]);

  const exportSettings = useCallback(async () => {
    try {
      const { settings } = await chrome.storage.sync.get(["settings"]);
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `wellness-filter-backup-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast("Settings exported successfully", "success");
    } catch (error) {
      showToast("Failed to export settings", "error");
    }
  }, [showToast]);

  const importSettings = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const settings = JSON.parse(text);
        
        confirmation.showConfirmation({
          title: "Import Settings?",
          message: "This will replace all current settings with the imported ones.",
          confirmText: "Yes, Import",
          confirmColor: "orange",
          onConfirm: async () => {
            await updateSettings(settings);
            showToast("Settings imported successfully", "success");
          }
        });
      } catch (error) {
        showToast("Failed to import settings. Invalid file format.", "error");
      }
    };
    
    input.click();
  }, [confirmation, updateSettings, showToast]);

  return (
    <div className="space-y-6">
      {/* About Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-4xl">
            {BRAND.ICON}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{BRAND.NAME}</h2>
            <p className="text-gray-600">Version {BRAND.VERSION}</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            {BRAND.NAME} helps you maintain a healthier browsing experience by filtering
            unwanted content and blocking distracting websites. Take control of your
            digital wellness journey.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 my-6">
            <h3 className="font-semibold text-gray-800 mb-3">✨ Key Features</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Real-time content filtering across all websites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Customizable block lists for words and sites</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Privacy-focused with local-only data storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Positive replacement phrases for filtered content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Detailed statistics and usage tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Management Card */}
      {/* <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Data Management</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-2">Backup & Restore</h4>
            <p className="text-sm text-gray-600 mb-4">
              Export your settings to a file or import from a previous backup
            </p>
            <div className="flex gap-3">
              <Button
                onClick={exportSettings}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Export Settings
              </Button>
              <Button
                onClick={importSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Import Settings
              </Button>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">⚠️ Danger Zone</h4>
            <p className="text-sm text-red-800 mb-4">
              Reset all settings and data to factory defaults. This cannot be undone.
            </p>
            <Button
              onClick={resetAllSettings}
              className="w-full btn-base btn-md btn-danger font-semibold"
            >
              Reset All Settings
            </Button>
          </div>
        </div>
      </div> */}

      {/* Support Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Support & Feedback</h3>
        
        <div className="space-y-4">
          {/* <a
            href="https://github.com/yourusername/wellness-filter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🐙</span>
            <div>
              <div className="font-semibold text-gray-800">GitHub Repository</div>
              <div className="text-sm text-gray-600">View source code and contribute</div>
            </div>
          </a> */}
          
          <a
            href="mailto:support@wellnessfilter.com"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">📧</span>
            <div>
              <div className="font-semibold text-gray-800">Contact Support</div>
              <div className="text-sm text-gray-600">Get help or report issues</div>
            </div>
          </a>
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

export default AboutTab;