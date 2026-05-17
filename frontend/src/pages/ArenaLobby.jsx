import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Badge, Progress } from '../components/ui';

void motion;

const DEFAULT_DOMAINS = [
  {
    domain: 'Software Engineering',
    match_percentage: 82,
    reason: 'Balanced choice for problem-solving, implementation, and product thinking.',
  },
  {
    domain: 'Frontend Development',
    match_percentage: 76,
    reason: 'Best for UI, React, performance, and browser-based interview questions.',
  },
  {
    domain: 'Backend Development',
    match_percentage: 74,
    reason: 'Strong fit for APIs, databases, architecture, and system reasoning.',
  },
];

const loadStoredProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('practiceProfile') || 'null');
  } catch (error) {
    console.error('Failed to parse stored practice profile:', error);
    return null;
  }
};

const ArenaLobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedProfile = useMemo(() => loadStoredProfile(), []);

  const availableSkills = useMemo(() => {
    const rawSkills =
      location.state?.extractedSkills ||
      storedProfile?.extractedSkills ||
      [];

    return rawSkills.filter(Boolean);
  }, [location.state, storedProfile]);

  const availableDomains = useMemo(() => {
    const rawDomains =
      location.state?.suitableDomains ||
      storedProfile?.suitableDomains ||
      [];

    return rawDomains.length > 0 ? rawDomains : DEFAULT_DOMAINS;
  }, [location.state, storedProfile]);

  const [selectedSkill, setSelectedSkill] = useState(availableSkills[0] || '');
  const [selectedDomain, setSelectedDomain] = useState(availableDomains[0]?.domain || '');

  const canStartPractice = Boolean(selectedSkill && selectedDomain);

  const handleStartPractice = () => {
    if (!canStartPractice) return;

    navigate('/practice/mcq', {
      state: {
        skillToTest: selectedSkill,
        domain: selectedDomain,
        extractedSkills: availableSkills,
        suitableDomains: availableDomains,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Badge className="text-blue-300 border-blue-500/30 bg-blue-500/10">
            Practice Setup
          </Badge>
          <h1 className="text-4xl font-bold text-white">Build Your Practice Sequence</h1>
          <p className="text-gray-400 max-w-3xl">
            Pick one target domain and one extracted skill from the resume analysis.
            We&apos;ll generate a custom 30-question MCQ round first, then carry that same context into the next practice phases.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <Card className="lg:col-span-2 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">1. Choose Your Domain</h2>
                <p className="text-gray-400 mt-1">Select the interview track you want the MCQ round to focus on.</p>
              </div>
              <Badge variant="default">30 Questions</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDomains.map((domainOption, index) => {
                const isSelected = selectedDomain === domainOption.domain;
                return (
                  <motion.button
                    key={`${domainOption.domain}-${index}`}
                    type="button"
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDomain(domainOption.domain)}
                    className={`text-left rounded-2xl border p-5 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-glow'
                        : 'border-white/10 bg-white/5 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-white">{domainOption.domain}</h3>
                      <span className="text-sm font-semibold text-blue-400">
                        {domainOption.match_percentage || 70}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{domainOption.reason}</p>
                    <Progress value={domainOption.match_percentage || 70} color="blue" showPercent={false} />
                  </motion.button>
                );
              })}
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Sequence Preview</h2>
            <p className="text-gray-400 mb-6">
              Your selected context will drive the full practice pipeline.
            </p>

            <div className="space-y-4">
              {[
                { title: 'MCQ Round', subtitle: '30 generated screening questions' },
                { title: 'Theory Round', subtitle: 'Deep explanation and decision making' },
                { title: 'Communication', subtitle: 'Explain concepts clearly and professionally' },
                { title: 'Coding', subtitle: 'Implementation-focused final challenge' },
              ].map((step, index) => (
                <div key={step.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{step.title}</p>
                    <p className="text-sm text-gray-400">{step.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Selected Domain</p>
                <p className="text-white font-semibold">{selectedDomain || 'Choose a domain'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Selected Skill</p>
                <p className="text-white font-semibold">{selectedSkill || 'Choose a skill'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">2. Choose Your Focus Skill</h2>
                <p className="text-gray-400 mt-1">The backend will generate the MCQ set around this skill and the selected domain.</p>
              </div>
              <Badge variant={availableSkills.length > 0 ? 'success' : 'warning'}>
                {availableSkills.length > 0 ? `${availableSkills.length} skills detected` : 'Resume needed'}
              </Badge>
            </div>

            {availableSkills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkill === skill;
                  return (
                    <motion.button
                      key={skill}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSkill(skill)}
                      className={`rounded-full px-5 py-3 border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 text-white shadow-glow'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-blue-500/40 hover:text-white'
                      }`}
                    >
                      {skill}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                <p className="text-yellow-300 font-medium mb-2">No extracted skills found yet.</p>
                <p className="text-gray-300 text-sm">
                  Upload a resume first so we can pull skills and recommend domains for your practice flow.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                variant="primary"
                onClick={handleStartPractice}
                disabled={!canStartPractice}
              >
                Start MCQ Round
              </Button>
              <Button variant="secondary" onClick={() => navigate('/resume')}>
                Upload or Re-check Resume
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ArenaLobby;
