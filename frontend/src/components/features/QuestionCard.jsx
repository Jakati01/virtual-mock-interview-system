import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

/**
 * QuestionCard Component - Display interview questions
 */
const QuestionCard = ({
  number,
  question,
  category,
  difficulty,
  isAnswered,
  isCurrentQuestion,
  onClick,
}) => {
  const difficultyColor = {
    easy: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    hard: 'text-red-400 bg-red-500/10',
  }[difficulty];

  return (
    <motion.button
      whileHover={{ translateY: -3 }}
      onClick={onClick}
      className={`w-full text-left transition-all ${isCurrentQuestion ? 'ring-2 ring-blue-500' : ''}`}
    >
      <Card className={`${isCurrentQuestion ? 'border-blue-500/50 bg-blue-500/10' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-white font-semibold mb-1">Question {number}</h4>
            <p className="text-gray-300 text-sm line-clamp-2">{question}</p>
          </div>
          {isAnswered && (
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-300">
            {category}
          </span>
          <span className={`text-xs px-2 py-1 rounded font-medium ${difficultyColor}`}>
            {difficulty}
          </span>
        </div>
      </Card>
    </motion.button>
  );
};

export default QuestionCard;
