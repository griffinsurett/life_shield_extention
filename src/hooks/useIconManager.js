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
import { createLogger } from '../utils/logger';

const logger = createLogger('useIconManager');

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
      
      logger.debug('Loaded icons from storage:', result);
      setIcons(result[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS] || []);
      setActiveIconId(result[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON] || 'default');
    } catch (error) {
      logger.error('Failed to load icons', error);
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
          logger.debug('Icons changed:', changes[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS].newValue);
          setIcons(changes[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS].newValue || []);
        }
        if (changes[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON]) {
          logger.debug('Active icon changed:', changes[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON].newValue);
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
      
      logger.info('Starting icon upload...', { 
        name, 
        type: file.type, 
        size: file.size 
      });
      
      // Process the image HERE in the UI context (not in background)
      logger.debug('Processing image...');
      const processedIcon = await ImageProcessor.processIconFile(file);
      logger.debug('Image processed successfully', {
        hasOriginal: !!processedIcon.originalDataUrl,
        hasSizes: !!processedIcon.sizes,
        sizes: Object.keys(processedIcon.sizes || {})
      });
      
      // Send the PROCESSED data to background script
      logger.debug('Sending to background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'saveIcon',
        iconData: {
          name: name,
          originalDataUrl: processedIcon.originalDataUrl,
          type: processedIcon.type,
          sizes: processedIcon.sizes
        }
      });

      logger.debug('Response from background:', response);

      // Check if response is valid and successful
      if (!response) {
        throw new Error('No response from background script');
      }

      if (response.success === false || response.error) {
        throw new Error(response.error || 'Failed to save icon');
      }

      showToast('Icon uploaded successfully!', 'success');
      
      // Reload icons to get the updated list
      logger.debug('Reloading icons...');
      await loadIcons();
      
      return response.icon;
    } catch (error) {
      logger.error('Upload icon error:', error);
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
      
      logger.info('Switching to icon:', iconId);
      
      const response = await chrome.runtime.sendMessage({
        action: 'switchIcon',
        iconId
      });

      logger.debug('Switch icon response:', response);

      if (!response || response.success === false || response.error) {
        throw new Error(response?.error || 'Failed to switch icon');
      }

      showToast(iconId === 'default' ? 'Reset to default icon' : 'Icon switched successfully!', 'success');
      setActiveIconId(iconId);
    } catch (error) {
      logger.error('Switch icon error:', error);
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
      logger.info('Deleting icon:', iconId);
      
      const response = await chrome.runtime.sendMessage({
        action: 'deleteIcon',
        iconId
      });

      logger.debug('Delete icon response:', response);

      if (!response || response.success === false || response.error) {
        throw new Error(response?.error || 'Failed to delete icon');
      }

      showToast('Icon deleted', 'success');
      await loadIcons();
    } catch (error) {
      logger.error('Delete icon error:', error);
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