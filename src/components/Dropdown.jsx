/**
 * Dropdown Component with Checkbox Control
 * 
 * Reusable dropdown using hidden checkbox pattern.
 * Now supports full-width mode for sidebars.
 * 
 * @component
 */

export const Dropdown = ({
  dropdownId,
  trigger,
  children,
  position = 'bottom-left', // 'bottom-left', 'bottom-right', 'top-left', 'top-right', 'bottom-full'
  className = '',
  closeOnClick = true,
  fullWidth = false // New prop for full-width dropdowns
}) => {
  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'bottom-full': 'top-full left-0 right-0 mt-2 w-full', // Full width option
    'top-full': 'bottom-full left-0 right-0 mb-2 w-full' // Full width top
  };

  const handleItemClick = () => {
    if (closeOnClick) {
      const checkbox = document.getElementById(dropdownId);
      if (checkbox) checkbox.checked = false;
    }
  };

  return (
    <div className={fullWidth ? '' : 'relative'}>
      {/* Hidden Checkbox */}
      <input
        type="checkbox"
        id={dropdownId}
        className="peer hidden"
        aria-hidden="true"
      />

      {/* Trigger */}
      <label htmlFor={dropdownId} className="cursor-pointer block">
        {trigger}
      </label>

      {/* Dropdown Menu */}
      <div
        className={`
          peer-checked:block hidden absolute
          ${fullWidth ? 'left-0 right-0 bottom-full mb-2 w-full' : positionClasses[position]}
          bg-white rounded-xl shadow-xl border border-gray-200
          animate-slide-up z-50
          ${className}
        `}
        onClick={handleItemClick}
      >
        {children}
      </div>

      {/* Invisible overlay to close dropdown when clicking outside */}
      <label
        htmlFor={dropdownId}
        className="peer-checked:block hidden fixed inset-0 z-40"
        aria-hidden="true"
      />
    </div>
  );
};