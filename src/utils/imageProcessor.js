/**
 * Image Processing Utilities
 * 
 * Handles image resizing and format conversion in the UI context.
 * Cannot be used in service worker (no DOM APIs available).
 * 
 * @module utils/imageProcessor
 */

import { ICON_CONFIG, ICON_VALIDATION } from '../config/icons';

export const ImageProcessor = {
  /**
   * Process an uploaded file and generate all required icon sizes
   */
  async processIconFile(file) {
    // Validate file format
    if (!ICON_VALIDATION.validateFormat(file.type)) {
      throw new Error(ICON_VALIDATION.getErrorMessage('format'));
    }

    // Validate file size
    if (!ICON_VALIDATION.validateSize(file.size)) {
      throw new Error(ICON_VALIDATION.getErrorMessage('size'));
    }

    // Read file as data URL
    const dataUrl = await this.readFileAsDataUrl(file);

    // Generate all required sizes
    const sizes = {};

    if (file.type === 'image/svg+xml') {
      // Convert SVG to PNG for each size
      for (const size of ICON_CONFIG.SIZES) {
        sizes[size] = await this.svgToPng(dataUrl, size);
      }
    } else {
      // Resize raster images
      for (const size of ICON_CONFIG.SIZES) {
        sizes[size] = await this.resizeImage(dataUrl, size);
      }
    }

    return {
      originalDataUrl: dataUrl,
      type: file.type.split('/')[1],
      sizes
    };
  },

  /**
   * Read file as data URL
   */
  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Convert SVG to PNG
   */
  svgToPng(svgDataUrl, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Fill with transparent background
        ctx.clearRect(0, 0, size, size);
        
        // Draw image centered and scaled
        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to convert SVG'));
      img.src = svgDataUrl;
    });
  },

  /**
   * Resize image to specific size
   */
  resizeImage(dataUrl, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Fill with transparent background
        ctx.clearRect(0, 0, size, size);
        
        // Draw with proper aspect ratio
        const scale = Math.min(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to resize image'));
      img.src = dataUrl;
    });
  }
};