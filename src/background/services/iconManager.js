/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ICON MANAGER SERVICE - Custom Extension Icon System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service manages custom icons for the extension. It allows users to
 * upload their own icons to disguise the extension's presence in the toolbar
 * and notification center, enhancing privacy and anonymity.
 * 
 * WHY CUSTOM ICONS?
 * - Privacy: Makes extension less identifiable to others viewing your screen
 * - Anonymity: Disguises the extension's purpose
 * - Personalization: Users can choose icons that blend with their other extensions
 * 
 * ARCHITECTURE DECISION:
 * Image processing happens in the UI (popup/settings pages), not here.
 * Why? Service workers don't have access to Canvas API or DOM.
 * The UI processes the image and sends us ready-to-use ImageData.
 * 
 * WHAT THIS SERVICE DOES:
 * - Stores up to 10 custom icons
 * - Manages active icon selection
 * - Applies icons to extension toolbar and notifications
 * - Handles switching between custom and default icons
 * - Provides icon management API for UI
 * 
 * WHAT THIS SERVICE DOES NOT DO:
 * - Image processing (resizing, format conversion) - done in UI
 * - Validation beyond basic checks - UI does format/size validation
 * 
 * STORAGE:
 * - Icons stored in chrome.storage.local (not synced - too large)
 * - Each icon stored as 3 data URLs (16px, 48px, 128px)
 * - Max 10 icons to prevent excessive storage usage
 * - Typical storage: 50-200KB per icon
 * 
 * DATA STRUCTURE:
 * {
 *   id: 'icon-1234567890',           // Unique ID (timestamp-based)
 *   name: 'Privacy Icon',            // User-friendly name
 *   originalDataUrl: 'data:image...', // Original upload (for reference)
 *   type: 'png',                     // File type
 *   sizes: {
 *     16: 'data:image/png...',       // 16x16 PNG data URL
 *     48: 'data:image/png...',       // 48x48 PNG data URL
 *     128: 'data:image/png...'       // 128x128 PNG data URL
 *   },
 *   createdAt: '2025-01-15T...'      // Creation timestamp
 * }
 * 
 * @module background/services/iconManager
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { DEFAULTS } from "../../config";
import { ICON_CONFIG } from "../../config/icons";

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════
const logger = createLogger("IconManager");

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ICON MANAGER CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages custom icon storage and switching.
 * Singleton pattern - only one instance exists.
 * 
 * STATE:
 * - customIcons: Array of custom icon objects
 * - activeIconId: ID of currently active icon ('default' or custom ID)
 * 
 * METHODS:
 * - init(): Load icons from storage
 * - saveIcon(): Save new custom icon
 * - switchIcon(): Change active icon
 * - applyIcon(): Apply icon to Chrome
 * - deleteIcon(): Remove custom icon
 * - resetToDefault(): Switch back to default icon
 * - getIcons(): Get list of custom icons
 * - getActiveIconId(): Get current active icon ID
 * 
 * @class IconManager
 */
