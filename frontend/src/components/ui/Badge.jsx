import React from 'react';
import classNames from 'classnames';

/**
 * Badge Component - Status badges with multiple variants
 * @param {string} variant - 'default' | 'success' | 'warning' | 'error'
 * @param {React.ReactNode} icon - Icon element
 */
const Badge = ({ variant = 'default', icon, children, className = '' }) => {
  const variantClass = {
    default: 'badge',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    error: 'badge badge-error',
  }[variant];

  return (
    <span className={classNames(variantClass, className)}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
