import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, Progress, Spinner, Button } from '../components/ui';
import API_BASE_URL from '../api';

/**
 * ROUND 1: JD-SCREENING (STRICT MODE)
 * The "Pressure Cooker"
 * 20 Tech MCQs (45s each) + 10 Aptitude MCQs (60s each)
 * Negative marking handled by backend.
 */
const JDScreeningRound = ({ userId, onRoundComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // Fetch Questions from the new Strict Mode API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interview/round1/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            user_id: userId,
            job_description: "Seeking a Full Stack Developer with strong skills in React, Python, FastAPI, and PostgreSQL. Must understand system design and performance optimization.", // In a real app, pass this from previous screen
            domain: "Full Stack Development"
          }),
        });

        const data = await response.json();
        
        // Flatten technical and aptitude into one continuous array of 30 questions
        const techQuestions = data.technical.map(q => ({ ...q, is_aptitude: false }));
        const aptQuestions = data.aptitude.map(q => ({ ...q, is_aptitude: true }));
        const allQuestions = [...techQuestions, ...aptQuestions];
        
        setQuestions(allQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to load the exam. Please check your connection.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [userId]);

  const currentQuestion = questions[currentIndex];

  // The Strict Timer Engine
  useEffect(() => {
    if (!examStarted || !currentQuestion || submitting) return;

    // Reset timer when question changes
    setTimeLeft(currentQuestion.is_aptitude ? 60 : 45);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut(); // Auto-skip when timer hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, examStarted, currentQuestion, submitting]);

  const handleTimeOut = () => {
    saveAnswerAndNext(null); // Save as unanswered
  };

  const handleOptionClick = (selectedOption) => {
    saveAnswerAndNext(selectedOption);
  };

  const saveAnswerAndNext = async (selectedOption) => {
    const answerRecord = {
      question_id: currentQuestion.id,
      is_aptitude: currentQuestion.is_aptitude,
      selected_answer: selectedOption,
      correct_answer: currentQuestion.correct_answer
    };

    const newAnswers = [...answers, answerRecord];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await submitFinalExam(newAnswers);
    }
  };

  const submitFinalExam = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/interview/round1/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          answers: finalAnswers
        }),
      });

      const result = await response.json();
      
      if (result.passed) {
        // Move to Round 2, passing the final score
        onRoundComplete(result.metrics.score);
      } else {
        alert(`You did not meet the minimum threshold.\nScore: ${result.metrics.score}\nCorrect: ${result.metrics.correct}\nWrong: ${result.metrics.wrong}`);
        window.location.href = '/dashboard'; // Kick them out if they fail
      }
    } catch (error) {
      console.error('Submit Error:', error);
      alert('Failed to submit exam.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 ml-4 font-mono">Analyzing JD & Generating Questions...</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-dark-900 p-6 flex items-center justify-center">
        <Card className="max-w-xl w-full p-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-red-500"> MCQ </h2>
          <p className="text-gray-300">You are about to start Round 1. Once you begin, you cannot pause or go back.</p>
          <ul className="text-left text-gray-400 space-y-2 bg-dark-800 p-4 rounded-lg text-sm">
            <li>⏱️ <strong>45 Seconds</strong> per Technical Question</li>
            <li>⏱️ <strong>60 Seconds</strong> per Aptitude Question</li>
            <li>⚠️ <strong>-0.25 Points</strong> penalty for incorrect answers</li>
            <li>🔒 Clicking an option locks it instantly.</li>
          </ul>
          <Button variant="danger" size="lg" className="w-full" onClick={() => setExamStarted(true)}>
            Start Timer & Begin
          </Button>
        </Card>
      </motion.div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" />
        <p className="text-teal-400 font-mono">Calculating strict metrics and negative marking...</p>
      </div>
    );
  }

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-dark-900 p-6"
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {currentQuestion?.is_aptitude ? "Aptitude & Logic" : "Technical Core"}
              </h1>
              <p className="text-gray-400 text-sm">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
            
            {/* High Pressure Timer UI */}
            <div className={`px-6 py-3 rounded-lg border-2 ${timeLeft <= 10 ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-dark-800 border-gray-600'}`}>
              <span className={`font-mono text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-teal-400'}`}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </span>
            </div>
          </div>
          <Progress value={((currentIndex) / questions.length) * 100} className="h-2 bg-dark-800 [&>div]:bg-teal-500" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-xl font-medium text-white mb-8 leading-relaxed">
                {currentQuestion?.question}
              </h2>
              
              <div className="space-y-4">
                {currentQuestion?.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    className="w-full p-4 text-left text-gray-200 bg-dark-800 border border-gray-700 rounded-lg hover:bg-teal-900/30 hover:border-teal-500 transition-all group"
                  >
                    <span className="inline-block w-8 text-gray-500 group-hover:text-teal-400">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Panel - Strict Mode Reminders */}
          <div className="space-y-6">
            <Card className="p-5 bg-red-500/10 border-red-500/30">
              <p className="text-sm text-red-400 font-semibold mb-3">
                ⚠️ Strict Rules
              </p>
              <ul className="text-xs text-red-300/80 space-y-2">
                <li>• Cannot return to previous questions</li>
                <li>• -0.25 points for wrong answers</li>
                <li>• Requires 65% total to pass</li>
              </ul>
            </Card>

            <Card className="p-5 bg-yellow-500/10 border-yellow-500/30">
              <p className="text-sm text-yellow-400 font-semibold mb-2">
                👁️ Proctoring Active
              </p>
              <p className="text-xs text-yellow-300/80">
                Tab switching will trigger a termination strike.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JDScreeningRound;