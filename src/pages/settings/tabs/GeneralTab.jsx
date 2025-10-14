// src/pages/settings/tabs/GeneralTab.jsx
import { useApp } from "../../../contexts/AppContext";
import { Toggle } from "../../../components/Toggle";
import { SettingSection } from "../../../components/SettingSection";
import { BlockingBehaviorSection } from "../../../components/BlockingBehaviorSection";
import { IconManagerSection } from "../../../components/IconManager";
import { SobrietyTracker } from "../components/SobrietyTracker";

const GeneralTab = ({ showToast, showConfirmation }) => {
  const { settings, updateSettings } = useApp();

  const handleToggle = async (key, value) => {
    await updateSettings({ [key]: value });
    showToast(`Setting ${value ? "enabled" : "disabled"}`, "success");
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
        {/* Enable Filter Toggle */}
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

        {/* Sobriety Tracker Section */}
        <SettingSection
          title="Sobriety Tracker"
          description="Track your wellness journey and celebrate your progress"
        >
          <SobrietyTracker
            showToast={showToast}
            showConfirmation={showConfirmation}
          />
        </SettingSection>

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
      </div>
    </div>
  );
};

export default GeneralTab;