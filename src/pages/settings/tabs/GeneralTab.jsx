// src/pages/settings/tabs/GeneralTab.jsx
import { useState } from 'react';
import { useApp } from "../../../contexts/AppContext";
import { Toggle } from "../../../components/Toggle";
import { SettingSection } from "../../../components/SettingSection";
import { BlockingBehaviorSection } from "../../../components/BlockingBehaviorSection";
import { IconManagerSection } from "../../../components/IconManager";
import { PasscodeSection } from "../components/PasscodeSection";
import { PasscodeModal } from "../../../components/PasscodeModal";
import { STORAGE_KEYS } from '../../../config';

const GeneralTab = ({ showToast, showConfirmation }) => {
  const { settings, updateSettings } = useApp();
  
  // State for filter toggle protection
  const [showFilterPasscodeModal, setShowFilterPasscodeModal] = useState(false);
  const [pendingFilterValue, setPendingFilterValue] = useState(null);

  /**
   * Handle toggle with passcode protection
   */
  const handleToggle = async (key, value) => {
    // Special handling for enableFilter
    if (key === 'enableFilter') {
      // If trying to turn OFF the filter, check for passcode protection
      if (!value) {
        // Check if passcode exists
        try {
          const result = await chrome.storage.local.get([STORAGE_KEYS.PASSCODE_HASH]);
          const hasPasscode = !!result[STORAGE_KEYS.PASSCODE_HASH];
          
          if (hasPasscode) {
            // Require passcode verification before turning off
            setPendingFilterValue(value);
            setShowFilterPasscodeModal(true);
            return; // Don't toggle yet, wait for passcode
          }
        } catch (error) {
          console.error('Error checking passcode:', error);
        }
      }
    }
    
    // No passcode required or turning filter ON
    await updateSettings({ [key]: value });
    showToast(`Setting ${value ? "enabled" : "disabled"}`, "success");
  };

  /**
   * Handle successful passcode verification for filter toggle
   */
  const handleFilterPasscodeSuccess = async () => {
    if (pendingFilterValue !== null) {
      await updateSettings({ enableFilter: pendingFilterValue });
      showToast('Filter disabled', 'success');
      setPendingFilterValue(null);
    }
  };

  /**
   * Handle passcode modal close for filter toggle
   */
  const handleFilterPasscodeClose = () => {
    setShowFilterPasscodeModal(false);
    setPendingFilterValue(null);
  };

  const handleRedirectChange = async (e) => {
    await updateSettings({ redirectUrl: e.target.value });
  };

  const handleMessageChange = async (e) => {
    await updateSettings({ customMessage: e.target.value });
  };

  const handleToggleCustomUrl = async (value) => {
    await updateSettings({ useCustomUrl: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        General Settings
      </h2>

      <div className="space-y-8">
        {/* Enable Filter Toggle - WITH PASSCODE PROTECTION */}
        <SettingSection>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Enable Filter
              </h3>
              <p className="text-sm text-gray-600">
                Turn the content filter on or off globally
              </p>
            </div>
            <Toggle
              checked={settings.enableFilter}
              onChange={(checked) => handleToggle("enableFilter", checked)}
            />
          </div>
          
        </SettingSection>

        {/* Show Alerts Toggle */}
        <SettingSection>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Show Alerts
              </h3>
              <p className="text-sm text-gray-600">
                Display notifications and badge count when content is blocked
              </p>
            </div>
            <Toggle
              checked={settings.showAlerts}
              onChange={(checked) => handleToggle("showAlerts", checked)}
            />
          </div>
        </SettingSection>

        {/* Custom Icon Section */}
        <IconManagerSection
          showToast={showToast}
          showConfirmation={showConfirmation}
        />

        {/* Blocking Behavior */}
        <SettingSection noBorder>
          <BlockingBehaviorSection
            useCustomUrl={settings.useCustomUrl}
            redirectUrl={settings.redirectUrl}
            customMessage={settings.customMessage}
            onToggleCustomUrl={handleToggleCustomUrl}
            onRedirectChange={handleRedirectChange}
            onMessageChange={handleMessageChange}
          />
        </SettingSection>

        {/* Passcode Protection Section */}
        <SettingSection>
          <PasscodeSection
            showToast={showToast}
            showConfirmation={showConfirmation}
          />
        </SettingSection>
      </div>

      {/* Passcode Modal for Filter Toggle */}
      <PasscodeModal
        isOpen={showFilterPasscodeModal}
        onClose={handleFilterPasscodeClose}
        onSuccess={handleFilterPasscodeSuccess}
        mode="verify"
        title="Verify Passcode"
        message="Enter your passcode to disable the content filter"
      />
    </div>
  );
};

export default GeneralTab;