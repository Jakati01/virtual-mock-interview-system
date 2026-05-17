import json
from groq import AsyncGroq
from app.core.config import settings

class GroqService:
    def __init__(self):
        # Authenticate using your secure settings
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        # Using the blazing fast 3.1 model
        self.model = "llama-3.1-8b-instant"

    # ==========================================
    # PHASE 2: RESUME & SKILL EXTRACTION
    # ==========================================
    async def get_ats_score_and_feedback(self, resume_text: str) -> dict:
        """Analyzes a parsed PDF resume and returns ATS score, feedback, and extracted skills."""
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.
        Analyze the following resume text.
        Return ONLY a JSON object with three keys:
        1. "score": An integer from 0 to 100 representing the overall ATS match strength.
        2. "feedback": A list of 3 short, actionable bullet points to improve the resume.
        3. "skills": A list of the top 5 to 10 technical skills extracted from the resume.
        
        Resume Text:
        {resume_text}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            print(f"Groq ATS Error: {e}")
            return {"score": 0, "feedback": ["Could not analyze resume."], "skills": []}

    # ==========================================
    # PHASE 3 (ROUND 1): MCQ GENERATION
    # ==========================================
    async def generate_mcq_round(self, skills: list, num_questions: int = 20) -> dict:
        """Round 1: Generates MCQ Questions based on extracted skills."""
        skills_str = ", ".join(skills) if skills else "General Software Engineering"
        prompt = f"""
        You are a Senior Technical Interviewer. Create a multiple-choice screening test based on these skills: {skills_str}.
        Generate exactly {num_questions} questions. 
        Each question must have exactly 3 options.
        
        Return ONLY a JSON object with a single key "questions" containing an array of objects.
        Each object MUST have:
        1. "id": An integer from 1 to {num_questions}
        2. "question": The technical question text.
        3. "options": A list of exactly 3 strings.
        4. "correct_answer": The exact string of the correct option.
        5. "skill_tag": Which skill this question tests.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Groq MCQ Error: {e}")
            return {"questions": []}

    # ==========================================
    # PHASE 3 (ROUND 2 & 3): ANSWER EVALUATION
    # ==========================================
    async def evaluate_answer(self, question: str, user_answer: str) -> dict:
        """Round 2 & 3: Evaluates a user's practice/coding answer against the mock question."""
        prompt = f"""
        You are a Senior Software Engineering Interviewer.
        Evaluate the candidate's answer to the question.
        
        Question: {question}
        Candidate's Answer: {user_answer}
        
        Return ONLY a JSON object with two keys:
        1. "score": An integer from 0 to 100 grading the technical accuracy and clarity.
        2. "feedback": A 2-sentence direct, constructive feedback explaining why they got that score.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            print(f"Groq Evaluation Error: {e}")
            return {"score": 0, "feedback": "Evaluation failed due to server error."}

    # ==========================================
    # FINAL BOSS: COMPLETE SESSION EVALUATION
    # ==========================================
    async def evaluate_full_interview(self, qa_history: list, total_tab_switches: int) -> dict:
        """The Final Boss: Evaluates the entire session and makes a hiring decision."""
        prompt = f"""
        You are a strict but fair Startup CTO hiring a Software Engineer.
        Review this candidate's full interview performance.
        
        Total Tab Switches (Cheating metric): {total_tab_switches}
        (If tab switches are > 3, strongly consider rejecting them for looking up answers).
        
        Interview Transcript:
        {qa_history}
        
        Return ONLY a JSON object with 3 keys:
        1. "verdict": Strictly the string "HIRED" or "REJECTED".
        2. "technical_score": An integer from 0 to 100 representing overall technical strength.
        3. "feedback": A detailed 3-sentence review explaining your hiring decision.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Groq CTO Error: {e}")
            return {"verdict": "ERROR", "technical_score": 0, "feedback": "System failure during evaluation."}

# Create the singleton instance
groq_service = GroqService()