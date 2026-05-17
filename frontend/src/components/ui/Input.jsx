import React from 'react';
import classNames from 'classnames';

/**
 * Input Component - Glassmorphism input field
 * @param {string} type - HTML input type
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {React.ReactNode} icon - Icon element
 */
const Input = React.forwardRef(({
  type = 'text',
  label,
  error,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={classNames(
            'glass-input',
            icon && 'pl-12',
            error && 'border-red-500/50 focus:ring-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
