import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../ui';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

const DescribeImageModule = ({ imageUrl, imageDescription, onComplete, onSkip }) => {
  const [phase, setPhase] = useState('ready'); // ready, countdown, recording, processing, complete
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const user = useAuthStore((state) => state.user);

  const MAX_RECORDING_TIME = 20; // seconds
  const INITIAL_COUNTDOWN = 3; // seconds

  // Cleanup function to stop recording and clear intervals
  const cleanup = useCallback(() => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  // 🟢 1. Reset module state entirely when the component mounts or a new image URL arrives
  useEffect(() => {
    cleanup();
    setPhase('ready');
    setCountdown(INITIAL_COUNTDOWN);
    setRecordingTime(0);
    setResult(null);
    setError('');
    setImageLoaded(false);  
    audioChunksRef.current = [];
  }, [imageUrl, cleanup]);

  // 🟢 2. THE MISSING COUNTDOWN ENGINE
  // This watches the phase. When it hits 'countdown', it ticks from 3 to 0, THEN starts recording!
  useEffect(() => {
    if (phase === 'countdown') {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            initializeRecording(); // Start the mic when we hit 0!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [phase]);

  // 🟢 3. INITIALIZE RECORDING & TIMER
  const initializeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPhase('recording');
      setRecordingTime(0);

      // The recording ticking clock
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            clearInterval(recordingIntervalRef.current);
            stopRecordingAndEvaluate(); 
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      setError('Microphone access denied. Please enable microphone and try again.');
      setPhase('ready');
    }
  };

  const stopRecordingAndEvaluate = useCallback(async () => {
    cleanup();
    if (!mediaRecorderRef.current) return;

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();

        reader.onload = async () => {
          setPhase('processing');
          await evaluateResponse(reader.result);
          resolve();
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [cleanup]);

  const evaluateResponse = async (audioBase64) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/practice/describe-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user?.id,
          audio_file: audioBase64,
          image_description: imageDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.evaluation) {
        setResult(data.evaluation);
        setPhase('complete');
        toast.success('Evaluation complete!');
      } else {
        setError('Could not evaluate response. Please try again.');
        setPhase('ready');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err.message || 'Evaluation failed');
      setPhase('ready');
      toast.error('Evaluation failed');
    }
  };

  const handleRetry = () => {
    cleanup();
    setPhase('ready');
    setCountdown(INITIAL_COUNTDOWN);
    setRecordingTime(0);
    setResult(null);
    setError('');
    audioChunksRef.current = [];
  };

  // 🔥 UI RENDERING LOGIC (100% UNTOUCHED, SAME THEME) 🔥
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="p-8 bg-dark-800 border border-dark-700">
        {/* Header */}
        <div className="mb-8">
          <Badge className="text-pink-300 border-pink-500/30 bg-pink-500/10 mb-3">
            Module 4: Describe Image
          </Badge>
          <h2 className="text-2xl font-bold text-white mb-2">Describe what you see</h2>
          <p className="text-gray-300 text-sm">
            Look at the image carefully. Describe what you see in detail.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            {/* Image Display */}
            {imageUrl && (
              <motion.img
                onLoad={() => setImageLoaded(true)}
                src={imageUrl}
                alt="Description task image"
                className="w-full h-64 object-cover rounded-lg border border-pink-500/20 mb-4"
              />
            )}

            {!imageUrl && (
              <div className="w-full h-64 bg-dark-900 border border-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-500 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-400">Image loading...</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Status Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            {/* Ready Phase */}
            <AnimatePresence>
              {phase === 'ready' && imageLoaded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-gray-300 mb-4">Take a good look at the image above.</p>
                  <p className="text-gray-300 mb-6">Recording will start in {INITIAL_COUNTDOWN} seconds.</p>
                  <Button
                    variant="primary"
                    onClick={() => setPhase('countdown')}
                    className="w-full"
                  >
                    Start Description
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown Phase */}
            <AnimatePresence>
              {phase === 'countdown' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block"
                  >
                    <div className="text-6xl font-bold text-pink-400">{countdown}</div>
                  </motion.div>
                  <p className="text-gray-300 mt-6">Get ready to describe...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recording Phase */}
            <AnimatePresence>
              {phase === 'recording' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <div className="flex items-center gap-2 text-red-400">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-sm font-semibold">Recording...</span>
                    </div>
                  </motion.div>
                  <div className="text-4xl font-bold text-white mb-4">
                    {String(recordingTime).padStart(2, '0')}s / {MAX_RECORDING_TIME}s
                  </div>
                  <Progress
                    value={(recordingTime / MAX_RECORDING_TIME) * 100}
                    label="Recording progress"
                  />
                  <p className="text-gray-400 text-sm mt-4">
                    Describe what you see. Be detailed and clear.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Phase */}
            <AnimatePresence>
              {phase === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Spinner className="mx-auto mb-4" />
                  <p className="text-gray-300">Analyzing your description...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete Phase */}
            <AnimatePresence>
              {phase === 'complete' && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-dark-900 border border-green-500/20 rounded-lg p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Overall Score</span>
                        <span className="text-3xl font-bold text-green-400">{result.score}</span>
                      </div>
                      <Progress value={result.score} label="Score" />
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {['vocabulary', 'grammar', 'fluency', 'pronunciation'].map((metric) => (
                        <div key={metric} className="bg-dark-800 rounded p-3">
                          <p className="text-gray-400 text-xs capitalize">{metric}</p>
                          <p className="text-lg font-semibold text-white">{result[metric]}</p>
                        </div>
                      ))}
                    </div>

                    {/* Feedback */}
                    <div className="bg-dark-800 rounded p-4 mb-4">
                      <p className="text-gray-300 text-sm">{result.feedback}</p>
                    </div>

                    {/* Transcript */}
                    <div className="bg-dark-800 rounded p-4 mb-4 max-h-40 overflow-y-auto">
                      <p className="text-gray-400 text-xs mb-2">YOUR DESCRIPTION</p>
                      <p className="text-white text-sm leading-relaxed">{result.transcript}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={handleRetry} className="flex-1">
                      Try Again
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onComplete(result)}
                      className="flex-1"
                    >
                      Continue →
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default DescribeImageModule;
