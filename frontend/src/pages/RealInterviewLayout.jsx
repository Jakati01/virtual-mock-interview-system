import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Spinner } from '../components/ui';
import toast from 'react-hot-toast';

// 🟢 NEW STRICT MODE ROUND COMPONENTS
import JDScreeningRound from './JDScreeningRound';
import AdversarialTheoryRound from './AdversarialTheoryRound';
import ClientEscalationRound from './ClientEscalationRound';
import BugHuntRound from './BugHuntRound';

import API_BASE_URL from '../api';
import { useAuthStore } from '../store';

const RealInterviewLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user); 

  const [currentRound, setCurrentRound] = useState(0); 
  const [roundScores, setRoundScores] = useState({});
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  
  // 🟢 NEW: Security & Room Scan States
  const [roomScanActive, setRoomScanActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const userId = user?.id || parseInt(localStorage.getItem('user_id') || '1');

  const ROUNDS = [
    { id: 1, name: 'JD Screening', component: JDScreeningRound, stateKey: 'round1' },
    { id: 2, name: 'Adversarial AI Theory', component: AdversarialTheoryRound, stateKey: 'round2' },
    { id: 3, name: 'Client Escalation (Communication)', component: ClientEscalationRound, stateKey: 'round3' },
    { id: 4, name: 'The Bug Hunt (Coding)', component: BugHuntRound, stateKey: 'round4' },
  ];

  // 1. Eligibility Check
  useEffect(() => {
    const checkEligibility = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/interview/check-eligibility/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const data = await response.json();
        
        if (!data.eligible) {
            toast.error(`You don't meet the requirements to unlock Real Interview Mode.`);
            navigate('/dashboard');
            return; 
        }
        setEligibilityChecked(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking eligibility:', error);
        navigate('/dashboard');
      }
    };
    checkEligibility();
  }, [userId, navigate]);

  // 2. Centralized Proctoring Logger
  const logProctorWarning = useCallback(async (warningType) => {
    toast.error(`SECURITY VIOLATION: ${warningType}`, { icon: '🚨', duration: 4000 });
    try {
      const res = await fetch(`${API_BASE_URL}/interview/proctor/log-warning`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: userId, warning_type: warningType })
      });
      const data = await res.json();

      if (data.status === 'WARNING_IGNORED') return; // Demo User bypass

      if (data.status === 'TERMINATED') {
        toast.error('Maximum warnings exceeded. Interview terminated.', { duration: 8000 });
        // Stop camera
        if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
        navigate('/dashboard');
      } else {
        setViolations(data.strikes);
      }
    } catch (e) {
      console.error("Failed to log warning");
    }
  }, [userId, mediaStream, navigate]);

  // 3. Tab Switching & Copy-Paste Blocks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentRound >= 1) logProctorWarning('Tab Switch Detected');
    };
    const handleCopy = (e) => {
      e.preventDefault();
      if (currentRound >= 1) logProctorWarning('Copy-Paste Attempt Detected');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
    };
  }, [currentRound, logProctorWarning]);

  // 4. Connect Video Ref when stream updates
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, roomScanActive, currentRound]);

  // 🟢 5. GLOBAL AI FRAME ANALYSIS LOOP (Runs for all 4 rounds)
  useEffect(() => {
    if (currentRound < 1 || !mediaStream) return; // Only run during active rounds

    const proctorInterval = setInterval(async () => {
      if (videoRef.current && canvasRef.current && userId) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.videoWidth === 0) return; 

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);

        try {
          const response = await fetch(`${API_BASE_URL}/interview/proctor/analyze-frame`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ user_id: userId, frame: frameBase64 })
          });
          const result = await response.json();
          
          if (result.status === 'MULTIPLE_FACES' || result.status === 'MOBILE_DETECTED' || result.status === 'NO_FACE') {
            logProctorWarning(result.message);
          }
        } catch (error) {
          console.error("AI Frame Analysis failed:", error);
        }
      }
    }, 5000); // Analyzes every 5 seconds globally

    return () => clearInterval(proctorInterval);
  }, [currentRound, mediaStream, userId, logProctorWarning]);

  // 🟢 6. START SYSTEM CHECK (Permissions)
  const initializeSystemCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setRoomScanActive(true); // Switch to Room Scan Lobby
    } catch (err) {
      toast.error("Camera and Microphone access are STRICTLY REQUIRED to begin.", { duration: 6000 });
    }
  };

  const completeInterview = async () => {
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop()); // Turn off camera
    try {
      const response = await fetch(`${API_BASE_URL}/interview/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          round1_score: roundScores.round1 || 0,
          round2_score: roundScores.round2 || 0,
          round3_score: roundScores.round3 || 0,
          round4_score: roundScores.round4 || 0,
        }),
      });
      const result = await response.json();
      navigate('/interview-results', { state: { result } });
    } catch (error) {
      toast.error('Error saving interview data.');
    }
  };

  const handleRoundComplete = (roundKey, score) => {
    setRoundScores((prev) => ({ ...prev, [roundKey]: score }));
    if (currentRound < ROUNDS.length) {
      setCurrentRound(currentRound + 1);
    } else {
      completeInterview();
    }
  };

  if (loading || !eligibilityChecked) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  // ==========================================
  // VIEW 1: INTRO SCREEN
  // ==========================================
  if (currentRound === 0 && !roomScanActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-dark-900 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="p-8 text-center space-y-6">
            <h1 className="text-4xl font-bold text-white mb-3">Real Interview Selection</h1>
            <p className="text-gray-400 text-lg">This is a strict, proctored environment.</p>
            <div className="bg-dark-800 p-6 rounded-lg text-left space-y-3">
              <h3 className="font-bold text-white mb-3">📋 Strict Mode Rules:</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>✓ Camera & Mic will remain ON for all 4 rounds.</li>
                <li>✓ AI actively monitors for mobile phones & secondary voices.</li>
                <li>✗ Tab switching or leaving the frame = Instant Strike.</li>
              </ul>
            </div>
            <Button variant="primary" size="lg" onClick={initializeSystemCheck} className="w-full">
              Proceed to System Check 🔒
            </Button>
          </Card>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VIEW 2: 360 ROOM SCAN LOBBY
  // ==========================================
  if (roomScanActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-dark-900 p-6 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full space-y-6 text-center">
          <h2 className="text-3xl font-bold text-white">System Check & Room Scan</h2>
          <p className="text-gray-400">Please pick up your laptop/webcam and pan 360-degrees around your room to verify a secure environment.</p>
          
          <div className="relative w-full aspect-video bg-black rounded-lg border-4 border-teal-500 overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded text-teal-400 font-mono text-sm border border-teal-500/50 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              Audio/Video Secure
            </div>
            <div className="absolute inset-0 border-2 border-dashed border-teal-500/30 m-8 rounded pointer-events-none"></div>
          </div>

          <Button variant="primary" size="lg" onClick={() => { setRoomScanActive(false); setCurrentRound(1); }} className="w-full mt-6 py-4 text-lg font-bold">
            Verify Environment & Start Round 1
          </Button>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE INTERVIEW ROUNDS
  // ==========================================
  const roundIndex = currentRound - 1;
  if (roundIndex >= 0 && roundIndex < ROUNDS.length) {
    const CurrentRoundComponent = ROUNDS[roundIndex].component;
    const currentRoundKey = ROUNDS[roundIndex].stateKey;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative min-h-screen">
        
        {/* Header Bar */}
        <div className="fixed top-0 left-0 right-0 bg-dark-800 border-b border-gray-700 p-4 z-40">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold text-lg">{ROUNDS[roundIndex].name}</h2>
              <p className="text-xs text-gray-400">Round {currentRound} of 4</p>
            </div>
            <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${violations > 1 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-yellow-500/20 text-yellow-400'}`}>
              ⚠️ {violations}/3 Violations
            </div>
          </div>
        </div>

        {/* The Actual Round Content */}
        <div className="pt-20 pb-6">
          <CurrentRoundComponent userId={userId} onRoundComplete={(score) => handleRoundComplete(currentRoundKey, score)} />
        </div>

        {/* 🟢 GLOBAL FLOATING PROCTORING WEBCAM */}
        <div className="fixed bottom-6 right-6 w-48 h-36 bg-black rounded-lg border-2 border-red-500/50 overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.2)] z-50 transition-all duration-300 hover:border-red-500">
          <div className="absolute top-0 left-0 w-full bg-dark-900/80 backdrop-blur-sm border-b border-red-500/30 px-2 py-1 flex justify-between items-center z-10">
            <span className="text-[9px] text-gray-300 font-mono tracking-widest uppercase">Global Proctor</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] text-red-500 font-bold uppercase">REC</span>
            </div>
          </div>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent w-full h-[200%] animate-[pulse_2s_ease-in-out_infinite] pointer-events-none"></div>
        </div>
        
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    );
  }

  return null;
};

export default RealInterviewLayout;