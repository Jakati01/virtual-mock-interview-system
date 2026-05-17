import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Button, Spinner } from '../components/ui';
import { userService } from '../api'; 
import { useAuthStore } from '../store';

const InterviewResults = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data passed from CodingRound.jsx OR the Dashboard
  const { coding_results, overall_status, skill, forceOverallReport } = location.state || {};

  const [step, setStep] = useState(1); // 1 = Coding Result, 2 = Overall Report
  const [fullReport, setFullReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fallback coding score if missing
  const codingScore = coding_results?.coding_score || 0;

  const normalizeRoundScore = (score, round) => {
    const numericScore = Number(score || 0);
    if (!Number.isFinite(numericScore) || numericScore <= 0) return 0;
    if (round === 'mcq' && numericScore <= 30) return Math.round((numericScore / 30) * 100);
    if (round === 'theory' && numericScore <= 5) return Math.round(numericScore * 20);
    if (round !== 'coding' && numericScore <= 10) return Math.round(numericScore * 10);
    return Math.min(Math.round(numericScore), 100);
  };

  const getReportScores = () => {
    const data = fullReport?.data || {};
    return {
      mcq: normalizeRoundScore(data.mcq_score ?? user?.mcq_score, 'mcq'),
      theory: normalizeRoundScore(data.theory_score ?? user?.theory_score, 'theory'),
      communication: normalizeRoundScore(data.communication_score ?? user?.communication_score, 'communication'),
      coding: normalizeRoundScore(data.coding_score ?? user?.coding_score ?? codingScore, 'coding'),
    };
  };

  const getCompletedAverage = (scores) => {
    const completedScores = Object.values(scores).filter((score) => score > 0);
    if (!completedScores.length) return 0;
    return Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length);
  };

  // Fetch the full report (MCQ, Theory, Comm, Coding)
  const handleProceedToOverall = useCallback(async () => {
    setLoading(true);
    try {
      const reportData = await userService.getDashboardStats(user?.id);
      setFullReport(reportData);
      setStep(2);
    } catch (error) {
      console.error("Failed to load overall report", error);
      // Fallback if fetch fails
      setFullReport({ interview_score: overall_status?.average_score || 0 });
      setStep(2);
    } finally {
      setLoading(false);
    }
  }, [user?.id, overall_status]);

  // If they clicked "View Report" from the dashboard, jump straight to Step 2
  useEffect(() => {
    if (forceOverallReport) {
      handleProceedToOverall();
    }
  }, [forceOverallReport, handleProceedToOverall]);

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  // ==========================================
  // UI THEME COMPONENTS
  // ==========================================
  const ThemeCard = ({ children, className = "" }) => (
    <div className={`bg-[#1c2438] border border-white/5 rounded-2xl p-8 shadow-xl ${className}`}>
      {children}
    </div>
  );

  const InnerScoreCard = ({ title, score, max = 100 }) => (
    <div className="bg-[#151b2b] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">
        {title}
      </h3>
      <div className="flex items-baseline gap-1">
        {score > 0 ? (
          <>
            <span className="text-3xl font-bold text-white">{score}</span>
            {max && <span className="text-gray-500 text-sm">/ {max}</span>}
          </>
        ) : (
          <span className="text-sm font-semibold text-gray-500">Not completed</span>
        )}
      </div>
    </div>
  );

  if (loading) {
     return (
       <div className="min-h-screen bg-[#131b2f] flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-blue-400 mt-4 font-mono animate-pulse">Fetching your performance data...</p>
       </div>
     );
  }

  const reportScores = getReportScores();
  const completedAverage = getCompletedAverage(reportScores);

  return (
    <div className="min-h-screen bg-[#131b2f] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        
        {/* ========================================== */}
        {/* STEP 1: CODING ROUND RESULTS               */}
        {/* ========================================== */}
        {step === 1 && !forceOverallReport && (
          <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ThemeCard>
              <div className="flex flex-col items-center text-center mb-8">
                <span className="bg-blue-900/40 text-blue-400 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 border border-blue-500/20">
                  Round 4 Complete
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">Coding Round Results</h1>
                <p className="text-gray-400 text-sm">Here is your performance breakdown for {skill || 'Technical'} Execution.</p>
              </div>

              {/* Coding Specific Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InnerScoreCard title="Logic & Execution" score={codingScore} />
                <InnerScoreCard title="Code Optimization" score={codingScore > 0 ? codingScore - 5 : 0} />
              </div>

              {/* Overall Coding Score */}
              <div className="bg-[#151b2b] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center mb-8">
                <h3 className="text-sm text-gray-300 mb-2">Coding Round Score</h3>
                <span className="text-5xl font-bold text-[#fcd34d]">{codingScore}%</span>
              </div>

              <Button 
                onClick={handleProceedToOverall} 
                disabled={loading}
                className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                Proceed to Overall Practice Report
              </Button>
            </ThemeCard>
          </Motion.div>
        )}

        {/* ========================================== */}
        {/* STEP 2: OVERALL PRACTICE REPORT            */}
        {/* ========================================== */}
        {step === 2 && (
          <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <ThemeCard>
              <div className="flex flex-col items-center text-center mb-8">
                <span className="bg-purple-900/40 text-purple-400 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 border border-purple-500/20">
                  Practice Session Completed
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">Overall Practice Report</h1>
                <p className="text-gray-400 text-sm">Final evaluation across all 4 interview rounds.</p>
              </div>

              {/* All 4 Rounds Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <InnerScoreCard title="MCQ" score={reportScores.mcq} />
                <InnerScoreCard title="Theory" score={reportScores.theory} />
                <InnerScoreCard title="Communication" score={reportScores.communication} />
                <InnerScoreCard title="Coding" score={reportScores.coding} />
              </div>

              {/* Final Average Score */}
              <div className="bg-[#151b2b] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center mb-8 relative overflow-hidden">
                <h3 className="text-sm text-gray-300 mb-2 z-10">Completed Rounds Average</h3>
                <span className="text-6xl font-bold text-[#fcd34d] z-10">
                  {completedAverage}%
                </span>
                
                {/* 80% Requirement Label */}
                <div className="mt-4 z-10">
                  {completedAverage >= 80 ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      ✅ Real Interview Unlocked
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                      ⚠️ 80% Required to Unlock Real Interview
                    </span>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleReturnToDashboard} 
                className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                Return to Dashboard
              </Button>
            </ThemeCard>
          </Motion.div>
        )}

      </div>
    </div>
  );
};

export default InterviewResults;
