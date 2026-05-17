import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { practiceService } from '../api';
import { useAuthStore } from '../store';
import { Badge, Button, Card, Progress, Spinner } from '../components/ui';

const MAX_WARNINGS = 3;

const CodingRound = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Safely extract from state to prevent 422 errors on page refresh
  const state = location.state || {};
  const skill = state.skill || 'python';
  const domain = state.domain || 'Software Engineering';

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  
  const editorRef = useRef(null);
  
  // 🟢 NEW: Refs for AI Proctoring (Live Video)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);

  // 1. Initial Load
  useEffect(() => {
    const fetchPracticeProblem = async () => {
      try {
        const response = await practiceService.generatePracticeCoding({ skill, domain });
        if (response && response.task) {
          setProblem(response.task);
          setCode(response.task.starter_code || '');
          setLanguage((response.task.language || 'python').toLowerCase());
        }
      } catch (error) {
        toast.error("Failed to load the coding task.");
      }
    };
    fetchPracticeProblem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    if (!problem) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  // 3. Proctoring Engine: Handle Violations
  const handleViolation = useCallback((type) => {
    if (!user?.id) return; 
    setWarnings((prev) => prev + 1);
    toast.error(`Security Violation: ${type}`, { icon: '⚠️', duration: 4000 });

    practiceService.logWarning({ 
      user_id: user.id, 
      warning_type: type, 
      session_id: Date.now() 
    }).catch(console.error);
  }, [user?.id]);

  // 4. Auto-submit on Max Warnings
  useEffect(() => {
    if (warnings >= MAX_WARNINGS) {
      toast.error('Maximum violations reached. Auto-submitting...');
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warnings]);

  // 5. Anti-Cheat Listeners
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) handleViolation('Tab Switch'); };
    const handleCopy = (e) => { e.preventDefault(); handleViolation('Copying Code'); };
    const handlePaste = (e) => { e.preventDefault(); handleViolation('Pasting Code'); };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleViolation]);

  // 🟢 6. WEBCAM INITIALIZATION
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error("Camera access is required for proctoring.");
      }
    };
    startCamera();

    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🟢 7. AI FRAME ANALYSIS LOOP
  useEffect(() => {
    if (!mediaStream) return;
    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current && user?.id) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0) return; 

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);

        try {
          const response = await practiceService.analyzeFrame({ 
            user_id: user.id, 
            frame: frameBase64 
          });
          
          if (response.status === 'MULTIPLE_FACES') handleViolation('Multiple Faces Detected');
          else if (response.status === 'NO_FACE') handleViolation('Candidate Not Visible');
          else if (response.status === 'MOBILE_DETECTED') handleViolation('Mobile Phone Detected');
          
        } catch (error) {
          console.error("AI Analysis failed:", error);
        }
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [mediaStream, user?.id, handleViolation]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onContextMenu((e) => e.event.preventDefault());
  };

  const handleRunCode = async () => {
    if (!code.trim()) return toast.error('Code cannot be empty');
    setIsRunning(true);
    try {
      const response = await practiceService.runCode({ code, language });
      setOutput(response.output || response.error || 'Execution completed with no output.');
    } catch (error) {
      setOutput('Error executing code. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Stop camera
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());

    try {
      const payload = {
        user_id: user?.id,
        problem_statement: problem.problem_statement || problem.scenario,
        code: code,
        language: language
      };
      
      const response = await practiceService.submitCodingSolution(payload);
      
      toast.success('Coding round completed!');
      
      // 🟢 Pass ALL results (Coding + Overall) to the results page
      navigate('/interview-results', { 
        state: { 
          coding_results: response.coding_results,
          overall_status: response.final_interview_status, 
          skill,
          domain
        }
      });
    } catch (error) {
      toast.error('Error submitting code');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 mt-4 font-mono animate-pulse">Generating coding environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-6 flex flex-col relative">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Round 4: Technical Execution</h1>
          <p className="text-gray-400 font-mono text-sm">Practice Sandbox Mode</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-dark-800 text-teal-400'}`}>
            {formatTime(timeLeft)}
          </div>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit Final Code
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <Card className="p-6 bg-dark-800 border-gray-700">
            <Badge variant="primary" className="mb-4">Target: {problem.target_complexity}</Badge>
            <h2 className="text-xl font-bold text-white mb-2">{problem.problem_title || 'Coding Challenge'}</h2>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
              {problem.problem_statement || problem.scenario}
            </div>
            <div className="bg-dark-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">Instructions</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>Optimize your code to meet the target complexity.</li>
                <li>Your code must compile and run successfully.</li>
                <li>Do not leave the browser tab (Active proctoring is ON).</li>
              </ul>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="col-span-8 flex flex-col gap-4">
          <Card className="flex-1 p-0 overflow-hidden bg-dark-800 border-gray-700 flex flex-col">
            <div className="bg-dark-900 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs bg-dark-800">
                  {language.toUpperCase()}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleRunCode} isLoading={isRunning} className="text-teal-400 border-teal-500/30 hover:bg-teal-500/10">
                Run Code (Test)
              </Button>
            </div>

            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={setCode}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'Fira Code', monospace",
                  wordWrap: 'on',
                  automaticLayout: true,
                  contextmenu: false 
                }}
              />
            </div>
          </Card>

          <div className="h-48 grid grid-cols-3 gap-4">
            <Card className="col-span-2 p-4 bg-dark-800 border-gray-700 flex flex-col">
               <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Console Output</h4>
               <pre className="bg-black/50 border border-white/5 p-3 rounded flex-1 text-xs text-gray-300 overflow-auto font-mono">
                  {output || '> Waiting for execution...'}
               </pre>
            </Card>

            <Card className="col-span-1 p-4 bg-dark-800 border-gray-700 flex flex-col justify-center">
              <div className="text-center mb-2">
                 <h3 className="text-sm font-semibold text-gray-400 uppercase">Proctoring Violations</h3>
                 <span className={`text-4xl font-bold ${warnings >= MAX_WARNINGS ? 'text-red-500' : warnings > 0 ? 'text-yellow-500' : 'text-teal-500'}`}>
                    {warnings}/{MAX_WARNINGS}
                 </span>
              </div>
              <Progress value={(warnings / MAX_WARNINGS) * 100} className="h-2 mb-2" />
              <p className="text-[10px] text-gray-500 text-center uppercase tracking-wider">Tab Switches / Clipboard Events</p>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* 🟢 FLOATING LIVE PROCTORING WEBCAM */}
      <div className="fixed bottom-6 right-6 w-56 h-40 bg-black rounded-lg border-2 border-red-500/50 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.2)] z-50">
        <div className="absolute top-0 left-0 w-full bg-dark-900/80 backdrop-blur-sm border-b border-red-500/30 px-3 py-1.5 flex justify-between items-center z-10">
          <span className="text-[10px] text-gray-300 font-mono tracking-widest uppercase">AI Proctor Active</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] text-red-500 font-bold uppercase">REC</span>
          </div>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

    </div>
  );
};

export default CodingRound;