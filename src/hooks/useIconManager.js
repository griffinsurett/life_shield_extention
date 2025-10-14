/**
 * Icon Manager Hook
 * 
 * Provides icon management functionality to React components.
 * 
 * @hook
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastContainer';
import { ImageProcessor } from '../utils/imageProcessor';
import { ICON_CONFIG } from '../config/icons';

export const useIconManager = () => {
  const { showToast } = useToast();
  const [icons, setIcons] = useState([]);
  const [activeIconId, setActiveIconId] = useState('default');
  const [loading, setLoading] = useState(true);

  /**
   * Load icons from storage
   */
  const loadIcons = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get([
        ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS,
        ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON
      ]);
      
      console.log('Loaded icons from storage:', result);
      setIcons(result[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS] || []);
      setActiveIconId(result[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON] || 'default');
    } catch (error) {
      console.error('Failed to load icons', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIcons();

    // Listen for changes
    const listener = (changes, namespace) => {
      if (namespace === 'local') {
        if (changes[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS]) {
          console.log('Icons changed:', changes[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS].newValue);
          setIcons(changes[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS].newValue || []);
        }
        if (changes[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON]) {
          console.log('Active icon changed:', changes[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON].newValue);
          setActiveIconId(changes[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON].newValue || 'default');
        }
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [loadIcons]);

  /**
   * Upload new icon - PROCESS IN UI FIRST
   */
  const uploadIcon = useCallback(async (file, name) => {
    try {
      setLoading(true);
      
      console.log('Starting icon upload...', { 
        name, 
        type: file.type, 
        size: file.size 
      });
      
      // Process the image HERE in the UI context (not in background)
      console.log('Processing image...');
      const processedIcon = await ImageProcessor.processIconFile(file);
      console.log('Image processed successfully', {
        hasOriginal: !!processedIcon.originalDataUrl,
        hasSizes: !!processedIcon.sizes,
        sizes: Object.keys(processedIcon.sizes || {})
      });
      
      // Send the PROCESSED data to background script
      console.log('Sending to background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'saveIcon',
        iconData: {
          name: name,
          originalDataUrl: processedIcon.originalDataUrl,
          type: processedIcon.type,
          sizes: processedIcon.sizes
        }
      });

      console.log('Response from background:', response);

      // Check if response is valid and successful
      if (!response) {
        throw new Error('No response from background script');
      }

      if (response.success === false || response.error) {
        throw new Error(response.error || 'Failed to save icon');
      }

      showToast('Icon uploaded successfully!', 'success');
      
      // Reload icons to get the updated list
      console.log('Reloading icons...');
      await loadIcons();
      
      return response.icon;
    } catch (error) {
      console.error('Upload icon error:', error);
      showToast(error.message || 'Failed to upload icon', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast, loadIcons]);

  /**
   * Switch active icon
   */
  const switchIcon = useCallback(async (iconId) => {
    try {
      setLoading(true);
      
      console.log('Switching to icon:', iconId);
      
      const response = await chrome.runtime.sendMessage({
        action: 'switchIcon',
        iconId
      });

      console.log('Switch icon response:', response);

      if (!response || response.success === false || response.error) {
        throw new Error(response?.error || 'Failed to switch icon');
      }

      showToast(iconId === 'default' ? 'Reset to default icon' : 'Icon switched successfully!', 'success');
      setActiveIconId(iconId);
    } catch (error) {
      console.error('Switch icon error:', error);
      showToast(error.message || 'Failed to switch icon', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Delete icon
   */
  const deleteIcon = useCallback(async (iconId) => {
    try {
      console.log('Deleting icon:', iconId);
      
      const response = await chrome.runtime.sendMessage({
        action: 'deleteIcon',
        iconId
      });

      console.log('Delete icon response:', response);

      if (!response || response.success === false || response.error) {
        throw new Error(response?.error || 'Failed to delete icon');
      }

      showToast('Icon deleted', 'success');
      await loadIcons();
    } catch (error) {
      console.error('Delete icon error:', error);
      showToast(error.message || 'Failed to delete icon', 'error');
      throw error;
    }
  }, [showToast, loadIcons]);

  return {
    icons,
    activeIconId,
    loading,
    uploadIcon,
    switchIcon,
    deleteIcon,
    reloadIcons: loadIcons
  };
};