/**
 * Toggle Component
 * 
 * Styled toggle switch with label and description.
 * Used for boolean settings.
 * 
 * Features:
 * - Animated toggle switch
 * - Label and optional description
 * - Accessible (uses native checkbox)
 * - Keyboard support
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.checked - Current state
 * @param {Function} props.onChange - Called when toggled
 * @param {string} props.label - Toggle label
 * @param {string} props.description - Optional description text
 */
export const Toggle = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
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
          onChange={(e) => onChange(e.target.checked)}
        />
        
        {/* Custom toggle visual */}
        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
};