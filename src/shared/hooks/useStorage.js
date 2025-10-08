import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.get([key]).then((result) => {
      setValue(result[key] ?? defaultValue);
      setLoading(false);
    });

    const listener = (changes, namespace) => {
      if (namespace === 'sync' && changes[key]) {
        setValue(changes[key].newValue ?? defaultValue);
      }
    };

    storage.onChanged(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key, defaultValue]);

  const updateValue = async (newValue) => {
    await storage.set({ [key]: newValue });
    setValue(newValue);
  };

  return [value, updateValue, loading];
};