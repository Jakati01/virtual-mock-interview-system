import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Sidebar Component - Collapsible sidebar navigation
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
    },
    {
      label: 'Resume Analysis',
      path: '/resume',
      icon: '📄',
    },
    {
      label: 'Practice Tests',
      path: '/practice',
      icon: '✏️',
      submenu: [
        { label: 'MCQ Round', path: '/practice/mcq' },
        { label: 'Coding Round', path: '/practice/coding' },
        { label: 'Theory Round', path: '/practice/theory' },
        { label: 'HR Round', path: '/practice/hr' },
      ],
    },
    {
      label: 'Real Interview',
      path: '/interview',
      icon: '🎥',
    },
    {
      label: 'Performance Reports',
      path: '/reports',
      icon: '📈',
    },
    {
      label: 'My Tests',
      path: '/tests',
      icon: '📋',
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        className="fixed left-0 top-0 w-72 h-screen z-50 md:relative md:z-0 md:translate-x-0 bg-gradient-to-b from-white/8 to-white/5 border-r border-white/10 backdrop-blur-xl pt-20"
      >
        <div className="px-6 py-8 space-y-2 overflow-y-auto h-full pb-20">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={location.pathname.startsWith(item.path)}
              onClose={() => setIsOpen(false)}
            />
          ))}
        </div>
      </motion.aside>
    </>
  );
};

/**
 * NavItem Component - Individual navigation item
 */
const NavItem = ({ item, isActive, onClose }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(isActive);

  return (
    <div>
      <Link
        to={item.path}
        onClick={onClose}
        className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
          isActive
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="flex items-center gap-3 flex-1">
          <span className="text-xl">{item.icon}</span>
          <span className="font-medium">{item.label}</span>
        </span>
        {item.submenu && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSubmenuOpen(!isSubmenuOpen);
            }}
            className="text-gray-400 hover:text-white transition-transform"
            style={{ transform: isSubmenuOpen ? 'rotate(180deg)' : '' }}
          >
            ▼
          </button>
        )}
      </Link>

      {/* Submenu */}
      {item.submenu && isSubmenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 ml-6 space-y-1 border-l border-white/10 pl-4"
        >
          {item.submenu.map((subitem) => (
            <Link
              key={subitem.path}
              to={subitem.path}
              onClick={onClose}
              className="block px-4 py-2 text-sm text-gray-400 hover:text-blue-400 transition-colors rounded"
            >
              {subitem.label}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;
