import { forwardRef } from 'react';

export const Button = forwardRef(function Button({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) {
  return (
    <button ref={ref} className={`button button-${variant} button-${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
});
