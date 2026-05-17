import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * DragDropZone Component - Drag and drop file upload
 * @param {function} onFileSelect - Callback when file is selected
 * @param {string} acceptedTypes - Accepted file types
 */
const DragDropZone = ({ onFileSelect, acceptedTypes = '.pdf,.doc,.docx', title = 'Upload Resume' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      animate={{
        borderColor: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
      }}
      className="relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer"
    >
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      <div className="text-center">
        {fileName ? (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white font-medium">{fileName}</p>
            <p className="text-gray-400 text-sm mt-2">File uploaded successfully</p>
          </>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">Drag and drop your file here or click to browse</p>
            <p className="text-gray-500 text-xs mt-2">Accepted formats: PDF, DOC, DOCX</p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default DragDropZone;
