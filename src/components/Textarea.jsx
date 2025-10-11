/**
 * Textarea Component
 * 
 * Multi-line text input that passes through all props.
 */

import { forwardRef } from 'react';

const Textarea = forwardRef(({ 
  className = '',
  rows = 4,
  ...props 
}, ref) => {
  return (
    <textarea 
      ref={ref}
      rows={rows}
      className={className}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;