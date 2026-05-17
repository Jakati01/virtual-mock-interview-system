import React from 'react';
import classNames from 'classnames';

/**
 * Button Component - Premium button with multiple variants
 * Supports primary, secondary, and ghost variants
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'icon'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} loading - Show loading state
 * @param {React.ReactNode} children - Button content
 */
const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClass = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }[size];

  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    icon: 'btn-icon',
  }[variant];

  return (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={classNames(variantClass, baseClass, className)}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
