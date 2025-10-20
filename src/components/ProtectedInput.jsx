/**
 * Protected Input Component
 * 
 * Special input field that accepts user typing but returns hashed values.
 * Used for protected content (blocked words/sites).
 * 
 * Exposes methods via ref:
 * - getHashedValue(): Returns SHA-256 hash of current input
 * - clear(): Clears the input
 * 
 * @component
 */

import { useState, useImperativeHandle, forwardRef } from 'react';
import { useProtected } from '../contexts/ProtectedContext';
import Input from '../components/Inputs/Input';

const ProtectedInput = forwardRef(({ 
  placeholder = "Enter protected content...",
  className = "",
  ...props 
}, ref) => {
  const [value, setValue] = useState('');
  const { hashString } = useProtected();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    /**
     * Get hashed value of current input
     * @returns {Promise<string>} SHA-256 hash
     */
    getHashedValue: async () => {
      return await hashString(value);
    },
    
    /**
     * Clear the input field
     */
    clear: () => {
      setValue('');
    },
    
    /**
     * Get raw value (for validation)
     * @returns {string} Current input value
     */
    getValue: () => {
      return value;
    }
  }));

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
});

ProtectedInput.displayName = 'ProtectedInput';

export default ProtectedInput;