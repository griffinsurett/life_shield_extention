/**
 * General Tab Component
 *
 * Main settings tab with core configuration options.
 * Simplified - blur mode and technical settings removed.
 *
 * @component
 */

import { useApp } from "../../contexts/AppContext";
import { Toggle } from "../../components/Toggle";

const GeneralTab = ({ showToast }) => {
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
        {/* Enable Filter Toggle */}
        <Toggle
          checked={settings.enableFilter}
          onChange={(val) => saveSettings({ enableFilter: val })}
          label="Enable Filter"
          description="Turn the content filter on or off globally"
        />

        {/* Show Alerts Toggle */}
        <Toggle
          checked={settings.showAlerts}
          onChange={(val) => saveSettings({ showAlerts: val })}
          label="Show Alerts"
          description="Display notifications and badge count when content is blocked"
          // ^^^ Updated description to mention badge
        />

        {/* Redirect URL Section */}
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
      </div>
    </div>
  );
};

export default GeneralTab;
