import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

/**
 * StatCard Component - Display statistics with icons and trends
 * @param {string} title - Card title
 * @param {string|number} value - Main stat value
 * @param {string} unit - Unit of measurement
 * @param {number} trend - Trend percentage (positive or negative)
 * @param {React.ReactNode} icon - Icon element
 */
const StatCard = ({ title, value, unit, trend, icon, color = 'blue' }) => {
  const colorClass = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  }[color];

  const trendColor = trend >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <motion.div
      whileHover={{ translateY: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden group">
        {/* Background glow effect */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-all ${colorClass}`} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-white">
                {value}
                {unit && <span className="text-lg text-gray-400 ml-1">{unit}</span>}
              </h3>
            </div>
            {icon && (
              <div className={`text-4xl ${colorClass}`}>
                {icon}
              </div>
            )}
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${trendColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={trend >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6'}
                />
              </svg>
              <span className={`text-sm font-medium ${trendColor}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
