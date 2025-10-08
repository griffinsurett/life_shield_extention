/**
 * Add Item Input Component
 * 
 * Reusable input with button for adding items to lists.
 * Used for adding blocked words, sites, and phrases.
 * 
 * Features:
 * - Text input with Enter key support
 * - Styled button with icon
 * - Configurable colors (primary, green, orange)
 * - Keyboard accessibility
 * 
 * @component
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Called when input changes
 * @param {Function} props.onAdd - Called when add button clicked or Enter pressed
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.buttonText - Button text (default: 'Add')
 * @param {string} props.buttonColor - Button color scheme (default: 'primary')
 */
export const AddItemInput = ({ 
  value, 
  onChange, 
  onAdd, 
  placeholder, 
  buttonText = 'Add',
  buttonColor = 'primary'
}) => {
  // Color scheme classes for button
  const colorClasses = {
    primary: 'bg-primary hover:bg-secondary',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  return (
    <div className="flex gap-3">
      {/* Text input */}
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onAdd()} // Support Enter key
        placeholder={placeholder}
        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
      />
      
      {/* Add button with icon */}
      <button 
        onClick={onAdd}
        className={`px-6 py-3 ${colorClasses[buttonColor]} text-white rounded-xl font-semibold transition-colors flex items-center gap-2`}
      >
        {/* Plus icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        {buttonText}
      </button>
    </div>
  );
};