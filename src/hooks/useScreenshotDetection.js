// src/hooks/useScreenshotDetection.js
import { useEffect } from 'react';

/**
 * Custom hook for detecting screenshot attempts and triggering lock
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether screenshot detection is enabled
 * @param {Function} options.onScreenshot - Callback when screenshot detected
 * @param {Function} options.showToast - Toast notification function
 */
export const useScreenshotDetection = ({
  enabled = false,
  onScreenshot,
  showToast,
} = {}) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyUp = (e) => {
      let detected = false;

      // PrintScreen key (Windows/Linux)
      if (e.key === 'PrintScreen') {
        detected = true;
      }

      // Cmd+Shift+3 or Cmd+Shift+4 (Mac full/partial screenshot)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
        detected = true;
      }

      // Cmd+Shift+5 (Mac screenshot utility)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '5') {
        detected = true;
      }

      if (detected) {
        if (onScreenshot) {
          onScreenshot();
        }
        if (showToast) {
          showToast('⚠️ Screenshot detected - list locked for protection', 'warning');
        }
      }
    };

    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onScreenshot, showToast]);
};

export default useScreenshotDetection;