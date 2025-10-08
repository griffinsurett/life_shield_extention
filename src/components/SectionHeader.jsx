/**
 * Section Header Component
 * 
 * Displays a section title with optional count badge.
 * Used to show counts of blocked words, sites, phrases, etc.
 * 
 * Features:
 * - Title with optional count
 * - Color-coded count badges
 * - Responsive layout
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Section title text
 * @param {number} props.count - Optional count to display
 * @param {string} props.countColor - Badge color scheme (default: 'primary')
 */
export const SectionHeader = ({ title, count, countColor = 'primary' }) => {
  // Color classes for count badge
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Section title */}
      <h3 className="font-semibold text-gray-800">{title}</h3>
      
      {/* Count badge - only shown if count is provided */}
      {count !== undefined && (
        <span className={`px-3 py-1 ${colorClasses[countColor]} rounded-full text-sm font-medium`}>
          {count} {title.toLowerCase()}
        </span>
      )}
    </div>
  );
};