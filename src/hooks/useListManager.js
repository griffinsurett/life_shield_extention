/**
 * List Manager Hook
 * 
 * Generic hook for managing lists of items (words, sites, phrases).
 * Handles adding, removing, and clearing items with validation.
 * Now supports optional confirmation before adding.
 * 
 * Features:
 * - Input state management
 * - Add with validation and duplicate checking
 * - Optional confirmation modal before adding
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
 * @param {boolean} options.requireConfirmation - Whether to require confirmation before adding
 * @param {Function} options.getConfirmMessage - Function to get confirmation message
 * @returns {Object} Object with input state and management functions
 */

import { useState } from "react";
import { useToast } from "../components/ToastContainer";

export const useListManager = (items = [], updateItems, options = {}) => {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [pendingItem, setPendingItem] = useState(null);

  // Extract options with defaults
  const {
    itemName = "item",
    transform = (val) => val.trim().toLowerCase(),
    validate = (val) => !!val,
    duplicateCheck = true,
    requireConfirmation = false,
    getConfirmMessage = (item) => `Are you sure you want to block "${item}"?`,
  } = options;

  /**
   * Add new item to list
   * Validates and optionally shows confirmation before adding
   * 
   * @param {Function} onConfirm - Optional callback for confirmation flow
   */
  const addItem = async (onConfirm) => {
    // Transform input
    const newItem = transform(inputValue);

    // Validate input
    if (!validate(newItem)) {
      showToast(`Please enter a ${itemName}`, "error");
      return;
    }

    // Check for duplicates if enabled
    if (duplicateCheck && items.includes(newItem)) {
      showToast(
        `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} already exists`,
        "error"
      );
      return;
    }

    // If confirmation required, store pending item and trigger callback
    if (requireConfirmation && onConfirm) {
      setPendingItem(newItem);
      onConfirm({
        title: `Block ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}?`,
        message: getConfirmMessage(newItem),
        confirmText: `Yes, Block ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`,
        cancelText: "Cancel",
        confirmColor: "red",
        onConfirm: () => confirmAdd(newItem)
      });
      return;
    }

    // Otherwise add immediately
    await performAdd(newItem);
  };

  /**
   * Confirm and add the pending item
   * Called after user confirms in modal
   */
  const confirmAdd = async (item) => {
    await performAdd(item || pendingItem);
    setPendingItem(null);
  };

  /**
   * Actually perform the add operation
   * Internal method called after validation/confirmation
   */
  const performAdd = async (item) => {
    await updateItems([...items, item]);
    setInputValue("");
    showToast(`Added "${item}"`, "success");
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
    pendingItem,
  };
};