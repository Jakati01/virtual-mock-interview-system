import React from 'react';

/**
 * Skeleton Component - Loading skeleton for content
 */
const Skeleton = ({ className = '', count = 1, width = '100%', height = '1rem' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{ width, height }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
