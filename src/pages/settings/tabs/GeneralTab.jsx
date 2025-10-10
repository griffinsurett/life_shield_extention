// src/pages/settings/tabs/GeneralTab.jsx
/**
 * General Tab Component
 *
 * Main settings tab with core configuration options.
 * Simplified - blur mode and technical settings removed.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { useApp } from "../../../contexts/AppContext";
import { Toggle } from "../../../components/Toggle";

const GeneralTab = ({ showToast }) => {
  const { settings, updateSettings } = useApp();
  const [customMessage, setCustomMessage] = useState(
    settings.customMessage || ""
  );
  const [redirectUrl, setRedirectUrl] = useState(settings.redirectUrl || "");

  // Sync local state with settings when they change
  useEffect(() => {
    setCustomMessage(settings.customMessage || "");
    setRedirectUrl(settings.redirectUrl || "");
  }, [settings.customMessage, settings.redirectUrl]);

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

  // Handle Custom URL toggle
  const handleCustomUrlToggle = async (value) => {
    const updates = { useCustomUrl: value };
    
    // If enabling custom URL and redirectUrl is empty, set a default
    if (value && !redirectUrl.trim()) {
      const defaultRedirectUrl = "https://griffinswebservices.com";
      setRedirectUrl(defaultRedirectUrl);
      updates.redirectUrl = defaultRedirectUrl;
    }
    
    await saveSettings(updates);
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

          {/* Radio-style options */}
          <div className="space-y-4">
            {/* Option 1: Custom Blocked Page (default) */}
            <div 
              onClick={() => handleCustomUrlToggle(false)}
              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                !settings.useCustomUrl 
                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio button */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    !settings.useCustomUrl 
                      ? 'border-purple-600 bg-purple-600' 
                      : 'border-gray-300'
                  }`}>
                    {!settings.useCustomUrl && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Icon and content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Built-in Blocked Page
                      </h4>
                      <p className="text-sm text-gray-600">
                        Show a custom message on our blocked page
                      </p>
                    </div>
                  </div>

                  {/* Show textarea when this option is selected */}
                  {!settings.useCustomUrl && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={customMessage}
                        onChange={handleCustomMessageChange}
                        onBlur={handleCustomMessageBlur}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter a custom message to display..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
                      />
                      <p className="text-xs text-gray-600">
                        This message will appear on the built-in blocked content page
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Option 2: Custom Redirect URL */}
            <div 
              onClick={() => handleCustomUrlToggle(true)}
              className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                settings.useCustomUrl 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio button */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    settings.useCustomUrl 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {settings.useCustomUrl && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Icon and content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Custom Redirect URL</h4>
                      <p className="text-sm text-gray-600">
                        Redirect to your own website when content is blocked
                      </p>
                    </div>
                  </div>

                  {/* Show input when this option is selected */}
                  {settings.useCustomUrl && (
                    <div className="mt-4 space-y-2">
                      <input
                        type="url"
                        value={redirectUrl}
                        onChange={handleRedirectUrlChange}
                        onBlur={handleRedirectUrlBlur}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-600">
                        Enter the URL to redirect to when blocking content
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;