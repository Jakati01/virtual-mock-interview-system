import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- ADDED MISSING IMPORTS ---
// Note: If your folders are named differently, just update the path inside the quotes!
import { useAuthStore } from "../store";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";   

const Auth = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const isLoading = useAuthStore((state) => state.isLoading);
  const apiError = useAuthStore((state) => state.error);

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (isSignUp) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // THE FIX: Wrap in try/catch and use Optional Chaining (?.)
    try {
      let result;
      if (isSignUp) {
        result = await signup(formData.name, formData.email, formData.password);
      } else {
        result = await login(formData.email, formData.password);
      }

      // The "?." safely checks if result exists before looking for "success"
      if (result?.success) {
        navigate('/dashboard');
      } else {
        // If result is undefined, it falls back to the apiError from Zustand
        setErrors({ submit: result?.error || "Authentication failed. Please check your credentials." });
      }
    } catch (err) {
      // Catch any unexpected store crashes
      console.error("Auth Exception:", err);
      setErrors({ submit: err.message || "An unexpected network error occurred." });
    }
  };

  // UI remains exactly identical!
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 50%, #0f172a 100%)'
    }}>
      <div className="w-full max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        >
          {/* Left side - Branding */}
          <motion.div
            initial={{ x: -50 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">InterviewAI</h1>
                  <p className="text-gray-400">Master Your Interviews</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-white leading-tight">
                  {isSignUp ? (
                    <>Join the Community of<br /><span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Interview Winners</span></>
                  ) : (
                    <>Welcome Back,<br /><span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Interview Champion</span></>
                  )}
                </h2>
                <p className="text-gray-400 text-lg">
                  {isSignUp
                    ? 'Start your journey to acing every interview with AI-powered practice.'
                    : 'Continue your journey to becoming an interview pro. Practice smart, succeed faster.'}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-4">
                {[
                  { icon: '✓', text: 'AI-powered practice tests' },
                  { icon: '✓', text: 'Real-time feedback & scoring' },
                  { icon: '✓', text: 'Industry-standard questions' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <span className="text-green-400 text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right side - Auth Form */}
          <motion.div
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-card border-white/10 shadow-glow-lg">
              <h3 className="text-2xl font-bold text-white mb-6">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h3>

              {/* Error Alert - Now safely displays either local errors or Zustand apiErrors */}
              {(errors.submit || apiError) && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{errors.submit || apiError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>}
                  />
                )}

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>}
                />

                {isSignUp && (
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                  />
                )}

                {!isSignUp && (
                  <div className="text-right">
                    <a href="#" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                      Forgot password?
                    </a>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full mt-6"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-400">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrors({});
                      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </Card>

            {/* Social Login */}
            {!isSignUp && (
              <div className="mt-6 flex gap-4">
                <button className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  </svg>
                </button>
                <button className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-gray-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;