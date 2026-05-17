import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Timer Component - Countdown timer with animations
 */
const Timer = ({ duration = 300, onTimeUp, showWarning = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60 && showWarning;
  const isAlert = timeLeft < 30;

  const colors = isAlert ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400';
  const bgColor = isAlert ? 'bg-red-500/10' : isWarning ? 'bg-yellow-500/10' : 'bg-green-500/10';

  return (
    <motion.div
      animate={isAlert ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isAlert ? Infinity : 0 }}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 ${bgColor}`}
    >
      <svg className={`w-5 h-5 ${colors}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 9.414V6z" clipRule="evenodd" />
      </svg>
      <span className={`font-mono text-lg font-bold ${colors}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  );
};

export default Timer;
