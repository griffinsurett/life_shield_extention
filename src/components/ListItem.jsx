/**
 * List Item Component
 * 
 * Reusable list item with remove button.
 * Used for displaying blocked words, sites, and phrases.
 * 
 * Features:
 * - Hover effect to show remove button
 * - Configurable background color
 * - Smooth transitions
 * - Accessible remove button
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display
 * @param {Function} props.onRemove - Called when remove button clicked
 * @param {string} props.bgColor - Background color scheme (default: 'gray')
 */
export const ListItem = ({ children, onRemove, bgColor = 'gray' }) => {
  // Background color classes
  const bgClasses = {
    gray: 'bg-gray-50 hover:bg-gray-100',
    green: 'bg-green-50 hover:bg-green-100',
    orange: 'bg-orange-50 hover:bg-orange-100'
  };

  return (
    <div className={`flex items-center justify-between p-4 ${bgClasses[bgColor]} rounded-xl transition-colors group`}>
      {/* Item content */}
      <span className="font-medium text-gray-800">{children}</span>
      
      {/* Remove button - shows on hover */}
      <button 
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
        title="Remove"
      >
        {/* X icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};