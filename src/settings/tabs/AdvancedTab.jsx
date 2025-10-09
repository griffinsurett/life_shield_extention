/**
 * Advanced Tab Component
 * 
 * Advanced settings for power users.
 * Now uses confirmation modal instead of window.confirm.
 * 
 * @component
 */

import { useCallback } from "react";
import { useApp } from "../../contexts/AppContext";

const AdvancedTab = ({ showConfirmation }) => {
  const { settings, updateSettings } = useApp();

  /**
   * Reset all settings and storage with strong confirmation
   */
  const resetAllSettings = useCallback(() => {
    showConfirmation({
      title: "⚠️ Reset Everything?",
      message: "This will permanently delete ALL settings, blocked words, blocked sites, replacement phrases, and statistics. Your extension will be restored to its original state. This action CANNOT be undone!",
      confirmText: "Yes, Delete Everything",
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        await chrome.storage.sync.clear();
        await chrome.storage.local.clear();
        window.location.reload();
      }
    });
  }, [showConfirmation]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Advanced Settings</h2>

      <div className="space-y-6">
        {/* Performance tuning section */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-4">Performance Tuning</h3>
          
          <div className="space-y-4">
            {/* Scan interval slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Interval: {settings.scanInterval}ms
              </label>
              <input 
                type="range" 
                min="500" 
                max="5000" 
                step="500" 
                value={settings.scanInterval}
                onChange={(e) => updateSettings({ scanInterval: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-gray-500 mt-1">How often to scan for new content (lower = more aggressive)</p>
            </div>

            {/* Mutation debounce slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mutation Debounce: {settings.mutationDebounce}ms
              </label>
              <input 
                type="range" 
                min="50" 
                max="500" 
                step="50" 
                value={settings.mutationDebounce}
                onChange={(e) => updateSettings({ mutationDebounce: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Delay before processing DOM changes</p>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200">
          <h3 className="font-semibold text-red-800 mb-4">⚠️ Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">These actions cannot be undone</p>
          
          {/* Reset all button */}
          <button 
            onClick={resetAllSettings}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Reset All Settings to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTab;