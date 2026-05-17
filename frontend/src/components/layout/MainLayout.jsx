import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/**
 * MainLayout Component - Wraps pages with navbar and sidebar
 */
const MainLayout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 50%, #0f172a 100%)'
    }}>
      {/* Navbar */}
      <Navbar user={user} onLogout={onLogout} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content */}
        <main className="flex-1 w-full">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed bottom-6 right-6 z-30 p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page content */}
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
