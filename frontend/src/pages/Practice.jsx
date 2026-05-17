import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '../components/layout';
import { QuestionCard, Timer } from '../components/features';
import { Button, Card, Input, Spinner } from '../components/ui';
import { useAuthStore } from '../store';

/**
 * Practice Arena - MCQ Round
 */
const McqRound = () => {
  const user = useAuthStore((state) => state.user);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 1,
      question: 'What is the time complexity of binary search?',
      category: 'DSA',
      difficulty: 'easy',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
      correct: 1,
    },
    {
      id: 2,
      question: 'Which design pattern is used in React for component composition?',
      category: 'React',
      difficulty: 'medium',
      options: ['Factory', 'Observer', 'Component', 'Singleton'],
      correct: 2,
    },
    {
      id: 3,
      question: 'What is the difference between async/await and Promises?',
      category: 'JavaScript',
      difficulty: 'medium',
      options: ['No difference', 'async/await is older', 'async/await is syntactic sugar', 'Promises are faster'],
      correct: 2,
    },
  ];

  const logout = useAuthStore((state) => state.logout);

  const handleSelectAnswer = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Navigate to results
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const question = questions[currentQuestion];
  const selectedAnswer = answers[question.id];

  return (
    <MainLayout user={user} onLogout={logout}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">MCQ Round - Programming</h1>
          <Timer duration={1800} showWarning={true} />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Question {currentQuestion + 1}/{questions.length}</span>
            <span className="text-blue-400">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="space-y-6">
          {/* Question Text */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">{question.question}</h2>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300">{question.category}</span>
              <span className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-300">{question.difficulty}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === idx
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    selectedAnswer === idx ? 'border-blue-500 bg-blue-500' : 'border-white/30'
                  }`}>
                    {selectedAnswer === idx && <span className="text-white font-bold">✓</span>}
                  </div>
                  <span className="text-white">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  idx === currentQuestion
                    ? 'bg-blue-500 text-white'
                    : answers[questions[idx].id] !== undefined
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            onClick={handleNext}
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default McqRound;
