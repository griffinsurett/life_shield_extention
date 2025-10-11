/**
 * Button Component
 * 
 * Polymorphic component that renders as <button> or <a> based on href.
 * Passes through all props including className.
 */

import { forwardRef } from 'react';

const Button = forwardRef(({ 
  href, 
  className = '', 
  children,
  ...props 
}, ref) => {
  // Render as anchor if href exists
  if (href) {
    return (
      <a 
        ref={ref} 
        href={href} 
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  // Otherwise render as button
  return (
    <button 
      ref={ref} 
      className={className}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;