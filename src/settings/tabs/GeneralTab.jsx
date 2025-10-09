/**
 * General Tab Component
 *
 * Main settings tab with core configuration options.
 * Simplified - blur mode and technical settings removed.
 *
 * @component
 */

import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { Toggle } from "../../components/Toggle";

const GeneralTab = ({ showToast }) => {
  const { settings, updateSettings } = useApp();
  const [customMessage, setCustomMessage] = useState(settings.customMessage || '');
  const [redirectUrl, setRedirectUrl] = useState(settings.redirectUrl || '');

  const saveSettings = async (updates) => {
    await updateSettings(updates);
    showToast("Settings saved!", "success");
  };

  const handleCustomMessageChange = (e) => {
    setCustomMessage(e.target.value);
  };

  const handleCustomMessageBlur = () => {
    saveSettings({ customMessage });
  };

  const handleRedirectUrlChange = (e) => {
    setRedirectUrl(e.target.value);
  };

  const handleRedirectUrlBlur = () => {
    saveSettings({ redirectUrl });
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
        />

        {/* Blocking Behavior Section */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Blocking Behavior
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Choose what happens when blocked content is detected
          </p>

          {/* Custom URL Toggle */}
          <div className="mb-6">
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">Custom URL</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Redirect to a custom website when content is blocked
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.useCustomUrl}
                      onChange={(e) => saveSettings({ useCustomUrl: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {settings.useCustomUrl && (
                  <input
                    type="url"
                    value={redirectUrl}
                    onChange={handleRedirectUrlChange}
                    onBlur={handleRedirectUrlBlur}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Custom Message Toggle */}
          <div>
            <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">Custom Message</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Show a custom message on the blocked page
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!settings.useCustomUrl}
                      onChange={(e) => saveSettings({ useCustomUrl: !e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {!settings.useCustomUrl && (
                  <textarea
                    value={customMessage}
                    onChange={handleCustomMessageChange}
                    onBlur={handleCustomMessageBlur}
                    placeholder="Enter a custom message to display..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;