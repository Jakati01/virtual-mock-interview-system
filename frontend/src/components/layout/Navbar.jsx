import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

/**
 * Navbar Component - Top navigation bar with user menu
 */
const Navbar = ({ user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">InterviewAI</h1>
              <p className="text-xs text-gray-400">Mock Interview Platform</p>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Practice', path: '/practice' },
              { label: 'Interview', path: '/interview' },
              { label: 'Reports', path: '/reports' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  location.pathname === path
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side - Profile */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-gray-300">{user.name}</span>
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, translateY: -10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      exit={{ opacity: 0, translateY: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-card"
                    >
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-gray-400">Signed in as</p>
                        <p className="font-semibold text-white">{user.email}</p>
                        <hr className="border-white/10 my-2" />
                        <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-all">
                          Profile Settings
                        </button>
                        <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-all">
                          Preferences
                        </button>
                        <hr className="border-white/10 my-2" />
                        <button
                          onClick={() => {
                            onLogout?.();
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
