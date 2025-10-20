/**
 * More Tab Component
 * 
 * Additional features and settings.
 * 
 * Features:
 * - Replacement phrase preview
 * - Import/Export buttons
 * - Link to full settings
 * 
 * @component
 */

import { ReplacementPhrasesPreview } from '../components/ReplacementPhrasesPreview';
import { QuickActions } from '../components/QuickActions';
import { SettingsButton } from '../components/SettingsButton';

export const MoreTab = ({ 
  previewPhrase, 
  refreshPreviewPhrase, 
  handleExport, 
  handleImport, 
  openSettings 
}) => {
  return (
    <div className="space-y-4">
      {/* Replacement phrase preview */}
      <ReplacementPhrasesPreview
        phrase={previewPhrase}
        onRefresh={refreshPreviewPhrase}
      />
      
      {/* Advanced settings link */}
      <SettingsButton onClick={openSettings} />
      
      {/* Info cards */}
      <div className="space-y-2">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="opacity-90">Tip: Use the Words and Sites tabs to manage your lists</span>
          </div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span className="opacity-90">Access advanced settings from the button above</span>
          </div>
        </div>
      </div>
    </div>
  );
};