// src/components/Dropdown.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export const Dropdown = ({
  trigger,
  children,
  position = 'bottom-right',
  fullWidth = false,
  closeOnClick = true,
  offset = 8,
  minWidth = '250px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 'auto' });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !isOpen) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Get dropdown height (or estimate if not yet rendered)
    const dropdownHeight = dropdownRef.current?.offsetHeight || 400; // Default estimate
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    let top, left;
    let width = 'auto';

    // Full width mode
    if (fullWidth) {
      width = `${triggerRect.width}px`;
    }

    // Calculate vertical position
    if (shouldOpenUpward) {
      // Open upward
      top = triggerRect.top - dropdownHeight - offset;
      // Ensure it doesn't go above viewport
      top = Math.max(offset, top);
    } else {
      // Open downward (default)
      top = triggerRect.bottom + offset;
    }

    // Calculate horizontal position
    if (position.endsWith('right')) {
      if (dropdownRef.current) {
        const dropdownWidth = dropdownRef.current.offsetWidth;
        left = triggerRect.right - dropdownWidth;
      } else {
        left = triggerRect.right;
      }
    } else {
      left = triggerRect.left;
    }

    // Ensure dropdown stays within viewport horizontally
    const dropdownWidth = dropdownRef.current?.offsetWidth || 280;
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - offset;
    }
    if (left < offset) {
      left = offset;
    }

    setDropdownPosition({ top, left, width });
  }, [isOpen, position, fullWidth, offset]);

  // Update position on mount and changes
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const timer = setTimeout(updatePosition, 0);

    const handleUpdate = () => updatePosition();
    const handleScroll = () => setIsOpen(false);

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  // Handle clicks outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Toggle dropdown
  const handleTriggerClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  // Handle dropdown content clicks
  const handleDropdownClick = useCallback((e) => {
    if (closeOnClick) {
      const target = e.target;
      const isButton = target.tagName === 'BUTTON' || target.closest('button');
      
      if (isButton) {
        setTimeout(() => setIsOpen(false), 100);
      }
    }
  }, [closeOnClick]);

  // Dropdown content portal
  const dropdownPortal = isOpen && createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: dropdownPosition.width === 'auto' ? 'auto' : dropdownPosition.width,
        minWidth: fullWidth ? 'auto' : minWidth,
        maxWidth: '90vw',
        maxHeight: '80vh',
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      onClick={handleDropdownClick}
    >
      <div className="overflow-y-auto overflow-x-hidden max-h-[80vh]">
        {children}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        style={{ cursor: 'pointer' }}
      >
        {trigger}
      </div>
      {dropdownPortal}
    </>
  );
};

// Rest of the component exports remain the same...
export const DropdownItem = ({ 
  children, 
  onClick, 
  className = '', 
  icon,
  danger = false 
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full text-left px-4 py-3 text-sm transition-colors
        flex items-center gap-2 border-0 bg-transparent
        whitespace-nowrap overflow-hidden
        ${danger 
          ? 'text-red-600 hover:bg-red-50' 
          : 'text-gray-700 hover:bg-gray-50'
        }
        ${className}
      `}
      style={{ outline: 'none' }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

export const DropdownDivider = () => {
  return <div className="border-t border-gray-100" />;
};

export const DropdownHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-3 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
};

export default Dropdown;