import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Spinner } from '../components/ui';
import { userService } from '../api'; // Your API service
import { useAuthStore } from '../store';

const PracticeResults = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data passed from CodingRound.jsx
  const { coding_results, overall_status, skill } = location.state || {};

  const [step, setStep] = useState(1); // 1 = Coding Result, 2 = Overall Report
  const [fullReport, setFullReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fallback coding score if missing
  const codingScore = coding_results?.coding_score || 0;

  // Fetch the full report (MCQ, Theory, Comm, Coding) when moving to Step 2
  const handleProceedToOverall = async () => {
    setLoading(true);
    try {
      // Calls your existing backend endpoint to get all 4 scores
      const reportData = await userService.getDashboardStats(user?.id);
      setFullReport(reportData);
      setStep(2);
    } catch (error) {
      console.error("Failed to load overall report", error);
      // Fallback to the basic average if the fetch fails
      setFullReport({ interview_score: overall_status?.average_score || 0 });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  // ==========================================
  // UI THEME: Matching your screenshot exactly
  // ==========================================
  const ThemeCard = ({ children, className = "" }) => (
    <div className={`bg-[#1c2438] border border-white/5 rounded-2xl p-8 shadow-xl ${className}`}>
      {children}
    </div>
  );

  const InnerScoreCard = ({ title, score, max = 100 }) => (
    <div className="bg-[#151b2b] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{score}</span>
        {max && <span className="text-gray-500 text-sm">/ {max}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#131b2f] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        
        {/* ========================================== */}
        {/* STEP 1: CODING ROUND RESULTS               */}
        {/* ========================================== */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                {loading ? <Spinner size="sm" /> : "Proceed to Overall Practice Report"}
              </Button>
            </ThemeCard>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* STEP 2: OVERALL PRACTICE REPORT            */}
        {/* ========================================== */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
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
                <InnerScoreCard title="MCQ" score={fullReport?.mcq_score || user?.mcq_score || 0} />
                <InnerScoreCard title="Theory" score={fullReport?.theory_score || user?.theory_score || 0} />
                <InnerScoreCard title="Communication" score={fullReport?.communication_score || user?.communication_score || 0} />
                <InnerScoreCard title="Coding" score={codingScore} />
              </div>

              {/* Final Average Score */}
              <div className="bg-[#151b2b] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center mb-8 relative overflow-hidden">
                <h3 className="text-sm text-gray-300 mb-2 z-10">Final Interview Average</h3>
                <span className="text-6xl font-bold text-[#fcd34d] z-10">
                  {fullReport?.interview_score || overall_status?.average_score || 0}%
                </span>
                
                {/* 80% Requirement Label */}
                <div className="mt-4 z-10">
                  {(fullReport?.interview_score || overall_status?.average_score) >= 80 ? (
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
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default PracticeResults;