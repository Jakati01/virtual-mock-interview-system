import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TerminalIcon from '@mui/icons-material/Terminal';
import { motion } from 'framer-motion';

const InterviewSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const availableSkills = location.state?.extractedSkills || ["React.js", "Python", "FastAPI", "Docker", "AWS"];
  const targetDomain = location.state?.domain || "Software Engineering";
  
  const [selectedSkill, setSelectedSkill] = useState(null);

  const handleStart = () => {
    if (!selectedSkill) return;
    navigate('/interview/mcq', { state: { skillToTest: selectedSkill, domain: targetDomain } });
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 10 }}>
      <Container maxWidth="md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Paper elevation={4} sx={{ p: { xs: 4, md: 6 }, borderRadius: 4, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            
            {/* Subtle background glow effect */}
            <Box sx={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', bgcolor: 'primary.main', opacity: 0.1, filter: 'blur(100px)', zIndex: 0 }} />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, color: 'primary.main' }}>
                <TerminalIcon sx={{ fontSize: 50 }} />
              </Box>
              
              <Typography variant="h3" fontWeight="900" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                Initialize Protocol
              </Typography>
              <Typography variant="h6" color="text.secondary" mb={1}>
                Target Profile: <span style={{ color: '#06b6d4' }}>{targetDomain}</span>
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={6}>
                Select a verified parameter from your profile to lock in the Assessment Matrix.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 8 }}>
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkill === skill;
                  return (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={skill}>
                      <Chip
                        label={skill}
                        onClick={() => setSelectedSkill(skill)}
                        sx={{ 
                          fontSize: '1.1rem', py: 2.5, px: 2, cursor: 'pointer',
                          bgcolor: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                          color: isSelected ? 'primary.main' : 'text.primary',
                          border: `1px solid ${isSelected ? '#06b6d4' : '#374151'}`,
                          boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </motion.div>
                  );
                })}
              </Box>

              <Button
                variant="contained" size="large" endIcon={<PlayArrowIcon />} onClick={handleStart} disabled={!selectedSkill}
                sx={{ 
                  py: 1.8, px: 6, fontSize: '1.1rem', borderRadius: 3,
                  boxShadow: selectedSkill ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none'
                }}
              >
                Execute MCQ Phase
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default InterviewSetup;
