/**
 * File Operations Hook
 * 
 * Provides functions for importing and exporting data as JSON files.
 * Used for backing up and restoring blocked words/sites.
 * 
 * Features:
 * - Export array to JSON file
 * - Import JSON file to array
 * - Toast notifications for feedback
 * - Error handling
 * 
 * @hook
 * @returns {Object} Object with exportToFile and importFromFile functions
 */

import { useToast } from "../components/ToastContainer";

export const useFileOperations = () => {
  const { showToast } = useToast();

  /**
   * Export data to JSON file
   * Creates download link and triggers download
   * 
   * @param {Array} data - Data to export
   * @param {string} filename - Name for downloaded file
   * @param {string} itemName - Name of items for toast message (default: 'data')
   */
  const exportToFile = (data, filename, itemName = "data") => {
    // Convert to formatted JSON
    const dataStr = JSON.stringify(data, null, 2);
    
    // Create blob and download link
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    
    // Trigger download
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    showToast("Exported successfully!", "success");
  };

  /**
   * Import data from JSON file
   * Opens file picker and reads selected file
   * 
   * @param {Function} onSuccess - Called with imported data array
   * @param {string} itemName - Name of items for toast messages (default: 'items')
   * @returns {Promise<Array|null>} Imported data or null if failed/cancelled
   */
  const importFromFile = async (onSuccess, itemName = "items") => {
    return new Promise((resolve) => {
      // Create hidden file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      
      // Handle file selection
      input.onchange = async (e) => {
        const file = e.target.files[0];
        
        // No file selected
        if (!file) {
          resolve(null);
          return;
        }

        // Read file as text
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            // Parse JSON
            const data = JSON.parse(event.target.result);
            
            // Validate: must be an array
            if (!Array.isArray(data)) {
              showToast("Invalid file format", "error");
              resolve(null);
              return;
            }

            // Call success handler
            await onSuccess(data);
            
            showToast(`Imported ${data.length} ${itemName}!`, "success");
            resolve(data);
          } catch (_err) {
            showToast("Error reading file", "error");
            resolve(null);
          }
        };
        
        reader.readAsText(file);
      };
      
      // Trigger file picker
      input.click();
    });
  };

  return { exportToFile, importFromFile };
};