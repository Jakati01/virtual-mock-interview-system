import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { practiceService } from '../api';
import { useAuthStore } from '../store';
import { Badge, Button, Card, Progress, Skeleton, Spinner } from '../components/ui';

const getQuestionText = (question) =>
  question?.question || question?.text || question?.prompt || question?.title || '';

const normalizeQuestions = (response) => {
  const raw =
    response?.data?.questions ||
    response?.data?.theory_questions ||
    response?.questions ||
    response?.theory_questions ||
    response?.data ||
    response;

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `theory-${index + 1}`,
          question: item,
          question_type: 'technical',
        };
      }

      return {
        id: item?.id || item?.question_id || `theory-${index + 1}`,
        question: getQuestionText(item),
        question_type: item?.question_type || item?.type || 'technical',
        difficulty: item?.difficulty || 'discussion',
        expected_keywords: Array.isArray(item?.expected_keywords) ? item.expected_keywords : [],
      };
    })
    .filter((item) => item.question);
};

const getScoreFromEvaluation = (evaluation) => {
  const score =
    evaluation?.data?.score ??
    evaluation?.score ??
    evaluation?.overall_score ??
    evaluation?.data?.overall_score ??
    evaluation?.data?.percentage ??
    evaluation?.data?.evaluation?.final_score ??
    evaluation?.evaluation?.final_score;

  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 0;
  if (numericScore <= 5) return Math.round(numericScore * 20);
  if (numericScore <= 10) return Math.round(numericScore * 10);
  return Math.min(Math.round(numericScore), 100);
};

const getEvaluationDetails = (evaluation) => {
  const data = evaluation?.data || evaluation || {};
  const rubric = data.evaluation || data;

  return {
    score: getScoreFromEvaluation(evaluation),
    transcript: data.transcript || rubric.transcript || '',
    feedback: rubric.feedback || data.feedback || 'Feedback was not returned for this answer.',
    strengths: Array.isArray(rubric.strengths) ? rubric.strengths : [],
    weaknesses: Array.isArray(rubric.weaknesses) ? rubric.weaknesses : [],
    understanding: rubric.understanding,
    clarity: rubric.clarity,
    completeness: rubric.completeness,
  };
};

