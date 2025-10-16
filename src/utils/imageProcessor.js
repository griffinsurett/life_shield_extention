/**
 * Image Processing Utilities
 * 
 * Handles image resizing, format conversion, and optimization.
 * Specialized for processing custom extension icons.
 * 
 * CRITICAL: UI Context Only
 * - Uses Canvas API (not available in service worker)
 * - Uses FileReader API (not available in service worker)
 * - Uses Image element (not available in service worker)
 * - Must run in popup/settings/content script
 * 
 * Why image processing:
 * - Chrome requires multiple icon sizes (16, 48, 128)
 * - Users upload various formats (PNG, JPG, SVG)
 * - Need consistent sizes for quality
 * - SVG must be converted to PNG
 * 
 * Process flow:
 * 1. User uploads image in UI
 * 2. Validate format and size
 * 3. Process in UI context (this module)
 * 4. Generate all required sizes
 * 5. Convert to data URLs
 * 6. Send processed data to background
 * 7. Background stores and applies
 * 
 * Supported formats:
 * - SVG (vector, scalable)
 * - PNG (lossless, transparent)
 * - JPG/JPEG (lossy, no transparency)
 * - WebP (modern, efficient)
 * - ICO (Windows icons)
 * 
 * @module utils/imageProcessor
 */

import { ICON_CONFIG, ICON_VALIDATION } from '../config/icons';

/**
 * Image Processor object
 * 
 * Collection of image processing functions.
 * Organized as object for namespace clarity.
 */
