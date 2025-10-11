/**
 * Badge Component
 * 
 * Unified badge component for displaying removable items.
 * 
 * @component
 */

import { memo } from 'react';
import Button from './Button';

const Badge = memo(({ 
  children, 
  onRemove, 
  icon = null,
  className = ''
}) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-2 m-1 rounded-lg text-xs font-medium transition-all group bg-gray-100 hover:bg-gray-200 text-gray-800 ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="break-all">{children}</span>
      
      <Button
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 hover:bg-red-500/30 rounded-full p-0.5 transition-all flex-shrink-0"
        title="Remove"
        aria-label="Remove"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
});

Badge.displayName = 'Badge';

export default Badge;