/**
 * Blocked Sites Section Component
 * 
 * Section for managing blocked sites in the popup.
 * 
 * Features:
 * - List of blocked sites as badges
 * - Add new site input with helper text
 * - Count indicator
 * - Scrollable list
 * - Empty state message
 * - Red theme to indicate blocking
 * 
 * @component
 * @param {Object} props
 * @param {string[]} props.sites - Array of blocked sites
 * @param {string} props.newSite - Current input value
 * @param {Function} props.onNewSiteChange - Called when input changes
 * @param {Function} props.onAddSite - Called when add button clicked
 * @param {Function} props.onRemoveSite - Called when site removed
 */

import { SiteBadge } from './SiteBadge';

export const BlockedSitesSection = ({ 
  sites, 
  newSite, 
  onNewSiteChange, 
  onAddSite, 
  onRemoveSite 
}) => {
  return (
    <div className="mb-5 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">Blocked Sites</h2>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{sites.length}</span>
      </div>
      
      {/* Sites List - scrollable */}
      <div className="mb-3 max-h-32 overflow-y-auto pr-2">
        {sites.length === 0 ? (
          // Empty state
          <div className="text-center py-4 text-white/50 text-sm">
            No blocked sites yet. Add one below!
          </div>
        ) : (
          // Site badges
          sites.map((site, index) => (
            <SiteBadge 
              key={index}
              site={site}
              onRemove={() => onRemoveSite(index)}
            />
          ))
        )}
      </div>
      
      {/* Add Site Input */}
      <div className="space-y-2">
        <input 
          type="text" 
          value={newSite}
          onChange={(e) => onNewSiteChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddSite()}
          placeholder="e.g., example.com or example.com/page"
          className="w-full px-4 py-2.5 rounded-lg text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
        />
        
        {/* Block button - red theme */}
        <button 
          onClick={onAddSite}
          className="w-full px-4 py-2.5 bg-white text-red-600 rounded-lg font-semibold text-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {/* Block icon */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Block Site
        </button>
      </div>
    </div>
  );
};