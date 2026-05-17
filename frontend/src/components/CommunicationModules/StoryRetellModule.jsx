import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../ui';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

const StoryRetellModule = ({ story, storySummary, onComplete, onSkip }) => {
  const [phase, setPhase] = useState('playing'); // playing, ready, recording, processing, complete
  const [canReplay, setCanReplay] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const synthRef = useRef(null);

  const user = useAuthStore((state) => state.user);

  const MAX_RECORDING_TIME = 30; // seconds
  const MIN_RECORDING_TIME = 10; // minimum to submit

// 1. FIRST: Define the complete cleanup function
  const cleanup = useCallback(() => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    window.speechSynthesis.cancel(); // Force stop any stuck audio
  }, []);

  // 2. SECOND: Wipe state and auto-play ONLY when the story data arrives
  useEffect(() => {
    // Prevent it from crashing if the story hasn't loaded from the API yet
    if (!story) return;

    cleanup();
    setPhase('playing');
    setCanReplay(true);
    setRecordingTime(0);
    setResult(null);
    setError('');
    audioChunksRef.current = [];
    setIsPlayingAudio(true);

    const playStory = () => {
      const utterance = new SpeechSynthesisUtterance(story);
      utterance.rate = 0.85; // Slower for story
      utterance.pitch = 0.95;
      synthRef.current = utterance;

      utterance.onend = () => {
        setIsPlayingAudio(false);
        setTimeout(() => {
          setPhase('recording');
          initializeRecording();
        }, 1000);
      };

      window.speechSynthesis.speak(utterance);
    };

    playStory();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [story, cleanup]);
  
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
      setRecordingTime(0);
    } catch (err) {
      setError('Microphone access denied. Please enable microphone and try again.');
      setPhase('playing');
    }
  };

  const handleReplay = async () => {
    if (!canReplay) {
      toast.error('You have already used your one replay');
      return;
    }

    cleanup();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    setCanReplay(false);
    setIsPlayingAudio(true);
    setRecordingTime(0);
    audioChunksRef.current = [];

    const utterance = new SpeechSynthesisUtterance(story);
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    synthRef.current = utterance;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setTimeout(() => {
        initializeRecording();
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
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
      const response = await fetch('http://127.0.0.1:8000/api/v1/practice/story-retell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user?.id,
          audio_file: audioBase64,
          story_summary: storySummary,
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
        setPhase('playing');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err.message || 'Evaluation failed');
      setPhase('playing');
      toast.error('Evaluation failed');
    }
  };

  const handleRetry = () => {
    cleanup();
    setPhase('playing');
    setCanReplay(true);
    setRecordingTime(0);
    setResult(null);
    setError('');
    audioChunksRef.current = [];
    setIsPlayingAudio(true);

    const utterance = new SpeechSynthesisUtterance(story);
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    synthRef.current = utterance;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setTimeout(() => {
        setPhase('recording');
        initializeRecording();
      }, 1000);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleManualSubmit = () => {
    if (recordingTime < MIN_RECORDING_TIME) {
      toast.error(`Please speak for at least ${MIN_RECORDING_TIME} seconds`);
      return;
    }
    stopRecordingAndEvaluate();
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
          <Badge className="text-orange-300 border-orange-500/30 bg-orange-500/10 mb-3">
            Module 3: Story Retelling
          </Badge>
          <h2 className="text-2xl font-bold text-white mb-2">Listen and retell the story</h2>
          <p className="text-gray-300 text-sm">
            Listen to the story carefully. Then retell it in your own words.
          </p>
        </div>

        {/* Main Content */}
        <div className="mb-8 space-y-6">
          {/* Playing Phase */}
          <AnimatePresence>
            {(phase === 'playing' || isPlayingAudio) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block mb-6"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center border border-orange-500/30">
                    <motion.svg
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="w-14 h-14 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </motion.svg>
                  </div>
                </motion.div>
                <p className="text-white text-lg font-semibold mb-2">Listening to story...</p>
                <motion.p
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-gray-400"
                >
                  Pay close attention to details
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Phase */}
          <AnimatePresence>
            {phase === 'recording' && !isPlayingAudio && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Timer */}
                <div className="text-center">
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <div className="flex items-center gap-2 text-red-400 text-lg font-semibold">
                      <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                      Recording...
                    </div>
                  </motion.div>

                  <div className="text-5xl font-bold text-white mb-6">
                    {String(recordingTime).padStart(2, '0')}s / {MAX_RECORDING_TIME}s
                  </div>

                  <Progress
                    value={(recordingTime / MAX_RECORDING_TIME) * 100}
                    label="Recording progress"
                    className="mb-6"
                  />
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleReplay}
                    disabled={!canReplay}
                    className="flex-1"
                  >
                    {canReplay ? 'Replay Story' : 'Replay Used'}
                  </Button>
                  {recordingTime >= MIN_RECORDING_TIME && (
                    <Button
                      variant="primary"
                      onClick={handleManualSubmit}
                      className="flex-1"
                    >
                      Submit
                    </Button>
                  )}
                </div>

                <p className="text-gray-400 text-sm text-center">
                  Speak clearly. Retell the story in detail. Auto-submit at {MAX_RECORDING_TIME}s.
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
                <p className="text-gray-300">Analyzing your retelling...</p>
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
                    {['fluency', 'comprehension', 'grammar', 'vocabulary'].map((metric) => (
                      <div key={metric} className="bg-dark-800 rounded p-3">
                        <p className="text-gray-400 text-xs capitalize">{metric}</p>
                        <p className="text-lg font-semibold text-white">{result[metric] || result.fluency}</p>
                      </div>
                    ))}
                  </div>

                  {/* Feedback */}
                  <div className="bg-dark-800 rounded p-4 mb-4">
                    <p className="text-gray-300 text-sm">{result.feedback}</p>
                  </div>

                  {/* Transcript */}
                  <div className="bg-dark-800 rounded p-4 mb-4 max-h-48 overflow-y-auto">
                    <p className="text-gray-400 text-xs mb-2">YOUR RETELLING</p>
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

export default StoryRetellModule;
