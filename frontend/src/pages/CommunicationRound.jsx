import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../components/ui';
import {
  ReadAloudModule,
  RepeatSentenceModule,
  StoryRetellModule,
  DescribeImageModule,
} from '../components/CommunicationModules';
import { useAuthStore } from '../store';
import { practiceService } from '../api';

const CommunicationRound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const testedSkill = location.state?.skillToTest || '';
  const targetDomain = location.state?.domain || '';
  const mcqScore = location.state?.mcqScore || 0;
  const theoryAnswers = location.state?.theoryAnswers || '';

  const [moduleData, setModuleData] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleResults, setModuleResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const user = useAuthStore((state) => state.user);

  // 🟢 Added 'count' to strictly enforce the number of questions per module!
  const MODULES = [
    { id: 'read_aloud', title: 'Read Aloud', count: 4, color: 'blue', weight: 0.3 },
    { id: 'repeat_sentence', title: 'Repeat Sentence', count: 4, color: 'purple', weight: 0.3 },
    { id: 'story_retell', title: 'Story Retelling', count: 1, color: 'orange', weight: 0.3 },
    { id: 'describe_image', title: 'Describe Image', count: 1, color: 'pink', weight: 0.1 },
  ];

  const currentModule = MODULES[currentModuleIndex];
  const TOTAL_QUESTIONS = 10; // 4 + 4 + 1 + 1

  useEffect(() => {
    if (!testedSkill || !targetDomain) {
      navigate('/practice', { replace: true });
      return;
    }
    const loadModuleData = async () => {
      try {
        setIsLoading(true);
        const response = await practiceService.generateCommunicationTasks(
            testedSkill || "", 
            targetDomain || ""
        );

        if (response && response.data) {
             setModuleData(response.data);
        } else {
            throw new Error("Failed to load questions from AI");
        }
      } catch (err) {
        console.error("Failed to fetch communication tasks:", err);
        setError("Could not load communication tasks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadModuleData();
  }, [navigate, testedSkill, targetDomain]);

  // ✅ THE FIXED PROGRESSION LOGIC (No more skipping to Q5!)
  const normalizeScore = (score) => {
    const numericScore = Number(score || 0);
    if (!Number.isFinite(numericScore) || numericScore <= 0) return 0;
    if (numericScore <= 5) return Math.round(numericScore * 20);
    if (numericScore <= 10) return Math.round(numericScore * 10);
    return Math.min(Math.round(numericScore), 100);
  };

  const handleModuleComplete = (result) => {
    const updatedResults = {
      ...moduleResults,
      [currentModule.id]: [
        ...(moduleResults[currentModule.id] || []),
        result
      ],
    };

    setModuleResults(updatedResults);

    const maxQuestionsForThisModule = currentModule.count;

    // Check if we have more questions in the CURRENT module
    if (questionIndex < maxQuestionsForThisModule - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      // If we finished all questions in this module, move to the NEXT module
      setQuestionIndex(0); 
      
      if (currentModuleIndex < MODULES.length - 1) {
        setCurrentModuleIndex(prev => prev + 1);
      } else {
        handleFinishCommunication(updatedResults);
      }
    }
  };

  const calculateFinalScore = (results = moduleResults) => {
    let weightedTotal = 0;
    let completedWeight = 0;

    MODULES.forEach((module) => {
      const moduleAnswers = results[module.id] || [];
      if (!moduleAnswers.length) return;

      const moduleAverage =
        moduleAnswers.reduce((total, answer) => total + normalizeScore(answer.score), 0) /
        moduleAnswers.length;

      weightedTotal += moduleAverage * module.weight;
      completedWeight += module.weight;
    });

    return completedWeight ? Math.round(weightedTotal / completedWeight) : 0;
  };

  const generateFeedback = () => {
    return "Communication analysis completed successfully.";
  };

  const handleFinishCommunication = async (results = moduleResults) => {
    setIsSubmitting(true);
    try {
      const finalScore = calculateFinalScore(results);
      const feedback = generateFeedback();

      if (user?.id) {
        await practiceService.submitCommunication(user.id, "", finalScore, feedback);
      }

      navigate('/practice/coding', {
        state: {
          skillToTest: testedSkill,
          domain: targetDomain,
          mcqScore,
          theoryAnswer: theoryAnswers,
          communicationScore: finalScore,
          communicationFeedback: feedback,
        },
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="text-blue-300 mt-4">Saving communication score...</p>
        </div>
      </div>
    );
  }
  if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
  if (!moduleData) return <Spinner />;

  // Calculate overall progress for the sidebar
  let answeredCount = 0;
  Object.values(moduleResults).forEach(mod => {
    answeredCount += Array.isArray(mod) ? mod.length : 1;
  });
  const progressValue = (answeredCount / TOTAL_QUESTIONS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 p-6 font-sans">
      
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">Practice Round 3</Badge>
        <h1 className="text-3xl font-bold text-white mb-2">Communication Assessment</h1>
        <p className="text-gray-400">Listen carefully and speak clearly. This evaluates pronunciation, fluency, and vocabulary.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 🟢 THE DYNAMIC LEFT SIDEBAR */}
        <Card className="lg:col-span-1 p-6 bg-[#161b22] border-gray-800 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Round Progress</h2>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Task {answeredCount} of {TOTAL_QUESTIONS}</span>
              <span className="text-blue-400 font-bold">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2 bg-gray-700" indicatorColor="bg-blue-500" />
          </div>

          <div className="space-y-4">
            {MODULES.map((mod, idx) => {
              const isActive = currentModuleIndex === idx;
              
              return (
                <div key={mod.id} className={`rounded-xl transition-all ${
                  isActive ? 'bg-[#0f172a] border border-blue-500/40 p-4' : 'bg-[#1e293b] border border-transparent p-4 opacity-70'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                    isActive ? 'text-blue-400' : 'text-gray-500'
                  }`}>
                    {mod.title}
                  </h3>

                  <div className={`grid gap-2 ${mod.count > 1 ? 'grid-cols-4' : 'grid-cols-1'}`}>
                    {Array.from({ length: mod.count }).map((_, qIdx) => {
                      const isCompleted = moduleResults[mod.id] && moduleResults[mod.id].length > qIdx;
                      const isCurrent = isActive && questionIndex === qIdx;
                      
                      return (
                        <div key={qIdx} className={`h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                          isCurrent ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 
                          'bg-[#2d3748] text-gray-500'
                        }`}>
                          {mod.count > 1 ? qIdx + 1 : '1'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 🟢 RIGHT MAIN PANEL */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <Motion.div
              // 🔥 THIS KEY PROP IS THE MAGIC FIX THAT STOPS STATE BLEEDING & SKIPPING!
              key={`${currentModule.id}_${questionIndex}`} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentModule.id === 'read_aloud' && (
                <ReadAloudModule
                  sentence={moduleData.read_aloud?.[questionIndex]}
                  questionIndex={questionIndex}
                  totalQuestions={4}
                  onComplete={handleModuleComplete}
                />
              )}

              {currentModule.id === 'repeat_sentence' && (
                <RepeatSentenceModule
                  sentence={moduleData.repeat_sentence?.[questionIndex]}
                  questionIndex={questionIndex}
                  totalQuestions={4}
                  onComplete={handleModuleComplete}
                />
              )}

             {currentModule.id === 'story_retell' && (
                <StoryRetellModule
                  story={moduleData.story_retell} 
                  storySummary={moduleData.story_retell} 
                  onComplete={handleModuleComplete}
                />
              )}

              {currentModule.id === 'describe_image' && (
                <DescribeImageModule
                  imageUrl={moduleData.image_url}
                  imageDescription={moduleData.image_prompt} 
                  onComplete={handleModuleComplete}
                />
              )}
            </Motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default CommunicationRound;
