import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';
import { resumeService } from '../api';
import { Button, Card, Skeleton } from '../components/ui';
import { Badge } from '../components/ui';

void motion;

const Resume = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const isPdfFile = (selectedFile) => {
    if (!selectedFile) return false;

    const fileName = selectedFile.name?.toLowerCase() || '';
    return selectedFile.type === 'application/pdf' || fileName.endsWith('.pdf');
  };

  const processSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    if (isPdfFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
      return;
    }

    setFile(null);
    setError('Please select a valid PDF file');
  };

  const openFilePicker = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      processSelectedFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    processSelectedFile(selectedFile);

    // Allow selecting the same file again after clearing or retrying.
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!file || !user?.id) {
      setError('File or user ID missing');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      console.log(`Uploading to /api/v1/resume/upload/${user.id}`);
      
      const response = await resumeService.upload(user.id, formData);
      
      console.log('Upload response:', response);
      
      if (response?.analysis) {
        setAnalysis(response.analysis);
        localStorage.setItem('practiceProfile', JSON.stringify({
          extractedSkills: response.analysis.extracted_skills || [],
          suitableDomains: response.analysis.suitable_domains || [],
          atsScore: response.analysis.overall_ats_score || 0,
          uploadedAt: new Date().toISOString(),
        }));
      } else if (response?.data?.analysis) {
        setAnalysis(response.data.analysis);
        localStorage.setItem('practiceProfile', JSON.stringify({
          extractedSkills: response.data.analysis.extracted_skills || [],
          suitableDomains: response.data.analysis.suitable_domains || [],
          atsScore: response.data.analysis.overall_ats_score || 0,
          uploadedAt: new Date().toISOString(),
        }));
      } else {
        console.error('Unexpected response structure:', response);
        setError('Upload successful but no analysis data received');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload resume. Please check the file and try again.');
    } finally {
      setUploading(false);
    }
  };

  // ATS Score color based on range
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return '🚀 Outstanding';
    if (score >= 80) return '✨ Excellent';
    if (score >= 70) return '⭐ Good';
    if (score >= 60) return '👍 Average';
    return '📈 Needs Work';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Resume Analysis</h1>
          <p className="text-gray-400">Upload your resume to get AI-powered ATS score and recommendations</p>
        </motion.div>

        {/* Upload Section */}
        {!analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-8 border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 transition-colors">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                role="button"
                tabIndex={uploading ? -1 : 0}
                aria-disabled={uploading}
                className={`text-center cursor-pointer transition-all ${
                  dragActive ? 'bg-blue-500/10 rounded-lg' : ''
                }`}
              >
                <div className="mb-4">
                  <div className="text-5xl mb-4">📄</div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {file ? file.name : 'Drag and drop your resume here'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {file ? 'Click below to choose a different file' : 'or click to select a PDF file'}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                  disabled={uploading}
                />

                <Button
                  variant="primary"
                  disabled={uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    openFilePicker();
                  }}
                >
                  {uploading ? 'Analyzing...' : 'Select PDF File'}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400">⚠️ {error}</p>
                </div>
              )}

              {file && !uploading && !analysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex gap-4"
                >
                  <Button variant="primary" onClick={handleUpload}>
                    Upload & Analyze
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFile(null);
                      setError(null);
                    }}
                  >
                    Clear
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card className="p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-white font-semibold">AI is analyzing your resume...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
              </div>
              <Skeleton className="h-12 mb-4" />
              <Skeleton className="h-8 mb-2" />
              <Skeleton className="h-8 mb-2" />
              <Skeleton className="h-8" />
            </Card>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ATS Score Card */}
            <Card className={`p-8 border-2 ${getScoreBgColor(analysis.overall_ats_score)}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="8"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${(analysis.overall_ats_score / 100) * 565} 565`}
                        className={getScoreColor(analysis.overall_ats_score)}
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className={`text-5xl font-bold ${getScoreColor(analysis.overall_ats_score)}`}>
                        {analysis.overall_ats_score}
                      </div>
                      <div className="text-gray-400 text-sm">/ 100</div>
                    </div>
                  </div>
                  <p className={`mt-4 text-lg font-semibold ${getScoreColor(analysis.overall_ats_score)}`}>
                    {getScoreLabel(analysis.overall_ats_score)}
                  </p>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <h3 className="text-2xl font-bold text-white mb-4">Score Breakdown</h3>
                  
                  {/* Keyword Match */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">📚 Keyword Match</span>
                      <span className="font-semibold text-blue-400">
                        {analysis.score_breakdown?.keyword_match || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${analysis.score_breakdown?.keyword_match || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Formatting */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">🎨 Formatting</span>
                      <span className="font-semibold text-purple-400">
                        {analysis.score_breakdown?.formatting || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${analysis.score_breakdown?.formatting || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">📊 Impact Metrics</span>
                      <span className="font-semibold text-green-400">
                        {analysis.score_breakdown?.impact_metrics || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${analysis.score_breakdown?.impact_metrics || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feedback Card */}
            {analysis.feedback && (
              <Card className="p-6 bg-blue-500/5 border border-blue-500/30">
                <h3 className="text-xl font-bold text-white mb-3">💡 Recruiter Feedback</h3>
                <p className="text-gray-300 leading-relaxed">{analysis.feedback}</p>
              </Card>
            )}

            {/* Skills Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Extracted Skills */}
              {analysis.extracted_skills && analysis.extracted_skills.length > 0 && (
                <Card className="p-6 bg-green-500/5 border border-green-500/30">
                  <h3 className="text-lg font-bold text-white mb-4">✨ Extracted Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extracted_skills.map((skill, idx) => (
                      <Badge key={idx} variant="success">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Missing Skills */}
              {analysis.missing_skills && analysis.missing_skills.length > 0 && (
                <Card className="p-6 bg-orange-500/5 border border-orange-500/30">
                  <h3 className="text-lg font-bold text-white mb-4">⚠️ Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.map((skill, idx) => (
                      <Badge key={idx} variant="warning">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Suitable Domains */}
            {analysis.suitable_domains && analysis.suitable_domains.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">🎯 Suitable Domains</h3>
                <div className="space-y-4">
                  {analysis.suitable_domains.map((domain, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-dark-800 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-semibold">{domain.domain}</h4>
                        <span className="text-lg font-bold text-blue-400">
                          {domain.match_percentage}% Match
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{domain.reason}</p>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-3">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${domain.match_percentage}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <Button
                variant="primary"
                onClick={() => {
                  setAnalysis(null);
                  setFile(null);
                }}
              >
                Upload Another Resume
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/practice', {
                  state: {
                    extractedSkills: analysis.extracted_skills || [],
                    suitableDomains: analysis.suitable_domains || [],
                  },
                })}
                disabled={!analysis.extracted_skills?.length}
              >
                Start Practice Flow
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Resume;