const TheoryRound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const testedSkill = location.state?.skillToTest || location.state?.skill || 'Technical Skills';
  const targetDomain = location.state?.domain || 'Software Development';
  const mcqScore = location.state?.mcqScore ?? location.state?.totalQuestions ?? 0;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [finalResults, setFinalResults] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const currentQ = questions[currentIndex];
  const currentQuestionText = getQuestionText(currentQ);
  const totalQuestions = questions.length;
  const hasAnsweredCurrent = Boolean(evaluations[currentIndex]);
  const currentEvaluation = hasAnsweredCurrent ? getEvaluationDetails(evaluations[currentIndex]) : null;

  const progressValue = useMemo(() => {
    if (!totalQuestions) return 0;
    return ((currentIndex + 1) / totalQuestions) * 100;
  }, [currentIndex, totalQuestions]);

  const speakQuestion = useCallback((text) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await practiceService.generateTheory(testedSkill, targetDomain);
        const normalizedQuestions = normalizeQuestions(response);

        if (!normalizedQuestions.length) {
          throw new Error('No theory questions were returned from the backend.');
        }

        setQuestions(normalizedQuestions);
      } catch (err) {
        setError(err.message || 'Failed to load the theory round.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [targetDomain, testedSkill]);

  useEffect(() => {
    if (!currentQuestionText || loading || error) return;

    const timeoutId = window.setTimeout(() => {
      speakQuestion(currentQuestionText);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuestionText, error, loading, speakQuestion]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Your browser does not support microphone recording.');
      return;
    }

    try {
      window.speechSynthesis?.cancel();
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());
        submitAudioAnswer();
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Microphone permission is required for the theory round.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAudioAnswer = async () => {
    if (!audioChunksRef.current.length || !currentQ) return;

    try {
      setIsSubmittingAnswer(true);

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('user_id', String(user?.id || user?.user_id || 'guest'));
      formData.append('question_type', currentQ.question_type || 'CONCEPT');
      formData.append('prompt_text', currentQuestionText);
      formData.append('expected_keywords', JSON.stringify(currentQ.expected_keywords || []));
      formData.append('audio_file', audioBlob, `theory-question-${currentIndex + 1}.webm`);

      const evaluation = await practiceService.evaluateDiscussionAudio(formData);
      setEvaluations((prev) => ({
        ...prev,
        [currentIndex]: evaluation,
      }));
      toast.success('Answer submitted and evaluated.');
    } catch (err) {
      toast.error(err.message || 'Failed to evaluate your answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const finishRound = async () => {
    const evaluationList = Object.values(evaluations);
    const averageScore = evaluationList.length
      ? Math.round(
          evaluationList.reduce((total, evaluation) => total + getScoreFromEvaluation(evaluation), 0) /
            evaluationList.length
        )
      : 0;

    const results = {
      score: averageScore,
      totalAnswered: evaluationList.length,
      totalQuestions,
    };

    setFinalResults(results);

    try {
      if (user?.id) {
        await practiceService.completeDiscussionRound({
          user_id: user.id,
          skill: testedSkill,
          domain: targetDomain,
          score: averageScore,
          evaluations: evaluationList,
        });
      }
    } catch {
      toast.error('Theory score calculated, but saving it failed.');
    }
  };

  const handleNext = () => {
    if (!hasAnsweredCurrent) return;

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setRecordingTime(0);
      return;
    }

    finishRound();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-[36rem]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] py-8 px-4 flex items-center justify-center">
        <Card className="p-8 border border-red-500/30 bg-red-500/10 max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">Round Unavailable</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/practice')}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (finalResults) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6 flex items-center justify-center font-sans">
        <Card className="bg-[#1e293b] rounded-xl p-8 border border-slate-700 max-w-2xl w-full text-center shadow-2xl">
          <Badge className="bg-blue-900/50 text-blue-400 border border-blue-800 mb-6">
            ROUND 2 COMPLETE
          </Badge>

          <h2 className="text-3xl font-bold text-white mb-2">Technical Discussion Results</h2>
          <p className="text-slate-400 mb-8">Performance breakdown for {testedSkill}.</p>

          <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-8 mb-8 shadow-inner">
            <p className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Discussion Score
            </p>
            <div className={`text-6xl font-bold ${finalResults.score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {finalResults.score}%
            </div>
            <p className="text-slate-500 mt-3">
              Answered {finalResults.totalAnswered} of {finalResults.totalQuestions} questions
            </p>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg"
            onClick={() =>
              navigate('/practice/communication', {
                state: {
                  skillToTest: testedSkill,
                  domain: targetDomain,
                  mcqScore,
                  theoryScore: finalResults.score,
                  theoryAnswers: Object.values(evaluations),
                },
              })
            }
          >
            Proceed to Round 3: Communication Assessment
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-[#0f172a] py-8 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-xl text-center">
          <h2 className="text-2xl font-semibold text-white mb-3">No Question Available</h2>
          <p className="text-gray-400 mb-6">The round loaded, but no current question could be displayed.</p>
          <Button variant="primary" onClick={() => navigate('/practice')}>
            Return to Practice
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <Badge className="text-blue-300 border-blue-500/30 bg-blue-500/10 mb-3">
              Practice Round 2
            </Badge>
            <h1 className="text-4xl font-bold text-white">Technical Discussion</h1>
            <p className="text-gray-400 mt-2 max-w-2xl">
              Answer {totalQuestions} technical prompts using your voice. Treat this like a live interview.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="success">{testedSkill}</Badge>
            <Badge variant="default">{targetDomain}</Badge>
            <Badge variant="default">MCQ Score: {mcqScore}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 p-6 bg-[#1e293b] border-slate-700 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">Round Progress</h2>
            <Progress value={progressValue} label={`Question ${currentIndex + 1} of ${totalQuestions}`} />

            <div className="grid grid-cols-5 gap-2 mt-6">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-10 rounded-lg text-sm font-semibold transition-all ${
                    currentIndex === index
                      ? 'bg-blue-500 text-white shadow-glow'
                      : evaluations[index]
                        ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-3 p-8 bg-[#1e293b] border-slate-700">
            <div className="flex justify-between items-center gap-4 mb-6 flex-wrap">
              <span className="text-slate-500 uppercase tracking-wider text-sm font-semibold">
                {currentQ.question_type} question
              </span>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                Question {currentIndex + 1}
              </Badge>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4 leading-9">{currentQuestionText}</h2>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Button
                variant="secondary"
                onClick={() => speakQuestion(currentQuestionText)}
                disabled={isSpeaking}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {isSpeaking ? 'Speaking Question...' : 'Replay Question'}
              </Button>
              {hasAnsweredCurrent && (
                <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                  Answer submitted
                </Badge>
              )}
            </div>

            <div className="mt-8 bg-[#0f172a] border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
              {isSubmittingAnswer ? (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <Spinner />
                  <p>Evaluating your answer...</p>
                </div>
              ) : isRecording ? (
                <div>
                  <div className="text-red-400 font-bold text-4xl animate-pulse mb-6">
                    {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
                    {String(recordingTime % 60).padStart(2, '0')}
                  </div>
                  <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full" onClick={stopRecording}>
                    Stop and Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Record your explanation when you are ready. You can replay the prompt anytime.
                  </p>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full"
                    onClick={startRecording}
                    disabled={hasAnsweredCurrent}
                  >
                    {hasAnsweredCurrent ? 'Answer Recorded' : 'Start Recording Answer'}
                  </Button>
                </div>
              )}
            </div>

            {currentEvaluation && (
              <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-green-300 mb-1">Answer Feedback</p>
                    <h3 className="text-xl font-semibold text-white">Your response scored {currentEvaluation.score}%</h3>
                  </div>
                  <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                    Evaluated
                  </Badge>
                </div>

                <p className="text-slate-200 leading-7 mb-4">{currentEvaluation.feedback}</p>

                {(currentEvaluation.understanding !== undefined ||
                  currentEvaluation.clarity !== undefined ||
                  currentEvaluation.completeness !== undefined) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-[#0f172a] border border-white/10 p-3">
                      <p className="text-xs text-slate-500 uppercase">Understanding</p>
                      <p className="text-lg font-bold text-white">{currentEvaluation.understanding ?? '-'}/5</p>
                    </div>
                    <div className="rounded-lg bg-[#0f172a] border border-white/10 p-3">
                      <p className="text-xs text-slate-500 uppercase">Clarity</p>
                      <p className="text-lg font-bold text-white">{currentEvaluation.clarity ?? '-'}/5</p>
                    </div>
                    <div className="rounded-lg bg-[#0f172a] border border-white/10 p-3">
                      <p className="text-xs text-slate-500 uppercase">Completeness</p>
                      <p className="text-lg font-bold text-white">{currentEvaluation.completeness ?? '-'}/5</p>
                    </div>
                  </div>
                )}

                {currentEvaluation.transcript && (
                  <div className="rounded-lg bg-[#0f172a] border border-white/10 p-4">
                    <p className="text-xs text-slate-500 uppercase mb-2">What you said</p>
                    <p className="text-slate-300 leading-6">{currentEvaluation.transcript}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button variant="primary" onClick={handleNext} disabled={!hasAnsweredCurrent || isSubmittingAnswer || isRecording}>
                {currentIndex === totalQuestions - 1 ? 'Finish Discussion Round' : 'Next Question'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TheoryRound;
