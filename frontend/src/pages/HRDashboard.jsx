import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Spinner, Button } from '../components/ui';
import API_BASE_URL from '../api';

const HRDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/interview/hr/dashboard-results`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setCandidates(data.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching HR data:", error);
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-teal-400 mt-4 font-mono">Loading Candidate Pipeline...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Startup Recruiter Dashboard</h1>
            <p className="text-gray-400">Review verified candidate profiles from the Strict Mode pipeline.</p>
          </div>
          <Badge variant="primary" size="lg">Total Evaluated: {candidates.length}</Badge>
        </div>

        {/* Data Table */}
        <Card className="bg-dark-800 border-gray-700 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-dark-900 text-teal-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Candidate Name</th>
                  <th className="px-6 py-4">Date Evaluated</th>
                  <th className="px-6 py-4 text-center">Final Score</th>
                  <th className="px-6 py-4 text-center">Verdict</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No candidates have completed the Strict Mode interview yet.</td>
                  </tr>
                ) : (
                  candidates.map((cand) => (
                    <tr key={cand.id} className="border-b border-gray-700 hover:bg-dark-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {cand.candidate_name}
                        <div className="text-xs text-gray-500 font-mono mt-1">{cand.email}</div>
                      </td>
                      <td className="px-6 py-4">{cand.date}</td>
                      <td className="px-6 py-4 text-center font-bold text-lg">
                        {cand.final_score.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={cand.status.includes('Hired') ? 'success' : 'danger'}>
                          {cand.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedCandidate(cand)}
                          className="text-teal-400 hover:text-teal-300 border border-teal-500/30"
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail Modal Overlay */}
        <AnimatePresence>
          {selectedCandidate && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-dark-800 border border-gray-600 rounded-xl max-w-2xl w-full p-8 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCandidate.candidate_name}</h2>
                    <p className="text-gray-400 text-sm font-mono">{selectedCandidate.email}</p>
                  </div>
                  <Badge variant={selectedCandidate.status.includes('Hired') ? 'success' : 'danger'} size="lg">
                    {selectedCandidate.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-dark-900 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">R1: Pressure Cooker (MCQ)</p>
                    <p className="text-xl text-white font-mono">{selectedCandidate.details?.round1_jd_screening || 0}%</p>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">R2: Adversarial Theory</p>
                    <p className="text-xl text-white font-mono">{selectedCandidate.details?.round2_theory || 0}%</p>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">R3: Client Escalation</p>
                    <p className="text-xl text-white font-mono">{selectedCandidate.details?.round3_communication || 0}%</p>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">R4: The Bug Hunt (Code)</p>
                    <p className="text-xl text-white font-mono">{selectedCandidate.details?.round4_bug_hunt || 0}%</p>
                  </div>
                </div>

                <Button variant="primary" className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => setSelectedCandidate(null)}>
                  Close Report
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default HRDashboard;