/**
 * Popup Footer Component
 * 
 * Footer with version number and branding.
 * 
 * Features:
 * - Version display
 * - Made with love message
 * - Border separator
 * - Subtle styling
 * 
 * @component
 */

export const PopupFooter = () => {
  return (
    <div className="mt-6 pt-4 border-t border-white/20 text-center">
      <p className="text-xs text-white/50">v1.0.0 • Made with 💚</p>
    </div>
  );
};