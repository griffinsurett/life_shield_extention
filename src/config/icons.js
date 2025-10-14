/**
 * Icon Configuration Constants
 * 
 * Centralized configuration for custom icon feature.
 * 
 * @module config/icons
 */

export const ICON_CONFIG = {
  MAX_ICONS: 10,
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  SUPPORTED_FORMATS: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/x-icon', 'image/webp'],
  SIZES: [16, 48, 128],
  STORAGE_KEYS: {
    CUSTOM_ICONS: 'customIcons',
    ACTIVE_ICON: 'activeIconId'
  }
};

export const ICON_VALIDATION = {
  validateFormat(mimeType) {
    return ICON_CONFIG.SUPPORTED_FORMATS.includes(mimeType);
  },
  
  validateSize(size) {
    return size <= ICON_CONFIG.MAX_FILE_SIZE;
  },
  
  getErrorMessage(type) {
    switch(type) {
      case 'size':
        return `File size must be less than ${ICON_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`;
      case 'format':
        return `Unsupported format. Supported: ${ICON_CONFIG.SUPPORTED_FORMATS.join(', ')}`;
      case 'limit':
        return `Maximum ${ICON_CONFIG.MAX_ICONS} custom icons allowed`;
      default:
        return 'Invalid file';
    }
  }
};