import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Button, Card, Badge, Progress, Spinner } from '../components/ui';
import API_BASE_URL from '../api';
import toast from 'react-hot-toast';

/**
 * ROUND 4: THE BUG HUNT (STRICT CODING)
 * Mode: Code Editor Only. No Copy/Paste.
 * Candidate must find 3 bugs and optimize time complexity.
 * Note: Video Proctoring is now handled globally by RealInterviewLayout.jsx
 */
const BugHuntRound = ({ userId, onRoundComplete }) => {
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes strict timer
  
  const editorRef = useRef(null);

  // 1. Fetch the buggy code on mount
  useEffect(() => {
    const fetchBugHuntTask = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interview/round4/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });

        const data = await response.json();
        setTask(data.task);
        setCode(data.task.buggy_code || '# Code failed to load. Please refresh.');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching Bug Hunt:', error);
        toast.error('Failed to load Round 4. Please check your connection.');
        setLoading(false);
      }
    };
    fetchBugHuntTask();
  }, []);

  // 2. Strict Timer Engine
  useEffect(() => {
    if (loading || evaluating || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, evaluating, timeLeft]);

  // 3. Auto-Submit Trigger
  useEffect(() => {
    if (timeLeft === 0 && !evaluating) {
      toast.error("Time is up! Auto-submitting your code...");
      submitSolution();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // 4. Submit and Evaluate Code
  const submitSolution = async () => {
    if (!code.trim()) {
      toast.error('Cannot submit an empty editor.');
      return;
    }

    setEvaluating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/interview/round4/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          code_solution: code,
          language: "python" 
        }),
      });

      const result = await response.json();
      
      // Calculate final coding score (0-100)
      const finalScore = result.evaluation?.coding_score || 0;
      
      // Complete the round immediately after evaluation
      onRoundComplete(finalScore);

    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Failed to evaluate code. Server error.');
      setEvaluating(false);
    }
  };

  // ==========================================
  // LOCAL COMPONENT ANTI-CHEAT
  // ==========================================

  const logProctorWarning = useCallback(async (warningType) => {
    toast.error(`SECURITY VIOLATION: ${warningType}`, { icon: '🚨', duration: 4000 });
    try {
      await fetch(`${API_BASE_URL}/interview/proctor/log-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ user_id: userId, warning_type: warningType })
      });
    } catch (e) {
      console.error("Failed to log warning");
    }
  }, [userId]);

  // Tab Switching Listener (Specific to Round 4)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) logProctorWarning('Tab Switch during Bug Hunt');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [logProctorWarning]);

  // Monaco Editor Restrictions
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Disable Copy/Paste entirely via Monaco keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      logProctorWarning("Attempted to Copy Code");
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      logProctorWarning("Attempted to Paste Code");
    });
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 mt-4 font-mono animate-pulse">Generating Buggy Code Repository...</p>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 relative"
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Round 4: The Bug Hunt
              </h1>
              <p className="text-gray-400">Find the 3 hidden bugs and optimize the algorithm.</p>
            </div>
            
            {/* Strict Timer UI */}
            <div className={`px-6 py-3 rounded-lg border-2 ${timeLeft <= 300 ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-dark-800 border-gray-600'}`}>
              <span className={`font-mono text-3xl font-bold ${timeLeft <= 300 ? 'text-red-500' : 'text-teal-400'}`}>
                {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
          </div>
          <Progress value={(timeLeft / 900) * 100} className="h-2 bg-dark-800 [&>div]:bg-teal-500" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Panel - Task Description */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-dark-800 border-gray-700">
              <Badge variant="danger" className="mb-4 w-full justify-center py-2">
                {task?.problem_title || "Optimize the Logic"}
              </Badge>
              
              <h3 className="text-white font-semibold mb-2">The Scenario:</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {task?.scenario}
              </p>

              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-2">Your Objectives</p>
                <ul className="text-sm text-gray-300 space-y-2 list-disc pl-4">
                  <li>Find exactly 3 logical bugs.</li>
                  <li>Fix syntax errors to ensure it runs.</li>
                  <li>Optimize the time complexity to <strong className="text-teal-400">{task?.target_complexity || "O(n)"}</strong>.</li>
                </ul>
              </div>
            </Card>

            <Card className="p-5 bg-yellow-500/10 border-yellow-500/30">
              <p className="text-sm text-yellow-400 font-semibold mb-2">
                🔒 Security Active
              </p>
              <p className="text-xs text-yellow-300/80">
                Copying and Pasting inside the editor is strictly disabled.
              </p>
            </Card>
          </div>

          {/* Right Panel - Monaco Editor */}
          <div className="lg:col-span-3">
            <Card className="p-0 border-gray-700 overflow-hidden flex flex-col h-[600px]">
              
              {/* Editor Header */}
              <div className="bg-dark-900 border-b border-gray-700 p-3 flex justify-between items-center">
                <span className="text-sm font-mono text-gray-400">main.py (Read/Write)</span>
                {evaluating && <span className="text-sm text-teal-400 animate-pulse">Running Test Cases...</span>}
              </div>

              {/* Editor Area */}
              <div className="flex-grow bg-[#1E1E1E] relative">
                {evaluating && (
                  <div className="absolute inset-0 bg-dark-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Spinner size="lg" className="mb-4" />
                    <p className="text-teal-400 font-mono text-lg">Evaluating Syntax & Complexity...</p>
                  </div>
                )}
                
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    formatOnPaste: true,
                    scrollBeyondLastLine: false,
                    readOnly: evaluating,
                    contextmenu: false 
                  }}
                />
              </div>
            </Card>

            {/* Final Action Button */}
            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={submitSolution}
                disabled={evaluating}
                className="px-12 py-4 bg-teal-600 hover:bg-teal-700 font-bold text-lg"
              >
                {evaluating ? 'Analyzing Code...' : 'Submit Code & Finish Interview'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default BugHuntRound;