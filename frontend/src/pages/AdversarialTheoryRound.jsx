import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../components/ui';
import API_BASE_URL from '../api';

/**
 * ROUND 2: ADVERSARIAL AI THEORY (STRICT MODE)
 * Voice Only. No Retries.
 * AI actively challenges the candidate's spoken answer with a follow-up.
 */
const AdversarialTheoryRound = ({ userId, onRoundComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Phase tracking: 'INITIAL_QUESTION' -> 'EVALUATING_INITIAL' -> 'FOLLOW_UP_QUESTION' -> 'EVALUATING_FOLLOWUP'
  const [phase, setPhase] = useState('INITIAL_QUESTION'); 
  const [followUpData, setFollowUpData] = useState(null);
  
  // Audio & Timer State
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scores, setScores] = useState([]); 

  // 🟢 NEW: State for Text-To-Speech
  const [currentQuestionText, setCurrentQuestionText] = useState('');

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch initial questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interview/round2/generate-initial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            user_id: userId,
            job_description: "Seeking a Full Stack Developer with strong architectural skills.",
            domain: "Software Engineering"
          }),
        });

        const data = await response.json();
        setQuestions(data.questions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to load Round 2. Please check your connection.');
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [userId]);

  // Strict Recording Timer (Max 60 seconds)
  useEffect(() => {
    let timer;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isRecording && timeLeft === 0) {
      stopRecording(); // Auto-stop when time is up
    }
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeLeft]);

  // ==========================================
  // 🟢 NEW: TEXT-TO-SPEECH LOGIC (Web Speech API)
  // ==========================================
  
  // 1. Determine what text needs to be spoken
  useEffect(() => {
    if (phase === 'INITIAL_QUESTION' && questions.length > 0) {
      setCurrentQuestionText(questions[currentIndex]?.question || '');
    } else if (phase === 'FOLLOW_UP_QUESTION' && followUpData) {
      setCurrentQuestionText(followUpData?.follow_up_question || '');
    } else {
      setCurrentQuestionText(''); // Clear text when evaluating so it stops talking
    }
  }, [phase, currentIndex, questions, followUpData]);

  // 2. Speak the text when it changes
  useEffect(() => {
    if (currentQuestionText) {
      // Stop any currently playing speech to avoid overlap
      window.speechSynthesis.cancel(); 

      const speech = new SpeechSynthesisUtterance(currentQuestionText);
      speech.rate = 0.95; // Slightly slower, more professional pace
      speech.pitch = 1.0; 
      speech.lang = 'en-US'; 

      window.speechSynthesis.speak(speech);
    }

    // Cleanup: Stop speaking if user unmounts or leaves the component early
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentQuestionText]);

  // ==========================================
  // AUDIO RECORDING LOGIC
  // ==========================================
  const startRecording = async () => {
    // 🟢 Stop the AI from talking if the user starts recording
    window.speechSynthesis.cancel();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (phase === 'INITIAL_QUESTION') {
          await processInitialAnswer(audioBlob);
        } else if (phase === 'FOLLOW_UP_QUESTION') {
          await processFollowUpAnswer(audioBlob);
        }
      };

      setTimeLeft(60); // Reset timer
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access is required for the Real Interview.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ==========================================
  // API PROCESSING LOGIC
  // ==========================================
  const processInitialAnswer = async (audioBlob) => {
    setPhase('EVALUATING_INITIAL');
    const currentQ = questions[currentIndex];

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('question_type', currentQ.question_type);
      formData.append('prompt_text', currentQ.question);
      formData.append('expected_keywords', JSON.stringify(currentQ.expected_keywords));
      formData.append('audio_file', audioBlob, 'initial_answer.webm');

      const evalRes = await fetch(`${API_BASE_URL}/practice/theory/evaluate-audio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const evalData = await evalRes.json();
      const transcript = evalData.data.transcript;
      const initialScore = evalData.data.evaluation.final_score;

      const followUpRes = await fetch(`${API_BASE_URL}/interview/round2/adversarial-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          previous_question: currentQ.question,
          candidate_transcript: transcript
        }),
      });
      const followUpDataResponse = await followUpRes.json();

      setFollowUpData({ ...followUpDataResponse.followup_task, initialScore });
      setPhase('FOLLOW_UP_QUESTION');

    } catch (error) {
      console.error('Error processing initial answer:', error);
      alert('Failed to process audio. Please check connection.');
      setPhase('INITIAL_QUESTION'); 
    }
  };

  const processFollowUpAnswer = async (audioBlob) => {
    setPhase('EVALUATING_FOLLOWUP');

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('question_type', 'FOLLOW_UP');
      formData.append('prompt_text', followUpData.follow_up_question);
      formData.append('expected_keywords', JSON.stringify(followUpData.expected_keywords));
      formData.append('audio_file', audioBlob, 'followup_answer.webm');

      const evalRes = await fetch(`${API_BASE_URL}/practice/theory/evaluate-audio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const evalData = await evalRes.json();
      const followUpScore = evalData.data.evaluation.final_score;

      const questionAverage = (followUpData.initialScore + followUpScore) / 2;
      setScores(prev => [...prev, questionAverage]);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setPhase('INITIAL_QUESTION');
        setFollowUpData(null);
      } else {
        const finalRoundScore = [...scores, questionAverage].reduce((a, b) => a + b, 0) / questions.length;
        onRoundComplete(finalRoundScore);
      }

    } catch (error) {
      console.error('Error processing follow-up:', error);
      alert('Failed to process follow-up answer.');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 mt-4 font-mono animate-pulse">Initializing AI Interviewer...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isEvaluating = phase === 'EVALUATING_INITIAL' || phase === 'EVALUATING_FOLLOWUP';

  return (
    <motion.div
      key={currentIndex + phase}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6"
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Round 2: Adversarial AI Theory
              </h1>
              <p className="text-gray-400">Speak clearly. You only get one attempt per question.</p>
            </div>
            <Badge variant="primary" size="lg">
              Topic {currentIndex + 1}/{questions.length}
            </Badge>
          </div>
          <Progress value={((currentIndex) / questions.length) * 100} className="h-2 bg-dark-800 [&>div]:bg-purple-500" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Question Card */}
            <Card className={`p-8 border ${phase === 'FOLLOW_UP_QUESTION' ? 'border-orange-500/50 bg-orange-900/10' : 'border-gray-700'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={phase === 'FOLLOW_UP_QUESTION' ? 'warning' : 'primary'}>
                  {phase === 'FOLLOW_UP_QUESTION' ? 'AI Challenge (Follow-Up)' : currentQ?.question_type}
                </Badge>
              </div>
              
              <h2 className="text-2xl font-medium text-white leading-relaxed">
                {phase === 'INITIAL_QUESTION' && currentQ?.question}
                {phase === 'FOLLOW_UP_QUESTION' && followUpData?.follow_up_question}
                {isEvaluating && <span className="text-gray-500 italic">Processing your response...</span>}
              </h2>

              {/* Code Snippet (if visual question) */}
              {phase === 'INITIAL_QUESTION' && currentQ?.code_snippet && (
                <div className="mt-6 p-4 bg-dark-900 rounded-lg font-mono text-sm text-teal-300 overflow-x-auto border border-gray-700">
                  <pre>{currentQ.code_snippet}</pre>
                </div>
              )}
            </Card>

            {/* Strict Recording Controls */}
            {!isEvaluating && (
              <Card className="p-6 bg-dark-800 border-gray-700 flex flex-col items-center justify-center py-10">
                <div className="mb-6 text-center">
                  <h3 className="text-white text-lg font-semibold mb-1">Microphone Active</h3>
                  <p className="text-gray-400 text-sm">Do not read from notes. Look at the camera.</p>
                </div>
                
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse mb-6 border border-red-500/50">
                      <span className="text-red-500 font-mono text-3xl font-bold">{timeLeft}s</span>
                    </div>
                    <Button variant="danger" size="lg" onClick={stopRecording} className="px-10">
                      ⏹ Stop & Submit Answer
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" size="lg" onClick={startRecording} className="px-10 bg-purple-600 hover:bg-purple-700 border-none">
                    🎤 Start Recording (1 Attempt)
                  </Button>
                )}
              </Card>
            )}

            {isEvaluating && (
              <Card className="p-10 flex flex-col items-center justify-center border-purple-500/30 bg-purple-900/10">
                <Spinner size="lg" className="text-purple-500 mb-4" />
                <p className="text-purple-400 font-mono text-center">
                  {phase === 'EVALUATING_INITIAL' ? "AI is analyzing your transcript and generating a challenge..." : "Finalizing score..."}
                </p>
              </Card>
            )}

          </div>

          {/* Right Panel - Strict Rules Tracker */}
          <div className="space-y-6">
            <Card className="p-5 bg-red-500/10 border-red-500/30">
              <p className="text-sm text-red-400 font-semibold mb-3">
                ⚠️ Voice Round Rules
              </p>
              <ul className="text-xs text-red-300/80 space-y-3">
                <li>• <strong>No Text Input:</strong> You must speak your answer clearly.</li>
                <li>• <strong>One Attempt:</strong> You cannot pause, delete, or re-record your audio.</li>
                <li>• <strong>AI Challenge:</strong> The AI will ask a follow-up question based specifically on what you just said.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdversarialTheoryRound;