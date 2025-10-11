/**
 * Input Component
 * 
 * Text input wrapper that passes through all props.
 * Supports all input types (text, email, password, etc.)
 */

import { forwardRef } from 'react';

const Input = forwardRef(({ 
  className = '', 
  type = 'text',
  ...props 
}, ref) => {
  return (
    <input 
      ref={ref} 
      type={type}
      className={className}
      {...props} 
    />
  );
});

Input.displayName = 'Input';
export default Input;