import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { Spinner } from './components/ui';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Resume from './pages/Resume';
import ArenaLobby from './pages/ArenaLobby';
import McqRound from './pages/McqRound';
import TheoryRound from './pages/TheoryRound';
import CommunicationRound from './pages/CommunicationRound';
import CodingRound from './pages/CodingRound';
import InterviewResults from './pages/InterviewResults';
import RealInterviewLayout from './pages/RealInterviewLayout';
import JDScreeningRound from "./pages/JDScreeningRound";
import AdversarialTheoryRound from "./pages/AdversarialTheoryRound";
import ClientEscalationRound from "./pages/ClientEscalationRound";
import BugHuntRound from "./pages/BugHuntRound";
/**
 * ProtectedRoute Component - Guards routes that require authentication
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

/**
 * Main App Component
 */
function App() {
  // Check if user is already logged in on app load
  useEffect(() => {
    // Restore auth from localStorage on app initialization
    useAuthStore.getState().restoreFromLocalStorage();
  }, []);

  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Practice Arena Routes */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <ArenaLobby />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/mcq"
            element={
              <ProtectedRoute>
                <McqRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/theory"
            element={
              <ProtectedRoute>
                <TheoryRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/communication"
            element={
              <ProtectedRoute>
                <CommunicationRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/coding"
            element={
              <ProtectedRoute>
                <CodingRound />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/results"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />

          {/* Resume Analysis - Upload & ATS */}
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            }
          />

          {/* Real Interview Routes */}
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <RealInterviewLayout />
              </ProtectedRoute>
            }
          />

          {/* Interview Results */}
          <Route
            path="/interview-results"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}

export default App;