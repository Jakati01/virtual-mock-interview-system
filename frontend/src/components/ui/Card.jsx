import React from 'react';
import classNames from 'classnames';

/**
 * Card Component - Glassmorphism card with multiple variants
 * @param {string} variant - 'default' | 'elevated' | 'outlined'
 * @param {React.ReactNode} children - Card content
 */
const Card = React.forwardRef(({
  variant = 'default',
  className = '',
  children,
  ...props
}, ref) => {
  const variantClass = {
    default: 'glass-card',
    elevated: 'glass-card shadow-glow',
    outlined: 'border border-white/10 rounded-2xl',
  }[variant];

  return (
    <div
      ref={ref}
      className={classNames(variantClass, 'p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
