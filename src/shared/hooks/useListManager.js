import { useState } from 'react';
import { useToast } from '../components/ToastContainer';

export const useListManager = (
  items = [], 
  updateItems, 
  options = {}
) => {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState('');
  
  const {
    itemName = 'item',
    transform = (val) => val.trim().toLowerCase(),
    validate = (val) => !!val,
    duplicateCheck = true
  } = options;

  const addItem = async () => {
    const newItem = transform(inputValue);
    
    if (!validate(newItem)) {
      showToast(`Please enter a ${itemName}`, 'error');
      return;
    }

    if (duplicateCheck && items.includes(newItem)) {
      showToast(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} already exists`, 'error');
      return;
    }

    await updateItems([...items, newItem]);
    setInputValue('');
    showToast(`Added "${newItem}"`, 'success');
  };

  const removeItem = async (index) => {
    const item = items[index];
    const newItems = [...items];
    newItems.splice(index, 1);
    await updateItems(newItems);
    showToast(`Removed "${item}"`, 'success');
  };

  const clearAll = async (confirmMessage) => {
    if (!confirm(confirmMessage || `Remove all ${itemName}s?`)) return;
    await updateItems([]);
    showToast(`All ${itemName}s cleared`, 'success');
  };

  return {
    inputValue,
    setInputValue,
    addItem,
    removeItem,
    clearAll
  };
};