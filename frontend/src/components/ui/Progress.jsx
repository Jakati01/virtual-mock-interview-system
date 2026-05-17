import React from 'react';
import classNames from 'classnames';

/**
 * Progress Component - Animated progress bar
 * @param {number} value - Progress value (0-100)
 * @param {string} color - Color variant
 */
const Progress = ({ value = 0, color = 'blue', label, showPercent = true }) => {
  const colorClass = {
    blue: 'from-blue-500 to-blue-400',
    green: 'from-green-500 to-green-400',
    purple: 'from-purple-500 to-purple-400',
    red: 'from-red-500 to-red-400',
  }[color];

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-300">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-blue-400">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div
          className={classNames('progress-fill', `bg-gradient-to-r ${colorClass}`)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;