class IconManager {
  constructor() {
    // Initialize state
    this.activeIconId = 'default';  // Start with default icon
    this.customIcons = [];           // Empty icon list
    logger.info('IconManager constructor called');
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * INITIALIZE ICON MANAGER
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Loads saved icons and active icon from storage.
   * If an active icon is set, applies it immediately.
   * 
   * INITIALIZATION PROCESS:
   * 1. Verify extension context is valid
   * 2. Load custom icons from storage
   * 3. Load active icon ID from storage
   * 4. If active icon is custom, apply it to Chrome
   * 
   * ERROR HANDLING:
   * If loading fails, we log the error but don't crash.
   * The extension will work with the default icon.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT CHECK
    // ─────────────────────────────────────────────────────────────────────────
    if (!isExtensionContextValid()) {
      logger.warn('Context invalid, skipping init');
      return;
    }

    try {
      logger.info('Initializing icon manager...');
      
      // ───────────────────────────────────────────────────────────────────────
      // LOAD FROM STORAGE
      // ───────────────────────────────────────────────────────────────────────
      // Get both custom icons list and active icon ID in one call
      const result = await chrome.storage.local.get([
        ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS,  // Array of icon objects
        ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON    // ID of active icon
      ]);

      // Extract data with fallbacks
      this.customIcons = result[ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS] || [];
      this.activeIconId = result[ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON] || 'default';

      logger.info('Icon manager initialized', {
        customIcons: this.customIcons.length,
        activeIcon: this.activeIconId
      });

      // ───────────────────────────────────────────────────────────────────────
      // APPLY ACTIVE ICON
      // ───────────────────────────────────────────────────────────────────────
      // If a custom icon is active, apply it now
      // (Skip if using default - it's already set)
      if (this.activeIconId !== 'default') {
        await this.applyIcon(this.activeIconId);
      }
    } catch (error) {
      logger.error('Failed to initialize icon manager', error);
    }
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * SAVE NEW CUSTOM ICON
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Saves a new custom icon to storage.
   * The icon data comes from the UI where image processing happened.
   * 
   * IMPORTANT: Image processing happens in the UI, not here!
   * The UI sends us an iconData object with all sizes pre-generated.
   * 
   * VALIDATION:
   * - Icon data must have: name, sizes (16, 48, 128)
   * - Max 10 custom icons allowed (enforced here)
   * - Basic structure validation only (UI did format/size checks)
   * 
   * PROCESS:
   * 1. Validate icon data structure
   * 2. Check icon limit (max 10)
   * 3. Generate unique ID (timestamp-based)
   * 4. Add creation timestamp
   * 5. Add to customIcons array
   * 6. Save to storage
   * 
   * @async
   * @param {Object} iconData - Icon data from UI (already processed)
   * @param {string} iconData.name - User-friendly name
   * @param {string} iconData.originalDataUrl - Original upload
   * @param {string} iconData.type - File type (png, svg, etc.)
   * @param {Object} iconData.sizes - Pre-generated sizes (16, 48, 128)
   * @returns {Promise<Object>} Saved icon object
   * @throws {Error} If validation fails or limit exceeded
   */
  async saveIcon(iconData) {
    try {
      logger.info('saveIcon called', { name: iconData?.name });
      
      // ───────────────────────────────────────────────────────────────────────
      // VALIDATE ICON DATA
      // ───────────────────────────────────────────────────────────────────────
      if (!iconData || !iconData.name || !iconData.sizes) {
        throw new Error('Invalid icon data');
      }

      // ───────────────────────────────────────────────────────────────────────
      // CHECK ICON LIMIT
      // ───────────────────────────────────────────────────────────────────────
      if (this.customIcons.length >= ICON_CONFIG.MAX_ICONS) {
        throw new Error(`Maximum ${ICON_CONFIG.MAX_ICONS} custom icons allowed`);
      }

      // ───────────────────────────────────────────────────────────────────────
      // CREATE ICON OBJECT
      // ───────────────────────────────────────────────────────────────────────
      // Generate unique ID using timestamp
      // This is sufficient for our use case (users won't upload multiple icons per millisecond)
      const iconId = `icon-${Date.now()}`;
      
      const icon = {
        id: iconId,
        name: iconData.name,
        originalDataUrl: iconData.originalDataUrl,
        type: iconData.type,
        sizes: iconData.sizes,  // Already processed: { 16: '...', 48: '...', 128: '...' }
        createdAt: new Date().toISOString()
      };

      // ───────────────────────────────────────────────────────────────────────
      // SAVE TO STORAGE
      // ───────────────────────────────────────────────────────────────────────
      // Add to our in-memory array
      this.customIcons.push(icon);
      
      // Save to chrome.storage.local
      // Using local storage (not sync) because:
      // 1. Icons are large (50-200KB each)
      // 2. Sync storage has strict size limits (100KB total)
      // 3. Icons are device-specific preference
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

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * SWITCH TO DIFFERENT ICON
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Switches the active icon to a different one.
   * Can switch to default icon or any custom icon.
   * 
   * PROCESS:
   * 1. If switching to default, call resetToDefault()
   * 2. Otherwise, verify icon exists
   * 3. Apply the icon to Chrome
   * 4. Update active icon ID in storage
   * 
   * @async
   * @param {string} iconId - ID of icon to switch to ('default' or custom ID)
   * @throws {Error} If icon not found
   */
  async switchIcon(iconId) {
    logger.info('switchIcon called', { iconId });
    
    // ─────────────────────────────────────────────────────────────────────────
    // HANDLE DEFAULT ICON
    // ─────────────────────────────────────────────────────────────────────────
    if (iconId === 'default') {
      await this.resetToDefault();
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFY ICON EXISTS
    // ─────────────────────────────────────────────────────────────────────────
    const icon = this.customIcons.find(i => i.id === iconId);
    if (!icon) {
      throw new Error('Icon not found');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPLY ICON
    // ─────────────────────────────────────────────────────────────────────────
    await this.applyIcon(iconId);
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * APPLY ICON TO CHROME
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Applies a custom icon to the Chrome extension.
   * This changes the icon in the toolbar and in notifications.
   * 
   * CHROME API:
   * chrome.action.setIcon() accepts ImageData objects (not data URLs directly)
   * So we need to convert data URLs to ImageData.
   * 
   * PROCESS:
   * 1. Find icon in customIcons array
   * 2. Convert each size (16, 48, 128) from data URL to ImageData
   * 3. Call chrome.action.setIcon() with ImageData objects
   * 4. Update activeIconId in memory and storage
   * 
   * WHY THREE SIZES:
   * - 16px: Used in some UI elements
   * - 48px: Used in toolbar and notifications
   * - 128px: Used in Chrome Web Store and installation screens
   * 
   * @async
   * @param {string} iconId - ID of icon to apply
   * @throws {Error} If icon not found or conversion fails
   */
  async applyIcon(iconId) {
    try {
      logger.info('applyIcon called', { iconId });
      
      // ───────────────────────────────────────────────────────────────────────
      // FIND ICON
      // ───────────────────────────────────────────────────────────────────────
      const icon = this.customIcons.find(i => i.id === iconId);
      if (!icon) {
        throw new Error('Icon not found');
      }

      // ───────────────────────────────────────────────────────────────────────
      // CONVERT DATA URLs TO ImageData
      // ───────────────────────────────────────────────────────────────────────
      // Chrome requires ImageData objects, not data URLs
      // We convert each size using our helper method
      await chrome.action.setIcon({
        imageData: {
          16: await this.dataUrlToImageData(icon.sizes[16]),
          48: await this.dataUrlToImageData(icon.sizes[48]),
          128: await this.dataUrlToImageData(icon.sizes[128])
        }
      });

      // ───────────────────────────────────────────────────────────────────────
      // UPDATE ACTIVE ICON
      // ───────────────────────────────────────────────────────────────────────
      // Update in-memory state
      this.activeIconId = iconId;
      
      // Save to storage so it persists across extension reloads
      await chrome.storage.local.set({
        [ICON_CONFIG.STORAGE_KEYS.ACTIVE_ICON]: iconId
      });

      logger.info('Icon applied successfully', { iconId });
    } catch (error) {
      logger.error('Failed to apply icon', error);
      throw error;
    }
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * CONVERT DATA URL TO ImageData
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Converts a data URL (string) to ImageData object that Chrome requires.
   * 
   * WHY THIS IS NEEDED:
   * chrome.action.setIcon() requires ImageData objects, not data URLs.
   * ImageData is a raw pixel buffer with width, height, and RGBA data.
   * 
   * CONVERSION PROCESS:
   * 1. Fetch the data URL (treat it as a network resource)
   * 2. Convert to Blob
   * 3. Create ImageBitmap from Blob
   * 4. Draw ImageBitmap to OffscreenCanvas
   * 5. Extract ImageData from canvas
   * 
   * WHY OffscreenCanvas:
   * Service workers don't have access to regular Canvas API (no DOM).
   * OffscreenCanvas is the service worker equivalent that works without DOM.
   * 
   * @async
   * @param {string} dataUrl - Data URL to convert (e.g., 'data:image/png;base64,...')
   * @returns {Promise<ImageData>} ImageData object for Chrome
   * @throws {Error} If conversion fails
   */
  async dataUrlToImageData(dataUrl) {
    try {
      // ───────────────────────────────────────────────────────────────────────
      // STEP 1: Fetch as Blob
      // ───────────────────────────────────────────────────────────────────────
      // fetch() can handle data URLs just like HTTP URLs
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // ───────────────────────────────────────────────────────────────────────
      // STEP 2: Create ImageBitmap
      // ───────────────────────────────────────────────────────────────────────
      // ImageBitmap is an efficient decoded image representation
      const imageBitmap = await createImageBitmap(blob);
      
      // ───────────────────────────────────────────────────────────────────────
      // STEP 3: Draw to OffscreenCanvas
      // ───────────────────────────────────────────────────────────────────────
      // Create canvas matching image dimensions
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');
      
      // Draw the image to canvas
      ctx.drawImage(imageBitmap, 0, 0);
      
      // ───────────────────────────────────────────────────────────────────────
      // STEP 4: Extract ImageData
      // ───────────────────────────────────────────────────────────────────────
      // Get raw pixel data from canvas
      return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
    } catch (error) {
      logger.error('Failed to convert data URL to ImageData', error);
      throw error;
    }
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * RESET TO DEFAULT ICON
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Switches back to the extension's default icon.
   * 
   * PROCESS:
   * 1. Call chrome.action.setIcon() with default icon paths
   * 2. Update activeIconId to 'default'
   * 3. Save to storage
   * 
   * DEFAULT ICON PATHS:
   * Defined in DEFAULTS.ICONS (config/defaults.js):
   * - 16: 'icons/icon16.png'
   * - 48: 'icons/icon48.png'
   * - 128: 'icons/icon128.png'
   * 
   * @async
   */
  async resetToDefault() {
    try {
      logger.info('Resetting to default icon');
      
      // ───────────────────────────────────────────────────────────────────────
      // SET DEFAULT ICON
      // ───────────────────────────────────────────────────────────────────────
      // Use path-based approach (Chrome loads from extension package)
      await chrome.action.setIcon({
        path: {
          16: DEFAULTS.ICONS[16],
          48: DEFAULTS.ICONS[48],
          128: DEFAULTS.ICONS[128]
        }
      });

      // ───────────────────────────────────────────────────────────────────────
      // UPDATE STATE
      // ───────────────────────────────────────────────────────────────────────
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

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * DELETE CUSTOM ICON
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Removes a custom icon from storage.
   * If the deleted icon is currently active, switches to default first.
   * 
   * PROCESS:
   * 1. Find icon in array
   * 2. If icon is active, reset to default
   * 3. Remove from array
   * 4. Save updated array to storage
   * 
   * @async
   * @param {string} iconId - ID of icon to delete
   * @throws {Error} If icon not found
   */
  async deleteIcon(iconId) {
    logger.info('deleteIcon called', { iconId });
    
    // ─────────────────────────────────────────────────────────────────────────
    // FIND ICON
    // ─────────────────────────────────────────────────────────────────────────
    const index = this.customIcons.findIndex(i => i.id === iconId);
    if (index === -1) {
      throw new Error('Icon not found');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SWITCH TO DEFAULT IF ACTIVE
    // ─────────────────────────────────────────────────────────────────────────
    // Can't delete an active icon - switch to default first
    if (this.activeIconId === iconId) {
      await this.resetToDefault();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REMOVE FROM ARRAY
    // ─────────────────────────────────────────────────────────────────────────
    this.customIcons.splice(index, 1);
    
    // ─────────────────────────────────────────────────────────────────────────
    // SAVE TO STORAGE
    // ─────────────────────────────────────────────────────────────────────────
    await chrome.storage.local.set({
      [ICON_CONFIG.STORAGE_KEYS.CUSTOM_ICONS]: this.customIcons
    });

    logger.info('Icon deleted', { iconId });
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * GET LIST OF CUSTOM ICONS
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Returns array of all custom icons.
   * Used by UI to display icon list.
   * 
   * @returns {Array<Object>} Array of icon objects
   */
  getIcons() {
    return this.customIcons;
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * GET ACTIVE ICON ID
   * ═════════════════════════════════════════════════════════════════════════
   * 
   * Returns ID of currently active icon ('default' or custom ID).
   * Used by UI to highlight active icon.
   * 
   * @returns {string} Active icon ID
   */
  getActiveIconId() {
    return this.activeIconId;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════
// Export a single instance (singleton pattern)
// This ensures only one IconManager exists across the entire extension
export const iconManager = new IconManager();