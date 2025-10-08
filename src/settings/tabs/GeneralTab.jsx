/**
 * General Tab Component
 * 
 * Main settings tab with core configuration options.
 * Now uses AppContext instead of props.
 * 
 * @component
 */

import { useApp } from "../../contexts/AppContext";
import { Toggle } from "../../components/Toggle";

export const GeneralTab = ({ showToast }) => {
  const { settings, updateSettings } = useApp();

  const saveSettings = async (updates) => {
    await updateSettings(updates);
    showToast("Settings saved!", "success");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        General Settings
      </h2>
      
      <div className="space-y-6">
        <Toggle
          checked={settings.enableFilter}
          onChange={(val) => saveSettings({ enableFilter: val })}
          label="Enable Filter"
          description="Turn the content filter on or off globally"
        />
        
        <Toggle
          checked={settings.debugMode}
          onChange={(val) => saveSettings({ debugMode: val })}
          label="Debug Mode"
          description="Show console logs for debugging (dev only)"
        />
        
        <Toggle
          checked={settings.showAlerts}
          onChange={(val) => saveSettings({ showAlerts: val })}
          label="Show Alerts"
          description="Display notifications when content is blocked"
        />

        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">Redirect URL</h3>
          <p className="text-sm text-gray-600 mb-4">
            Where to redirect when blocked content is detected in URLs
          </p>
          <input
            type="url"
            value={settings.redirectUrl}
            onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
            onBlur={() => showToast("Redirect URL saved", "success")}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">Content Display</h3>
          <p className="text-sm text-gray-600 mb-4">
            How to handle blocked content visually
          </p>
          
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="display-mode"
                checked={!settings.blurInsteadOfHide}
                onChange={() => saveSettings({ blurInsteadOfHide: false })}
                className="sr-only peer"
              />
              <div className="p-4 border-2 border-gray-300 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                <div className="font-medium text-gray-800">Hide</div>
                <div className="text-sm text-gray-600 mt-1">
                  Completely remove blocked content
                </div>
              </div>
            </label>
            
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="display-mode"
                checked={settings.blurInsteadOfHide}
                onChange={() => saveSettings({ blurInsteadOfHide: true })}
                className="sr-only peer"
              />
              <div className="p-4 border-2 border-gray-300 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                <div className="font-medium text-gray-800">Blur</div>
                <div className="text-sm text-gray-600 mt-1">
                  Blur blocked content instead
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};