"""
Real Interview Service - STRICT MODE
Manages high-pressure interview generation and adversarial AI evaluation.
"""

from groq import Groq
from openai import OpenAI
from app.core.config import settings
import json
import os

# ==========================================
# COLLEGE REVIEW DEMO CONFIGURATION
# ==========================================
# Only this user can bypass the practice requirements and jump straight to Real Interview
DEMO_USER_EMAIL = "demo@gmail.com"
DEMO_USERNAME = "demo"

# Initialize clients
groq_client = Groq(api_key=settings.GROQ_API_KEY)

# Using GitHub Models for Zero-Cost, High-Tier Logic (from Practice setup)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
github_client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=GITHUB_TOKEN
)


# ==========================================
# ROUND 1: JD-SCREENING (STRICT MCQ)
# ==========================================
async def generate_strict_jd_mcqs(job_description: str, domain: str, num_questions: int = 20):
    """
    Reads a real Job Description and generates extremely difficult MCQs.
    Negative marking (-0.25) will be applied in the router.
    """
    prompt = f"""
    You are a ruthless Lead Engineer screening candidates.
    Read this Job Description: "{job_description[:800]}"
    Domain: {domain}
    
    Generate {num_questions} HIGH-DIFFICULTY technical MCQs directly related to the skills required in the JD.
    Focus on edge cases, performance trade-offs, and deep architecture. No beginner questions.
    
    Return EXACTLY this JSON structure:
    {{ "questions": [{{ "id": 1, "question": "text", "options": ["text1", "text2", "text3", "text4"], "correct_answer": "exact text", "topic": "skill" }}] }}
    """
    
    try:
        response = github_client.chat.completions.create(
            model="gpt-4o-mini", # <--- CHANGED TO A 100% RELIABLE MODEL
            messages=[{"role": "user", "content": prompt}], # Changed role to 'user' for broader compatibility
            response_format={"type": "json_object"},
            temperature=0.3
        )
        questions = json.loads(response.choices[0].message.content).get("questions", [])
        return {"round": "jd_screening", "questions": questions}
    except Exception as e:
        print(f"Error generating JD MCQs: {e}")
        return {"round": "jd_screening", "questions": []}


# ==========================================
# ROUND 2: ADVERSARIAL AI (THEORY)
# ==========================================
async def generate_adversarial_followup(previous_question: str, candidate_transcript: str):
    """
    This makes the AI act like a real human. It listens to the candidate's answer
    and attacks the weak points or asks for deeper explanation.
    """
    prompt = f"""
    You are an expert Technical Interviewer. 
    You asked the candidate: "{previous_question}"
    The candidate answered: "{candidate_transcript}"
    
    Generate a SINGLE, challenging follow-up question.
    If their answer was good, ask about a scale/performance edge case.
    If their answer was weak, point out the flaw and ask them to clarify.
    
    Return ONLY valid JSON:
    {{
        "follow_up_question": "Your challenging question here",
        "expected_keywords": ["keyword1", "keyword2"]
    }}
    """
    try:
        response = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating follow up: {e}")
        return {
            "follow_up_question": "Can you elaborate on how that would scale with 1 million concurrent users?",
            "expected_keywords": ["load balancing", "caching", "database indexing"]
        }


# ==========================================
# ROUND 3: PRESSURE COMMUNICATION (CLIENT ESCALATION)
# ==========================================
async def generate_pressure_communication_tasks():
    """
    Replaces standard Story Retell with high-stakes corporate scenarios.
    """
    prompt = """
    Create an advanced Corporate English communication test. Return ONLY valid JSON.
    {
      "angry_client_scenario": "Describe a scenario where a critical server crashed during a client's product launch. The candidate has 60 seconds to leave a professional voicemail.",
      "tech_architecture_explain": "Provide a complex system design concept (like event-driven architecture) that the candidate must explain to a non-technical CEO.",
      "rapid_fire_sentences": ["Complex sentence 1", "Complex sentence 2"]
    }
    """
    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        print(f"Error generating pressure communication: {e}")
        return {
            "angry_client_scenario": "A payment gateway failed during Black Friday. Leave a voicemail for the furious client explaining the issue without blaming your team.",
            "tech_architecture_explain": "Explain how a load balancer works to the VP of Marketing using a real-world analogy.",
            "rapid_fire_sentences": ["Cross-functional collaboration is paramount to our deployment strategy."]
        }


# ==========================================
# ROUND 4: THE BUG HUNT (CODE REVIEW)
# ==========================================
async def generate_bug_hunt_task(tech_stack: str = "Python/JavaScript"):
    """
    Generates a piece of broken, inefficient code.
    The candidate must fix the bugs AND optimize the time complexity.
    """
    prompt = f"""
    You are a Principal Engineer. Generate a "Bug Hunt" code review test for {tech_stack}.
    
    The task MUST include:
    1. A code snippet with EXACTLY 3 logical bugs (not syntax errors, logical errors).
    2. The code must have an inefficient O(n^2) time complexity.
    3. The candidate's goal is to find the bugs and optimize it to O(n) or O(n log n).
    
    Return ONLY valid JSON:
    {{
        "problem_title": "Optimize the Data Aggregator",
        "scenario": "This code handles user transaction logs, but it's failing in production and timing out.",
        "buggy_code": "def process(data):\\n  # code with 3 hidden bugs and O(n^2) complexity",
        "hidden_bugs": ["List the 3 bugs here for the evaluator reference"],
        "target_complexity": "O(n)"
    }}
    """
    try:
        response = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error generating bug hunt: {e}")
        return {
             "problem_title": "Production Hotfix",
             "scenario": "Fix the bugs and optimize this script.",
             "buggy_code": "# Default fallback code",
             "hidden_bugs": ["Timeout", "Null pointer", "Logic error"],
             "target_complexity": "O(n)"
        }