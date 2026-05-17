import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Badge, Progress, Spinner } from '../components/ui';
import API_BASE_URL from '../api';

/**
 * ROUND 3: CLIENT ESCALATION (STRICT COMMUNICATION)
 * Voice Only. Tests professional English under pressure.
 * Scenarios: Angry Client Voicemail & Non-Technical Executive Explanation.
 */
const ClientEscalationRound = ({ userId, onRoundComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  
  // Audio & Timer State
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scores, setScores] = useState([]);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch scenarios on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interview/round3/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });

   const data = await response.json();

console.log("Round 3 API Response:", data);

// Safe fallback prompts if backend fails
const generatedTasks = [
  {
    id: 1,
    type: "angry_client_scenario",
    title: "Client Escalation (Voicemail)",
    instruction: "You have 60 seconds to leave a professional voicemail addressing this crisis.",
    prompt:
      data?.tasks?.angry_client_scenario ||
      "A frustrated client reports that your software deployment caused downtime during peak business hours. Calm the client, acknowledge the issue, and explain immediate next steps professionally."
  },
  {
    id: 2,
    type: "tech_architecture_explain",
    title: "Executive Summary",
    instruction: "Explain this technical concept to a non-technical CEO or VP.",
    prompt:
      data?.tasks?.tech_architecture_explain ||
      "Explain to a CEO why migrating from a monolithic architecture to microservices can improve scalability, maintenance, and business continuity."
  }
];
        
        setTasks(generatedTasks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching communication tasks:', error);
        alert('Failed to load Round 3. Please check your connection.');
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Strict Recording Timer (Max 60 seconds)
  useEffect(() => {
    let timer;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isRecording && timeLeft === 0) {
      stopRecording(); // Auto-stop and submit when time is up
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // ==========================================
  // AUDIO RECORDING LOGIC
  // ==========================================
  const startRecording = async () => {
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
        // Release microphone
        stream.getTracks().forEach(track => track.stop());
        
        await processAudioSubmission(audioBlob);
      };

      setTimeLeft(60); // Reset timer
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access is required for the Communication Round.');
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
  const processAudioSubmission = async (audioBlob) => {
    setEvaluating(true);
    const currentTask = tasks[currentIndex];

    try {
      // Create FormData to send the audio file to FastAPI
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('task_type', currentTask.type);
      formData.append('audio_file', audioBlob, 'comm_response.webm');

      const response = await fetch(`${API_BASE_URL}/interview/round3/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      
      const result = await response.json();
      const taskScore = result.evaluation?.score || 0;
      
      const newScores = [...scores, taskScore];
      setScores(newScores);

      // Move to next task or finish round
      if (currentIndex < tasks.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setEvaluating(false);
      } else {
        // Calculate average score for Round 3 and complete
        const finalRoundScore = newScores.reduce((a, b) => a + b, 0) / tasks.length;
        onRoundComplete(finalRoundScore);
      }

    } catch (error) {
      console.error('Error submitting audio:', error);
      alert('Failed to process your response. Moving to next phase.');
      setEvaluating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 mt-4 font-mono animate-pulse">Generating Corporate Scenarios...</p>
      </div>
    );
  }

  const currentTask = tasks[currentIndex];

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-dark-900 p-6"
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Round 3: Pressure Communication
              </h1>
              <p className="text-gray-400">Test your professional English fluency under stress.</p>
            </div>
            <Badge variant="primary" size="lg">
              Scenario {currentIndex + 1}/{tasks.length}
            </Badge>
          </div>
          <Progress value={((currentIndex) / tasks.length) * 100} className="h-2 bg-dark-800 [&>div]:bg-green-500" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Scenario Card */}
            <Card className="p-8 border border-gray-700 bg-dark-800">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={currentTask.type === 'angry_client_scenario' ? 'danger' : 'warning'}>
                  {currentTask.title}
                </Badge>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-2">The Situation</p>
                <h2 className="text-2xl font-medium text-white leading-relaxed bg-dark-900 p-4 rounded border border-gray-700">
                  "{currentTask.prompt}"
                </h2>
              </div>

              <div>
                <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-2">Your Task</p>
                <p className="text-gray-300 italic">{currentTask.instruction}</p>
              </div>
            </Card>

            {/* Strict Recording Controls */}
            {!evaluating && (
              <Card className="p-6 bg-dark-800 border-gray-700 flex flex-col items-center justify-center py-10">
                <div className="mb-6 text-center">
                  <h3 className="text-white text-lg font-semibold mb-1">Microphone Access</h3>
                  <p className="text-gray-400 text-sm">Maintain a professional tone. No retries allowed.</p>
                </div>
                
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse mb-6 border border-red-500/50">
                      <span className="text-red-500 font-mono text-3xl font-bold">{timeLeft}s</span>
                    </div>
                    <Button variant="danger" size="lg" onClick={stopRecording} className="px-10">
                      ⏹ Stop & Submit Voicemail
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" size="lg" onClick={startRecording} className="px-10 bg-green-600 hover:bg-green-700 border-none">
                    🎤 Start Recording (1 Attempt)
                  </Button>
                )}
              </Card>
            )}

            {evaluating && (
              <Card className="p-10 flex flex-col items-center justify-center border-green-500/30 bg-green-900/10">
                <Spinner size="lg" className="text-green-500 mb-4" />
                <p className="text-green-400 font-mono text-center">
                  Cloudflare AI is analyzing your fluency, grammar, and tone...
                </p>
              </Card>
            )}

          </div>

          {/* Right Panel - Strict Rules Tracker */}
          <div className="space-y-6">
            <Card className="p-5 bg-red-500/10 border-red-500/30">
              <p className="text-sm text-red-400 font-semibold mb-3">
                ⚠️ Evaluation Criteria
              </p>
              <ul className="text-xs text-red-300/80 space-y-3">
                <li>• <strong>Fluency:</strong> Avoid "ums" and "ahs". Speak confidently.</li>
                <li>• <strong>Grammar:</strong> Use proper sentence structures.</li>
                <li>• <strong>Tone:</strong> Maintain a calm, professional, and de-escalating tone.</li>
                <li>• <strong>One Attempt:</strong> Audio is submitted the moment you click Stop.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientEscalationRound;