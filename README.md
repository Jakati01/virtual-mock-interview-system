# Virtual Mock Interview Training System using AI

## Overview
Virtual Mock Interview Training System using AI is a full-stack web application designed to help job seekers improve their interview readiness through resume analysis, ATS scoring, AI-generated technical assessments, communication evaluation, and recruiter-oriented performance insights.

The platform bridges the gap between candidates and recruiters by offering an intelligent practice environment and structured evaluation system.

---

## Key Features

### User Management
- Secure user registration and login
- JWT-based authentication
- Role-based user access
- Persistent user profiles

### Resume Analysis
- Resume upload and parsing
- ATS score generation
- Skill extraction
- Resume improvement suggestions

### Practice & Assessment
- AI-generated technical questions
- Multiple difficulty levels
- MCQ, theory, and coding rounds
- Adaptive scoring system

### Communication Evaluation
- Voice-based communication analysis
- Speech-to-text integration
- Communication scoring

### Real Interview Simulation
- Multi-round interview process
- Anti-cheat monitoring
- Coding assessments
- Performance tracking

### Recruiter Insights
- Candidate evaluation reports
- Skill analysis
- Hiring recommendations

---

## Technology Stack

### Frontend
- React.js
- JavaScript
- CSS
- Vite

### Backend
- Python
- FastAPI
- SQLAlchemy

### Database
 - PostgreSQL

### AI & Tools
- Whisper API
- YOLO / OpenCV
- GitHub Copilot-assisted frontend development

---

## Project Architecture
- Frontend handles user interaction and dashboard
- Backend manages authentication, APIs, and business logic
- Database stores user, resume, and assessment data
- AI modules power scoring, evaluation, and analysis

---

## Current Functional Status
- Backend integration completed
- Real authentication implemented
- Dashboard connected to backend
- Resume module integrated
- Practice module under enhancement
- Real interview module in progress

---

## Installation Guide

### Clone Repository
```bash
git clone <repository-url>
cd virtual-mock-interview-system

### frontend setup
Frontend Setup
cd frontend
npm install
npm run dev

#Backend Setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

#Future Enhancements
Advanced AI interview personalization
Company-specific interview simulations
Real-time recruiter dashboard
Cloud deployment
Advanced analytics

#Team Contribution
P Jagadeesh — Backend Development
A Dinesh — Database Management
G Kamesh — Frontend Development

Project Vision
The Virtual Mock Interview Training System using AI is designed to redefine interview preparation by combining artificial intelligence, real-world simulation, and recruiter intelligence into one unified platform.

Its vision is to empower candidates with practical readiness, improve hiring efficiency for recruiters, and create a scalable ecosystem that transforms interview preparation into a measurable, data-driven professional development experience.

Conclusion
This project represents a next-generation career preparation system focused on bridging the gap between talent preparation and recruitment expectations through AI-powered innovation, structured evaluation, and scalable technical architecture.
