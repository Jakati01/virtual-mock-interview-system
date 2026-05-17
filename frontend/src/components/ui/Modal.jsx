import React, { useState } from 'react';
import classNames from 'classnames';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal Component - Premium modal with animations
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close callback
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={classNames(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'glass-card z-50 w-full mx-4',
              sizeClass
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="btn-icon text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
