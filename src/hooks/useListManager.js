/**
 * List Manager Hook
 * 
 * Generic hook for managing lists of items (words, sites, phrases).
 * Handles adding, removing, and clearing items with validation.
 * Now supports optional confirmation before adding AND clearing.
 * 
 * @hook
 */

import { useState, useCallback } from "react";
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
  const addItem = useCallback(async (onConfirm) => {
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
  }, [inputValue, items, transform, validate, duplicateCheck, requireConfirmation, itemName, getConfirmMessage, showToast]);

  /**
   * Confirm and add the pending item
   * Called after user confirms in modal
   */
  const confirmAdd = useCallback(async (item) => {
    await performAdd(item || pendingItem);
    setPendingItem(null);
  }, [pendingItem, updateItems, showToast]);

  /**
   * Actually perform the add operation
   * Internal method called after validation/confirmation
   */
  const performAdd = useCallback(async (item) => {
    await updateItems([...items, item]);
    setInputValue("");
    showToast(`Added "${item}"`, "success");
  }, [items, updateItems, showToast]);

  /**
   * Remove item from list by index
   * 
   * @param {number} index - Index of item to remove
   */
  const removeItem = useCallback(async (index) => {
    const item = items[index];
    const newItems = [...items];
    newItems.splice(index, 1);
    
    await updateItems(newItems);
    
    showToast(`Removed "${item}"`, "success");
  }, [items, updateItems, showToast]);

  /**
   * Clear all items from list
   * Now uses confirmation callback instead of window.confirm
   * 
   * @param {Function} onConfirm - Confirmation callback
   * @param {string} customMessage - Optional custom confirmation message
   */
  const clearAll = useCallback((onConfirm, customMessage) => {
    if (!onConfirm) {
      console.error('clearAll requires onConfirm callback');
      return;
    }

    onConfirm({
      title: `Clear All ${itemName}s?`,
      message: customMessage || `Are you sure you want to remove all ${itemName}s? This action cannot be undone.`,
      confirmText: `Yes, Clear All`,
      cancelText: "Cancel",
      confirmColor: "red",
      onConfirm: async () => {
        await updateItems([]);
        showToast(`All ${itemName}s cleared`, "success");
      }
    });
  }, [itemName, updateItems, showToast]);

  return {
    inputValue,
    setInputValue,
    addItem,
    removeItem,
    clearAll,
    pendingItem,
  };
};