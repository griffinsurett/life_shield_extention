/**
 * Toggle Component
 * 
 * Styled toggle switch with label and description.
 * Now memoized to prevent unnecessary re-renders.
 * 
 * @component
 */

import { memo, useCallback } from 'react';

const Toggle = memo(({ checked, onChange, label, description }) => {
  // Memoized change handler
  const handleChange = useCallback((e) => {
    onChange(e.target.checked);
  }, [onChange]);

  return (
    <div className="flex items-center justify-between p-6 rounded-xl">
      {/* Label and description */}
      <div>
        <h3 className="font-semibold text-gray-800">{label}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      
      {/* Toggle switch */}
      <label className="relative inline-flex items-center cursor-pointer">
        {/* Hidden checkbox for accessibility */}
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={handleChange}
        />
        
        {/* Custom toggle visual */}
        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
});

Toggle.displayName = 'Toggle';

export { Toggle };