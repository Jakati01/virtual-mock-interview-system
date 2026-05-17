import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { practiceService } from '../api';
import { useAuthStore } from '../store';
import { Badge, Button, Card, Progress, Skeleton } from '../components/ui';

const McqRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const testedSkill = location.state?.skillToTest || '';
  const targetDomain = location.state?.domain || '';

  // --- State Management ---
  const [techQuestions, setTechQuestions] = useState([]);
  const [aptQuestions, setAptQuestions] = useState([]);
  const [phase, setPhase] = useState('technical'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [answers, setAnswers] = useState({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Results & Anti-Cheating State
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [techScore, setTechScore] = useState(0);
  const [aptScore, setAptScore] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  // --- Step 2: Anti-Cheating Wrapper ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error("Test Terminated: Multiple tab switches detected.");
            navigate('/practice'); 
          } else {
            toast.error(`Warning ${next}/3: Do not switch tabs during the assessment!`, { duration: 4000 });
          }
          if (user?.id) practiceService.logWarning(user.id, 'TAB_SWITCH');
          return next;
        });
      }
    };

    const blockCopyPaste = (e) => {
      e.preventDefault();
      toast.error("Copy-Paste is disabled for this test!");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', blockCopyPaste);
    document.addEventListener('paste', blockCopyPaste);
    document.addEventListener('contextmenu', blockCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', blockCopyPaste);
      document.removeEventListener('paste', blockCopyPaste);
      document.removeEventListener('contextmenu', blockCopyPaste);
    };
  }, [navigate, user?.id]);

  // --- Step 3: Fetch Questions (Groq + DeepSeek Split) ---
  useEffect(() => {
    if (!testedSkill || !targetDomain) {
      navigate('/practice', { replace: true });
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await practiceService.generateMCQ(testedSkill, targetDomain);
        
        const technical = response?.data?.technical || [];
        const aptitude = response?.data?.aptitude || [];

        if (!technical.length) throw new Error('Failed to load assessment questions.');
        
        setTechQuestions(technical);
        setAptQuestions(aptitude);
      } catch (err) {
        setError(err.message || 'Failed to load the MCQ round.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate, targetDomain, testedSkill]);

  // Helpers
  const currentQuestions = phase === 'technical' ? techQuestions : aptQuestions;
  const currentQuestion = currentQuestions[currentIndex];
  const totalInPhase = currentQuestions.length;
  const totalQuestions = techQuestions.length + aptQuestions.length;

  // --- Step 4: Double-Click Logic & Progression ---
  const handleNext = () => {
    if (!selectedOption) return;

    if (!isAnswerRevealed) {
      setAnswers({ ...answers, [currentQuestion.id]: selectedOption });
      setIsAnswerRevealed(true);
      return; 
    }

    if (currentIndex < totalInPhase - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption('');
      setIsAnswerRevealed(false);
    } else {
      if (phase === 'technical') {
        setPhase('aptitude');
        setCurrentIndex(0);
        setSelectedOption('');
        setIsAnswerRevealed(false);
        toast.success("Technical Round Complete! Moving to Aptitude.", {
          style: { background: '#111827', color: '#fff', border: '1px solid rgba(59,130,246,0.45)' }
        });
      } else {
        // Calculate Final Scores
        const tScore = techQuestions.reduce((score, q) => answers[q.id] === q.correct_answer ? score + 1 : score, 0);
        const aScore = aptQuestions.reduce((score, q) => answers[q.id] === q.correct_answer ? score + 1 : score, 0);
        
        setTechScore(tScore);
        setAptScore(aScore);
        setShowFinalResults(true);
      }
    }
  };

  const submitFinalScore = async () => {
    try {
      setIsSubmitting(true);
      const finalScore = techScore + aptScore;

      if (user?.id) await practiceService.submitMCQ(user.id, finalScore, totalQuestions);
      
      navigate('/practice/theory', {
        state: { skillToTest: testedSkill, domain: targetDomain, totalQuestions }
      });
    } catch {
      toast.error("Failed to save final score.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4 flex justify-center items-center">
         <Card className="p-8 border border-red-500/30 bg-red-500/10 text-center">
            <h2 className="text-2xl font-semibold text-white mb-3">Assessment Unavailable</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <Button variant="primary" onClick={() => navigate('/practice')}>Go Back</Button>
         </Card>
      </div>
     )
  }

  // --- Step 5: Render Results Dashboard ---
  if (showFinalResults) {
    const totalScore = techScore + aptScore;
    const passPercentage = ((totalScore / totalQuestions) * 100).toFixed(0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-12 px-4 flex justify-center items-center">
        <Card className="max-w-2xl w-full p-8 border border-blue-500/20">
          <div className="text-center mb-8">
            <Badge className="bg-blue-500/20 text-blue-400 mb-4">ROUND 1 COMPLETE</Badge>
            <h1 className="text-4xl font-bold text-white mb-2">Assessment Results</h1>
            <p className="text-gray-400">Here is your performance breakdown for {testedSkill}.</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-dark-800 rounded-xl p-6 border border-white/10 text-center">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Technical Skills</p>
              <p className="text-3xl font-bold text-white">{techScore} <span className="text-lg text-gray-400">/ {techQuestions.length}</span></p>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-white/10 text-center">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Aptitude & Logic</p>
              <p className="text-3xl font-bold text-white">{aptScore} <span className="text-lg text-gray-400">/ {aptQuestions.length}</span></p>
            </div>
          </div>

          <div className="bg-dark-800/50 rounded-xl p-6 border border-white/5 text-center mb-8">
            <p className="text-lg text-gray-300">Overall Score</p>
            <p className={`text-5xl font-bold mt-2 ${passPercentage >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
              {passPercentage}%
            </p>
          </div>

          <Button 
            variant="primary" 
            className="w-full py-4 text-lg"
            onClick={submitFinalScore}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Results..." : "Proceed to Round 2: Theory Assessment"}
          </Button>
        </Card>
      </div>
    );
  }

  // Render Sidebar Box Helper
  const renderSidebarGrid = (questionsArray, startIndex) => (
    <div className="grid grid-cols-5 gap-2 mt-4">
      {questionsArray.map((q, index) => {
        const globalIndex = startIndex + index;
        const isAnswered = Boolean(answers[q.id]);
        const isActive = (phase === 'technical' && startIndex === 0 && currentIndex === index) || 
                         (phase === 'aptitude' && startIndex > 0 && currentIndex === index);

        return (
          <div
            key={q.id}
            className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
              isActive
                ? 'bg-blue-500 text-white shadow-glow'
                : isAnswered
                  ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {isAnswered ? (
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              globalIndex + 1
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <Motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end gap-4">
          <div>
            <Badge className="text-blue-300 border-blue-500/30 bg-blue-500/10 mb-3">Practice Round 1</Badge>
            <h1 className="text-4xl font-bold text-white">MCQ Assessment</h1>
          </div>
          {warningCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse">Warnings: {warningCount}/3</Badge>
          )}
        </Motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <Card className="lg:col-span-1 p-6 h-fit">
            <h2 className="text-lg font-semibold text-white mb-2">Progress Map</h2>
            <Progress value={(Object.keys(answers).length / totalQuestions) * 100} />
            
            <div className="mt-8">
               <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Technical Skills</p>
               {renderSidebarGrid(techQuestions, 0)}
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
               <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Aptitude & Logic</p>
               {renderSidebarGrid(aptQuestions, techQuestions.length)}
            </div>
          </Card>

          <Card className="lg:col-span-3 p-8">
            <AnimatePresence mode="wait">
              <Motion.div key={currentQuestion?.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">
                      {phase === 'technical' ? `Technical Section • Question ${currentIndex + 1}` : `Aptitude Section • Question ${currentIndex + 1 + techQuestions.length}`}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-dark-800/70 p-6 mb-6">
                  <p className="text-lg text-gray-100 leading-8">{currentQuestion?.question}</p>
                </div>

                <div className="space-y-4">
                  {currentQuestion?.options?.map((optionText, index) => {
                    const isSelected = selectedOption === optionText;
                    const isCorrect = optionText === currentQuestion.correct_answer;
                    const optionLabel = String.fromCharCode(65 + index);
                    
                    let btnStyle = 'border-white/10 bg-white/5 hover:border-blue-500/35';
                    let labelStyle = 'bg-dark-700 text-gray-300 border border-white/10';

                    if (isAnswerRevealed) {
                        if (isCorrect) {
                            btnStyle = 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                            labelStyle = 'bg-green-500 text-white';
                        } else if (isSelected && !isCorrect) {
                            btnStyle = 'border-red-500 bg-red-500/10';
                            labelStyle = 'bg-red-500 text-white';
                        } else {
                            btnStyle = 'border-white/5 bg-white/5 opacity-50';
                        }
                    } else if (isSelected) {
                        btnStyle = 'border-blue-500 bg-blue-500/10 shadow-glow';
                        labelStyle = 'bg-blue-500 text-white';
                    }

                    return (
                      <button
                        key={`${currentQuestion.id}-${index}`}
                        type="button"
                        disabled={isAnswerRevealed}
                        onClick={() => setSelectedOption(optionText)}
                        className={`w-full text-left rounded-2xl border p-5 transition-all ${btnStyle}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${labelStyle}`}>
                            {optionLabel}
                          </div>
                          <p className={`text-base leading-7 mt-1.5 ${isSelected || (isAnswerRevealed && isCorrect) ? 'text-white' : 'text-gray-300'}`}>
                            {optionText}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isAnswerRevealed && (
                  <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                     <p className="text-blue-200 font-medium mb-1">Correct Answer Revealed:</p>
                     <p className="text-white text-lg font-bold">{currentQuestion.correct_answer}</p>
                  </Motion.div>
                )}
              </Motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-end">
                <Button 
                  variant={isAnswerRevealed ? "secondary" : "primary"}
                  onClick={handleNext} 
                  disabled={!selectedOption && !isAnswerRevealed}
                >
                  {!isAnswerRevealed 
                    ? "Check Answer" 
                    : (currentIndex === totalInPhase - 1 && phase === 'aptitude')
                        ? "Finish Round 1"
                        : "Continue to Next"}
                </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default McqRound;
