import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

/**
 * FeedbackCard Component - Display feedback with icon and color coding
 */
const FeedbackCard = ({ type = 'strength', title, description, icon }) => {
  const styleClass = {
    strength: 'border-green-500/30 bg-green-500/5',
    improvement: 'border-yellow-500/30 bg-yellow-500/5',
    weakness: 'border-red-500/30 bg-red-500/5',
  }[type];

  const iconBgClass = {
    strength: 'bg-green-500/20 text-green-400',
    improvement: 'bg-yellow-500/20 text-yellow-400',
    weakness: 'bg-red-500/20 text-red-400',
  }[type];

  const titleClass = {
    strength: 'text-green-300',
    improvement: 'text-yellow-300',
    weakness: 'text-red-300',
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border rounded-xl p-4 ${styleClass}`}
    >
      <div className="flex gap-3">
        {icon && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h4 className={`font-semibold ${titleClass} mb-1`}>{title}</h4>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackCard;
