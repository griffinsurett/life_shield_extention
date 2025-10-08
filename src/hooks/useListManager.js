/**
 * List Manager Hook
 * 
 * Generic hook for managing lists of items (words, sites, phrases).
 * Handles adding, removing, and clearing items with validation.
 * 
 * Features:
 * - Input state management
 * - Add with validation and duplicate checking
 * - Remove by index
 * - Clear all with confirmation
 * - Toast notifications
 * - Configurable transforms and validation
 * 
 * @hook
 * @param {Array} items - Current items array
 * @param {Function} updateItems - Function to update items
 * @param {Object} options - Configuration options
 * @param {string} options.itemName - Name of item type (for messages)
 * @param {Function} options.transform - Function to transform input value
 * @param {Function} options.validate - Function to validate input value
 * @param {boolean} options.duplicateCheck - Whether to check for duplicates
 * @returns {Object} Object with input state and management functions
 */

import { useState } from "react";
import { useToast } from "../components/ToastContainer";

export const useListManager = (items = [], updateItems, options = {}) => {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState("");

  // Extract options with defaults
  const {
    itemName = "item",
    transform = (val) => val.trim().toLowerCase(), // Default: trim and lowercase
    validate = (val) => !!val, // Default: check if not empty
    duplicateCheck = true, // Default: check for duplicates
  } = options;

  /**
   * Add new item to list
   * Transforms, validates, and checks for duplicates before adding
   */
  const addItem = async () => {
    // Transform input (e.g., lowercase, trim)
    const newItem = transform(inputValue);

    // Validate input
    if (!validate(newItem)) {
      showToast(`Please enter a ${itemName}`, "error");
      return;
    }

    // Check for duplicates if enabled
    if (duplicateCheck && items.includes(newItem)) {
      showToast(
        `${
          itemName.charAt(0).toUpperCase() + itemName.slice(1)
        } already exists`,
        "error"
      );
      return;
    }

    // Add to list
    await updateItems([...items, newItem]);
    
    // Clear input
    setInputValue("");
    
    showToast(`Added "${newItem}"`, "success");
  };

  /**
   * Remove item from list by index
   * 
   * @param {number} index - Index of item to remove
   */
  const removeItem = async (index) => {
    const item = items[index];
    const newItems = [...items];
    newItems.splice(index, 1);
    
    await updateItems(newItems);
    
    showToast(`Removed "${item}"`, "success");
  };

  /**
   * Clear all items from list
   * Shows confirmation dialog first
   * 
   * @param {string} confirmMessage - Optional custom confirmation message
   */
  const clearAll = async (confirmMessage) => {
    if (!confirm(confirmMessage || `Remove all ${itemName}s?`)) return;
    
    await updateItems([]);
    
    showToast(`All ${itemName}s cleared`, "success");
  };

  return {
    inputValue,
    setInputValue,
    addItem,
    removeItem,
    clearAll,
  };
};