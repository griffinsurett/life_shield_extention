// src/hooks/useListManager.js
import { useState, useCallback } from "react";
import { useToast } from "../components/ToastContainer";

export const useListManager = (items = [], updateItems, options = {}) => {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState("");

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
   * Now handles both direct add and confirmation flow
   */
  const addItem = useCallback((showConfirmation) => {
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

    // If confirmation required and showConfirmation function provided
    if (requireConfirmation && showConfirmation) {
      showConfirmation({
        title: `Block ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}?`,
        message: getConfirmMessage(newItem),
        confirmText: `Yes, Block ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`,
        cancelText: "Cancel",
        confirmColor: "red",
        onConfirm: async () => {
          // Perform the add
          try {
            await updateItems([...items, newItem]);
            setInputValue("");
            showToast(`Blocked "${newItem}"`, "success");
          } catch (error) {
            console.error("Error adding item:", error);
            showToast(`Failed to add ${itemName}`, "error");
          }
        }
      });
    } else {
      // Add immediately without confirmation
      performAdd(newItem);
    }
  }, [inputValue, items, transform, validate, duplicateCheck, requireConfirmation, itemName, getConfirmMessage, showToast, updateItems]);

  /**
   * Actually perform the add operation
   */
  const performAdd = useCallback(async (item) => {
    try {
      await updateItems([...items, item]);
      setInputValue("");
      showToast(`Blocked "${item}"`, "success");
    } catch (error) {
      console.error("Error adding item:", error);
      showToast(`Failed to add ${itemName}`, "error");
    }
  }, [items, updateItems, showToast, itemName]);

  /**
   * Remove item from list by index
   */
  const removeItem = useCallback(async (index) => {
    try {
      const item = items[index];
      const newItems = [...items];
      newItems.splice(index, 1);
      
      await updateItems(newItems);
      showToast(`Removed "${item}"`, "success");
    } catch (error) {
      console.error("Error removing item:", error);
      showToast(`Failed to remove ${itemName}`, "error");
    }
  }, [items, updateItems, showToast, itemName]);

  /**
   * Clear all items from list
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
        try {
          await updateItems([]);
          showToast(`All ${itemName}s cleared`, "success");
        } catch (error) {
          console.error("Error clearing items:", error);
          showToast(`Failed to clear ${itemName}s`, "error");
        }
      }
    });
  }, [itemName, updateItems, showToast]);

  return {
    inputValue,
    setInputValue,
    addItem,
    removeItem,
    clearAll,
  };
};