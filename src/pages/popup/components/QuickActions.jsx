/**
 * Quick Actions Component
 * 
 * Import and export buttons for quick data management.
 * 
 * Features:
 * - Side-by-side export/import buttons
 * - Icons for each action
 * - Glass morphism effect
 * - Hover transitions
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onExport - Called when export button clicked
 * @param {Function} props.onImport - Called when import button clicked
 */

import Button from '../../../components/Button';

export const QuickActions = ({ onExport, onImport }) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      {/* Export button */}
      <Button
        onClick={onExport}
        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
      >
        {/* Download icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </Button>
      
      {/* Import button */}
      <Button
        onClick={onImport}
        className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
      >
        {/* Upload icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import
      </Button>
    </div>
  );
};