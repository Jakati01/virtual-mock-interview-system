import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../ui';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

const ReadAloudModule = ({ sentence, onComplete, questionIndex, totalQuestions }) => {
  const [phase, setPhase] = useState('ready'); // ready, counting, recording, processing, complete
  const [countdown, setCountdown] = useState(2);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const user = useAuthStore((state) => state.user);

  const MAX_RECORDING_TIME = 15; // seconds
  const INITIAL_COUNTDOWN = 2; // seconds

  // Cleanup function
 // 1. FIRST: Define the cleanup function so React knows what it is
  const cleanup = useCallback(() => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  // 2. SECOND: Reset the module state entirely when a new sentence is passed in
  useEffect(() => {
    cleanup();
    setPhase('ready');
    setCountdown(INITIAL_COUNTDOWN);
    setRecordingTime(0);
    setResult(null);
    setError('');
    audioChunksRef.current = [];
  }, [sentence, cleanup]);

  // Start recording after countdown
  useEffect(() => {
    if (phase !== 'ready') return;

    const startCountdown = async () => {
      setPhase('counting');
      let count = INITIAL_COUNTDOWN;
      setCountdown(count);

      countdownIntervalRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);

        if (count === 0) {
          clearInterval(countdownIntervalRef.current);
          initializeRecording();
        }
      }, 1000);
    };

    const timer = setTimeout(startCountdown, 500);
    return () => clearTimeout(timer);
  }, [phase]);

  // Recording timer
  useEffect(() => {
    if (phase !== 'recording') return;

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= MAX_RECORDING_TIME) {
          stopRecordingAndEvaluate();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(recordingIntervalRef.current);
  }, [phase]);

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
      setPhase('processing');
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/practice/read-aloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user?.id,
          audio_file: audioBase64,
          sentence: sentence,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.detail || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Check for valid evaluation response
      if (!data.success) {
        throw new Error(data.message || 'Evaluation failed - please try again');
      }
      
      if (!data.evaluation) {
        throw new Error('No evaluation returned from server - please check API configuration');
      }
      
      // Verify evaluation has required fields
      if (typeof data.evaluation.score === 'undefined') {
        throw new Error('Invalid evaluation response - missing score');
      }
      
      setResult(data.evaluation);
      setPhase('complete');
      toast.success('Evaluation complete!');
    } catch (err) {
      console.error('Evaluation error:', err);
      
      // Provide specific error messages
      let errorMsg = err.message || 'Evaluation failed';
      
      if (errorMsg.includes('API key')) {
        errorMsg = 'Server configuration error: API key missing. Contact admin.';
      } else if (errorMsg.includes('JSON')) {
        errorMsg = 'Server error: Invalid response format. Try again.';
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Cannot fetch')) {
        errorMsg = 'Server connection failed. Check if backend is running.';
      }
      
      setError(errorMsg);
      setPhase('ready');
      toast.error(errorMsg);
    }
  };

  const handleRetry = () => {
    cleanup();
    setPhase('ready');
    setCountdown(2);
    setRecordingTime(0);
    setResult(null);
    setError('');
    audioChunksRef.current = [];
  };

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
          <Badge className="text-blue-300 border-blue-500/30 bg-blue-500/10 mb-3">
            Module 1: Read Aloud
          </Badge>
          <h2 className="text-2xl font-bold text-white mb-2">Read the sentence aloud</h2>
          <div className="mb-4 text-right">
  <span className="text-sm text-gray-400">
    Question {questionIndex + 1} of {totalQuestions}
  </span>
</div>
          <p className="text-gray-300 text-sm">You have 45 seconds total. Recording starts in 2 seconds.</p>
        </div>

        {/* Sentence Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-900 border border-blue-500/20 rounded-lg p-6 mb-8"
        >
          <p className="text-lg text-white text-center font-serif leading-relaxed">
            {sentence}
          </p>
        </motion.div>

        {/* Status & Timer */}
        <div className="mb-8 space-y-4">
          {phase === 'ready' && (
            <div className="text-center">
              <p className="text-gray-300 mb-4">Click below to start test</p>
              <Button
                variant="primary"
                onClick={() => setPhase('ready')}
                className="mx-auto"
              >
                Start Reading
              </Button>
            </div>
          )}

          {phase === 'counting' && (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block"
              >
                <div className="text-6xl font-bold text-blue-400">{countdown}</div>
              </motion.div>
              <p className="text-gray-300 mt-4">Get ready to read...</p>
            </div>
          )}

          {phase === 'recording' && (
            <div className="text-center">
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
              <div className="text-4xl font-bold text-white">
                {String(recordingTime).padStart(2, '0')}s
              </div>
              <div className="mt-4">
                <Progress
                  value={(recordingTime / MAX_RECORDING_TIME) * 100}
                  label="Recording progress"
                />
              </div>
            </div>
          )}

          {phase === 'processing' && (
            <div className="text-center">
              <Spinner className="mx-auto mb-4" />
              <p className="text-gray-300">Evaluating your response...</p>
            </div>
          )}

          {phase === 'complete' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                  {['pronunciation', 'fluency', 'grammar', 'vocabulary'].map((metric) => (
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
                <div className="bg-dark-800 rounded p-4 mb-4">
                  <p className="text-gray-400 text-xs mb-2">YOUR RESPONSE</p>
                  <p className="text-white text-sm italic">{result.transcript}</p>
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
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default ReadAloudModule;
