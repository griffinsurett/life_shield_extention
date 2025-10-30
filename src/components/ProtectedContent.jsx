// src/components/ProtectedContent.jsx
import { useCallback } from 'react';

/**
 * ProtectedContent Component
 * 
 * Wrapper for protected content with copy/right-click prevention
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to protect
 * @param {boolean} props.preventCopy - Disable copying (default: true)
 * @param {boolean} props.preventContextMenu - Disable right-click (default: true)
 * @param {Function} props.showToast - Toast notification function
 * @param {string} props.className - Additional CSS classes
 */
export const ProtectedContent = ({
  children,
  preventCopy = true,
  preventContextMenu = true,
  showToast,
  className = '',
}) => {
  const handleCopy = useCallback((e) => {
    if (preventCopy) {
      e.preventDefault();
      if (showToast) {
        showToast('Copying is disabled for protected content', 'warning');
      }
    }
  }, [preventCopy, showToast]);

  const handleContextMenu = useCallback((e) => {
    if (preventContextMenu) {
      e.preventDefault();
      if (showToast) {
        showToast('Right-click is disabled for protected content', 'info');
      }
    }
  }, [preventContextMenu, showToast]);

  return (
    <div
      className={className}
      onCopy={handleCopy}
      onContextMenu={handleContextMenu}
      style={preventCopy ? { userSelect: 'none' } : {}}
    >
      {children}
    </div>
  );
};

export default ProtectedContent;