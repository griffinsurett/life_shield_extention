/**
 * Icon Manager Service
 * 
 * Manages custom icon storage and switching.
 * Image processing happens in the UI, not here.
 * 
 * @module background/services/iconManager
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { DEFAULTS } from "../../config";
import { ICON_CONFIG } from "../../config/icons";

const logger = createLogger("IconManager");

class IconManager {
  constructor() {
    this.activeIconId = 'default';
    this.customIcons = [];
    logger.info('IconManager constructor called');
  }

  async init() {
    if (!isExtensionContextValid()) {
      logger.warn('Context invalid, skipping init');
      return;
    }

    try {
      logger.info('Initializing icon manager...');
      
      const result = await chrome.storage.local.get([
        ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS,
        ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON
      ]);

      this.customIcons = result[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS] || [];
      this.activeIconId = result[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON] || 'default';

      logger.info('Icon manager initialized', {
        customIcons: this.customIcons.length,
        activeIcon: this.activeIconId
      });

      if (this.activeIconId !== 'default') {
        await this.applyIcon(this.activeIconId);
      }
    } catch (error) {
      logger.error('Failed to initialize icon manager', error);
    }
  }

  async saveIcon(iconData) {
    try {
      logger.info('saveIcon called', { name: iconData?.name });
      
      if (!iconData || !iconData.name || !iconData.sizes) {
        throw new Error('Invalid icon data');
      }

      const iconId = `icon-${Date.now()}`;
      const icon = {
        id: iconId,
        name: iconData.name,
        originalDataUrl: iconData.originalDataUrl,
        type: iconData.type,
        sizes: iconData.sizes,
        createdAt: new Date().toISOString()
      };

      if (this.customIcons.length >= ICON_CONFIG.MAX_ICONS) {
        throw new Error(`Maximum ${ICON_CONFIG.MAX_ICONS} custom icons allowed`);
      }

      this.customIcons.push(icon);
      await chrome.storage.local.set({
        [ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS]: this.customIcons
      });

      logger.info('Icon saved successfully', { iconId, name: icon.name });
      return icon;
    } catch (error) {
      logger.error('Failed to save icon', error);
      throw error;
    }
  }

  async switchIcon(iconId) {
    logger.info('switchIcon called', { iconId });
    
    if (iconId === 'default') {
      await this.resetToDefault();
      return;
    }

    const icon = this.customIcons.find(i => i.id === iconId);
    if (!icon) {
      throw new Error('Icon not found');
    }

    await this.applyIcon(iconId);
  }

  async applyIcon(iconId) {
    try {
      logger.info('applyIcon called', { iconId });
      
      const icon = this.customIcons.find(i => i.id === iconId);
      if (!icon) {
        throw new Error('Icon not found');
      }

      await chrome.action.setIcon({
        imageData: {
          16: await this.dataUrlToImageData(icon.sizes[16]),
          48: await this.dataUrlToImageData(icon.sizes[48]),
          128: await this.dataUrlToImageData(icon.sizes[128])
        }
      });

      this.activeIconId = iconId;
      await chrome.storage.local.set({
        [ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON]: iconId
      });

      logger.info('Icon applied successfully', { iconId });
    } catch (error) {
      logger.error('Failed to apply icon', error);
      throw error;
    }
  }

  async dataUrlToImageData(dataUrl) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
      return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
    } catch (error) {
      logger.error('Failed to convert data URL to ImageData', error);
      throw error;
    }
  }

  async resetToDefault() {
    try {
      logger.info('Resetting to default icon');
      
      await chrome.action.setIcon({
        path: {
          16: DEFAULTS.ICONS[16],
          48: DEFAULTS.ICONS[48],
          128: DEFAULTS.ICONS[128]
        }
      });

      this.activeIconId = 'default';
      await chrome.storage.local.set({
        [ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON]: 'default'
      });

      logger.info('Reset to default icon complete');
    } catch (error) {
      logger.error('Failed to reset icon', error);
      throw error;
    }
  }

  async deleteIcon(iconId) {
    logger.info('deleteIcon called', { iconId });
    
    const index = this.customIcons.findIndex(i => i.id === iconId);
    if (index === -1) {
      throw new Error('Icon not found');
    }

    if (this.activeIconId === iconId) {
      await this.resetToDefault();
    }

    this.customIcons.splice(index, 1);
    await chrome.storage.local.set({
      [ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS]: this.customIcons
    });

    logger.info('Icon deleted', { iconId });
  }

  getIcons() {
    return this.customIcons;
  }

  getActiveIconId() {
    return this.activeIconId;
  }
}

// Export as singleton instance
export const iconManager = new IconManager();