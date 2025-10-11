// src/pages/settings/tabs/GeneralTab.jsx
import { useApp } from '../../../contexts/AppContext';
import { Toggle } from '../../../components/Toggle';
import Button from '../../../components/Button';
import Input from '../../../components/Input';

const GeneralTab = ({ showToast }) => {
  const { settings, updateSettings } = useApp();

  const handleToggle = async (key, value) => {
    await updateSettings({ [key]: value });
    showToast(`Setting ${value ? 'enabled' : 'disabled'}`, 'success');
  };

  const handleRedirectChange = async (e) => {
    const url = e.target.value;
    await updateSettings({ redirectUrl: url });
  };

  const handleMessageChange = async (e) => {
    const message = e.target.value;
    await updateSettings({ customMessage: message });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">General Settings</h2>
      
      <div className="space-y-8">
        {/* Enable Filter Toggle */}
        <div className="pb-6 border-b border-gray-200">
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
              onChange={(checked) => handleToggle('enableFilter', checked)}
            />
          </div>
        </div>

        {/* Show Alerts Toggle */}
        <div className="pb-6 border-b border-gray-200">
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
              onChange={(checked) => handleToggle('showAlerts', checked)}
            />
          </div>
        </div>

        {/* Blocking Behavior */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Blocking Behavior
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose what happens when blocked content is detected
          </p>
          
          <div className="space-y-4">
            {/* Built-in Blocked Page Option */}
            <label 
              className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                !settings.useCustomUrl 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="blockBehavior"
                  checked={!settings.useCustomUrl}
                  onChange={() => updateSettings({ useCustomUrl: false })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🛡️</span>
                    <span className="font-semibold text-gray-800">
                      Built-in Blocked Page
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Show a custom message on our blocked page
                  </p>
                  
                  {!settings.useCustomUrl && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Message (optional)
                      </label>
                      <Input
                        type="text"
                        value={settings.customMessage || ''}
                        onChange={handleMessageChange}
                        placeholder="This site is blocked for your wellbeing"
                        className="input-base"
                      />
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Custom URL Option */}
            <label 
              className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                settings.useCustomUrl 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="blockBehavior"
                  checked={settings.useCustomUrl}
                  onChange={() => updateSettings({ useCustomUrl: true })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🔗</span>
                    <span className="font-semibold text-gray-800">
                      Custom Redirect URL
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Redirect to a specific website when content is blocked
                  </p>
                  
                  {settings.useCustomUrl && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redirect URL
                      </label>
                      <Input
                        type="url"
                        value={settings.redirectUrl}
                        onChange={handleRedirectChange}
                        placeholder="https://example.com"
                        className="input-base"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a full URL including https://
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;