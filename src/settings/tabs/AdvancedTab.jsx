export const AdvancedTab = ({ settings, updateSettings }) => {
  const resetAllSettings = async () => {
    if (!confirm('This will reset ALL settings, words, phrases, and statistics to defaults. Are you sure?')) return;
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Advanced Settings</h2>

      <div className="space-y-6">
        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-4">Performance Tuning</h3>
          
          <div className="space-y-4">
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

        <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200">
          <h3 className="font-semibold text-red-800 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">These actions cannot be undone</p>
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