export const ImageProcessor = {
  /**
   * Process an uploaded file and generate all required icon sizes
   * 
   * Main entry point for icon processing.
   * Handles complete workflow from file to processed icons.
   * 
   * Process:
   * 1. Validate file format
   * 2. Validate file size
   * 3. Read file as data URL
   * 4. Determine processing method (SVG vs raster)
   * 5. Generate each required size (16, 48, 128)
   * 6. Return all sizes + metadata
   * 
   * Validation:
   * - Format: Must be supported type
   * - Size: Must be under 2MB
   * - Throws errors if validation fails
   * 
   * Returns object with:
   * - originalDataUrl: Original file as data URL
   * - type: File type (png, svg, etc)
   * - sizes: Object with 16/48/128 data URLs
   * 
   * @param {File} file - Uploaded file from input
   * @returns {Promise<Object>} Processed icon data
   * @throws {Error} If validation fails
   * 
   * @example
   * // In React component
   * const handleUpload = async (e) => {
   *   const file = e.target.files[0];
   *   try {
   *     const processed = await ImageProcessor.processIconFile(file);
   *     // Send to background for storage
   *     chrome.runtime.sendMessage({
   *       action: 'saveIcon',
   *       iconData: processed
   *     });
   *   } catch (error) {
   *     showToast(error.message, 'error');
   *   }
   * };
   */
  async processIconFile(file) {
    /**
     * Validate file format
     * 
     * Checks against SUPPORTED_FORMATS from config.
     * Throws descriptive error if invalid.
     */
    if (!ICON_VALIDATION.validateFormat(file.type)) {
      throw new Error(ICON_VALIDATION.getErrorMessage('format'));
    }

    /**
     * Validate file size
     * 
     * Checks against MAX_FILE_SIZE from config.
     * Prevents memory issues and slow processing.
     */
    if (!ICON_VALIDATION.validateSize(file.size)) {
      throw new Error(ICON_VALIDATION.getErrorMessage('size'));
    }

    /**
     * Read file as data URL
     * 
     * Data URL format: data:image/png;base64,{encoded data}
     * Benefits:
     * - Embeds image in string
     * - No external files needed
     * - Works in chrome.action.setIcon()
     */
    const dataUrl = await this.readFileAsDataUrl(file);

    /**
     * Generate all required sizes
     * 
     * Chrome extension icons need:
     * - 16px: Toolbar icon
     * - 48px: Extension management
     * - 128px: Store listing
     * 
     * Process depends on file type:
     * - SVG: Convert to PNG for each size
     * - Raster: Resize to each size
     */
    const sizes = {};

    if (file.type === 'image/svg+xml') {
      /**
       * SVG processing
       * 
       * SVG is vector, can scale to any size.
       * Chrome needs PNG, so convert each size.
       */
      for (const size of ICON_CONFIG.SIZES) {
        sizes[size] = await this.svgToPng(dataUrl, size);
      }
    } else {
      /**
       * Raster image processing
       * 
       * Already PNG/JPG/WebP, just resize.
       */
      for (const size of ICON_CONFIG.SIZES) {
        sizes[size] = await this.resizeImage(dataUrl, size);
      }
    }

    /**
     * Return processed data
     * 
     * Structure:
     * {
     *   originalDataUrl: string,    // Original file
     *   type: string,                // File extension (png, svg, etc)
     *   sizes: {                     // All sizes as data URLs
     *     16: string,
     *     48: string,
     *     128: string
     *   }
     * }
     */
    return {
      originalDataUrl: dataUrl,
      type: file.type.split('/')[1],  // Extract extension from MIME
      sizes
    };
  },

  /**
   * Read file as data URL
   * 
   * Converts File object to data URL string.
   * Uses FileReader API (async).
   * 
   * Data URL format:
   * - data:{mimeType};base64,{encoded data}
   * - Example: data:image/png;base64,iVBORw0KG...
   * 
   * Why data URLs:
   * - Embeds image in string
   * - No network requests
   * - Works in chrome.action.setIcon()
   * - Can be stored in chrome.storage
   * 
   * @param {File} file - File to read
   * @returns {Promise<string>} Data URL
   * @throws {Error} If file read fails
   * 
   * @private
   */
  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      /**
       * Success handler
       * 
       * reader.result contains data URL.
       * Resolve promise with URL.
       */
      reader.onload = (e) => resolve(e.target.result);
      
      /**
       * Error handler
       * 
       * File reading can fail due to:
       * - Permissions
       * - Corrupted file
       * - Browser limits
       */
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      /**
       * Start reading
       * 
       * readAsDataURL triggers load/error event.
       */
      reader.readAsDataURL(file);
    });
  },

  /**
   * Convert SVG to PNG at specific size
   * 
   * Process:
   * 1. Create Image element
   * 2. Load SVG data URL
   * 3. Create Canvas at target size
   * 4. Draw image centered and scaled
   * 5. Export Canvas to PNG data URL
   * 
   * Why convert SVG to PNG:
   * - Chrome extension icon API requires PNG/JPG
   * - SVG not supported in chrome.action.setIcon()
   * - PNG provides consistent rendering
   * 
   * Scaling:
   * - Maintains aspect ratio
   * - Centers in square canvas
   * - Fills as much as possible
   * 
   * @param {string} svgDataUrl - SVG as data URL
   * @param {number} size - Target size (16, 48, or 128)
   * @returns {Promise<string>} PNG as data URL
   * @throws {Error} If conversion fails
   * 
   * @private
   */
  svgToPng(svgDataUrl, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      /**
       * Image load handler
       * 
       * Fires when SVG successfully loaded.
       * Now we can draw it to canvas.
       */
      img.onload = () => {
        /**
         * Create canvas at target size
         * 
         * Canvas is square (size x size).
         * Ensures icon is square as required.
         */
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        /**
         * Clear canvas (transparent background)
         * 
         * Important for PNG transparency.
         * Allows icon to show on any background.
         */
        ctx.clearRect(0, 0, size, size);
        
        /**
         * Calculate scaling and centering
         * 
         * Goals:
         * - Maintain aspect ratio
         * - Fill canvas as much as possible
         * - Center image
         * 
         * scale: Smaller of (targetWidth/imgWidth, targetHeight/imgHeight)
         * x, y: Center offsets
         */
        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        
        /**
         * Draw image scaled and centered
         * 
         * Parameters:
         * - img: Image to draw
         * - x, y: Top-left corner
         * - width, height: Scaled dimensions
         */
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        /**
         * Export canvas to PNG data URL
         * 
         * toDataURL() returns:
         * - data:image/png;base64,{data}
         * - PNG format (lossless)
         * - Includes transparency
         */
        resolve(canvas.toDataURL('image/png'));
      };
      
      /**
       * Error handler
       * 
       * Image loading can fail due to:
       * - Malformed SVG
       * - Browser compatibility
       * - Memory limits
       */
      img.onerror = () => reject(new Error('Failed to convert SVG'));
      
      /**
       * Start loading SVG
       * 
       * Setting src triggers load/error event.
       */
      img.src = svgDataUrl;
    });
  },

  /**
   * Resize raster image to specific size
   * 
   * Similar to svgToPng but for PNG/JPG/WebP.
   * 
   * Process:
   * 1. Load image from data URL
   * 2. Create canvas at target size
   * 3. Clear with transparency
   * 4. Calculate scaling and centering
   * 5. Draw scaled image
   * 6. Export to PNG
   * 
   * Differences from svgToPng:
   * - Input is already raster (not vector)
   * - May lose quality if upscaling
   * - Always outputs PNG regardless of input
   * 
   * Quality considerations:
   * - Downscaling: Good quality
   * - Upscaling: May look pixelated
   * - Recommend uploading large images
   * 
   * @param {string} dataUrl - Image as data URL
   * @param {number} size - Target size (16, 48, or 128)
   * @returns {Promise<string>} Resized PNG as data URL
   * @throws {Error} If resize fails
   * 
   * @private
   */
  resizeImage(dataUrl, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Create square canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, size, size);
        
        // Calculate scaling and centering (same as SVG)
        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        
        // Draw scaled and centered
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Export as PNG
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => reject(new Error('Failed to resize image'));
      
      // Start loading
      img.src = dataUrl;
    });
  }
};