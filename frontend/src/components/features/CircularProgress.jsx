import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Progress from '../ui/Progress';

/**
 * CircularProgress Component - ATS Score circular progress display
 * @param {number} value - Progress value (0-100)
 * @param {string} label - Label text
 * @param {string} color - Color variant
 */
const CircularProgress = ({ value = 0, label, color = 'blue', size = 'lg' }) => {
  const sizeClass = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  }[size];

  const colorClass = {
    blue: 'from-blue-500 to-blue-400',
    green: 'from-green-500 to-green-400',
    purple: 'from-purple-500 to-purple-400',
  }[color];

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center justify-center relative ${sizeClass}`}
    >
      <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }}
        />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="text-center z-10">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold text-white"
        >
          {Math.round(value)}
        </motion.h3>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </motion.div>
  );
};

export default CircularProgress;
