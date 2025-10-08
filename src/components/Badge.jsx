/**
 * Badge Component
 * 
 * Unified badge component for displaying removable items.
 * Replaces WordBadge and SiteBadge with a single flexible component.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {Function} props.onRemove - Called when remove button clicked
 * @param {string} props.variant - Visual variant: 'default', 'danger', 'warning'
 * @param {string} props.icon - Optional emoji icon to display
 * @param {string} props.className - Additional CSS classes
 */

import { memo } from 'react';

const Badge = memo(({ 
  children, 
  onRemove, 
  variant = 'default',
  icon = null,
  className = ''
}) => {
  // Variant styles
  const variants = {
    default: 'bg-white/20 hover:bg-white/30 text-white',
    danger: 'bg-white/20 hover:bg-white/30 text-white',
    warning: 'bg-white/20 hover:bg-white/30 text-white',
    light: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-2 m-1 rounded-lg text-xs font-medium transition-all group ${variants[variant]} ${className}`}
    >
      {/* Optional icon */}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      
      {/* Content */}
      <span className="break-all">{children}</span>
      
      {/* Remove button */}
      <button 
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 hover:bg-red-500/30 rounded-full p-0.5 transition-all flex-shrink-0"
        title="Remove"
        aria-label="Remove"
      >
        {/* X icon */}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

Badge.displayName = 'Badge';

export default Badge;