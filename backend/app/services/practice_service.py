import json
import random
import requests
import os
import subprocess
import uuid
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
from app.models.aptitude import AptitudeQuestion
from groq import Groq
from openai import OpenAI
from app.core.config import settings

# ==========================================
# API CONFIGURATIONS
# ==========================================

# 1. Groq Client (Fallback & Comm Generation)
groq_client = Groq(api_key=settings.GROQ_API_KEY)

# 2. GitHub Models Client (Primary Engine - Zero Cost)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
github_client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=GITHUB_TOKEN
)

COMMUNICATION_IMAGE_LIBRARY = [
    {
        "url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        "prompt": "Describe what is happening in this team collaboration scene.",
    },
    {
        "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        "prompt": "Explain this workplace meeting image in clear professional English.",
    },
    {
        "url": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        "prompt": "Describe the people, setting, and activity shown in this office image.",
    },
]

# ==========================================
# ROUND 1: MCQ GENERATION (GitHub + Groq Fallback + PostgreSQL)
# ==========================================
def generate_mcqs(skill: str, domain: str, db: Session) -> dict:
    """
    Generates 30 MCQs total: 
    20 Technical (via GitHub/Groq) + 10 Aptitude (via PostgreSQL).
    """
    tech_prompt = f"""
    You are an expert Technical Interviewer. Generate EXACTLY 20 advanced MCQs 
    for the domain '{domain}' focusing on the skill '{skill}'.
    
    CRITICAL INSTRUCTIONS:
    1. GENERATE EXACTLY 20 QUESTIONS.
    2. Keep questions and options concise.
    3. Do NOT include prefixes like "A)", "B)", "a)", or "b)" in your options.
    4. The 'correct_answer' MUST be the exact, full string of the correct option.
    
    Return EXACTLY this JSON structure:
    {{ "questions": [{{ "id": 1, "question": "text", "options": ["text1", "text2", "text3", "text4"], "correct_answer": "exact text" }}] }}
    """

    tech_questions = []
    apt_questions = []

    # --- STEP 1: API CALL (Technical) ---
    try:
        # PRIMARY: GitHub Models (Llama 3.3 70B)
        tech_res = github_client.chat.completions.create(
           model="Llama-3.3-70B-Instruct",
            messages=[{"role": "system", "content": tech_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        tech_questions = json.loads(tech_res.choices[0].message.content).get("questions", [])
        print("✅ Round 1: Technical MCQs generated via GitHub Models.")
    except Exception as e:
        print(f"⚠️ GitHub API Failed, falling back to Groq: {e}")
        try:
            # FALLBACK: Groq API
            groq_res = groq_client.chat.completions.create(
                messages=[{"role": "system", "content": tech_prompt}],
                model="llama-3.1-8b-instant", 
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000,
            )
            tech_questions = json.loads(groq_res.choices[0].message.content).get("questions", [])
            print("✅ Round 1: Technical MCQs generated via Groq Fallback.")
        except Exception as groq_err:
            print(f"🚨 GROQ API ERROR: {groq_err}")
            return {
                "error": "Failed to generate Technical questions from all providers.",
                "technical_questions": [],
                "aptitude_questions": []
            }

    # --- STEP 2: DATABASE QUERY (Aptitude via PostgreSQL) ---
    try:
        db_questions = db.query(AptitudeQuestion).order_by(func.random()).limit(10).all()
        for i, q in enumerate(db_questions, start=21):
            opts = q.options.copy() if isinstance(q.options, list) else json.loads(q.options)
            random.shuffle(opts)
            apt_questions.append({
                "id": i,
                "question": q.question,
                "options": opts,
                "correct_answer": q.correct_answer
            })
    except Exception as db_err:
        print(f"🚨 DATABASE ERROR: {db_err}")

    # --- STEP 3: Force Randomization via Python ---
    for q in tech_questions:
        options = q.get("options", [])
        random.shuffle(options)
        q["options"] = options

    return {
        "technical_questions": tech_questions,
        "aptitude_questions": apt_questions
    }


# ==========================================================
# ROUND 2: DISCUSSION GENERATION (GitHub + OpenRouter Fallback)
# ==========================================================
def generate_discussion_questions(skill: str, domain: str) -> dict:
    system_prompt = f"""
    You are an expert Technical Interviewer.
    Generate EXACTLY 3 technical discussion questions for {domain} focusing on {skill}.
    Types: 1 "CONCEPT", 1 "SCENARIO", 1 "VISUAL".
    Provide 3-5 "expected_keywords" for each.

    Return ONLY valid JSON matching this exact format:
    {{
      "questions": [
        {{ "id": 1, "question_type": "CONCEPT", "question": "...", "expected_keywords": ["..."], "code_snippet": null }}
      ]
    }}
    """
    try:
        # PRIMARY: GitHub Models (GPT-4o-mini - fast and stable)
        response = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"}
        )
        print("✅ Round 2: Questions generated via GitHub Models.")
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ GitHub Failed, falling back to OpenRouter: {e}")
        try:
            # FALLBACK: OpenRouter
            headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "meta-llama/llama-3.3-70b-instruct", 
                "messages": [{"role": "system", "content": system_prompt}],
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception as err:
            print(f"🚨 OpenRouter Error: {err}")
            return {"questions": []}


# ==========================================================
# ROUND 2: AUDIO PROCESSING (FFMPEG + WHISPER)
# ==========================================================
async def process_interview_audio(audio_file: UploadFile, user_id: str) -> str:
    unique_id = uuid.uuid4().hex
    raw_audio_path = f"temp_raw_{user_id}_{unique_id}.webm"
    clean_audio_path = f"temp_clean_{user_id}_{unique_id}.wav"

    try:
        with open(raw_audio_path, "wb") as buffer:
            buffer.write(await audio_file.read())
        subprocess.run([
            "ffmpeg", "-y", "-i", raw_audio_path, 
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", clean_audio_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        if os.path.exists(raw_audio_path): os.remove(raw_audio_path)
        raise HTTPException(status_code=500, detail="Audio conversion failed.")

    try:
        # Keep using Groq for Whisper, it is incredibly fast and cheap
        with open(clean_audio_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(clean_audio_path, file.read()),
                model="whisper-large-v3",
                prompt="Umm, let me think... well, uh, basically..."
            )
        return transcription.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to transcribe audio.")
    finally:
        if os.path.exists(raw_audio_path): os.remove(raw_audio_path)
        if os.path.exists(clean_audio_path): os.remove(clean_audio_path)


# ==========================================================
# ROUND 2: DISCUSSION EVALUATION (GitHub + OpenRouter Fallback)
# ==========================================================
def evaluate_discussion_answer(question_type: str, prompt_text: str, expected_keywords: list, transcript: str) -> dict:
    system_prompt = f"""
    Evaluate the candidate's spoken answer.
    Question: {prompt_text}
    Transcript: "{transcript}"
    Expected Keys: {expected_keywords}

    Return EXACT JSON:
    {{
      "understanding": <0-5>, "clarity": <0-5>, "completeness": <0-5>,
      "final_score": <float>, "strengths": [], "weaknesses": [], "feedback": "First person feedback"
    }}
    """
    try:
        # PRIMARY: GitHub Models
        response = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        try:
            # FALLBACK: OpenRouter
            headers = {"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "meta-llama/llama-3.3-70b-instruct", 
                "messages": [{"role": "system", "content": system_prompt}],
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception:
            return {"understanding": 0, "clarity": 0, "completeness": 0, "final_score": 0, "feedback": "Service unavailable."}


# ==========================================
# ROUND 3: COMMUNICATION TASK GENERATION (GROQ Primary)
# ==========================================
def generate_communication_tasks(skill: str = "", domain: str = "") -> dict:
    system_prompt = """
    Create an English communication test. Return ONLY valid JSON:
    {
      "read_aloud": ["sentence1", "sentence2", "sentence3", "sentence4"],
      "repeat_sentence": ["sentence1", "sentence2", "sentence3", "sentence4"],
      "story_retell": "one storytelling question",
      "image_prompt": "one image description instruction"
    }
    """
    try:
        res = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        data = json.loads(res.choices[0].message.content.strip())
    except Exception:
        data = {
            "read_aloud": ["Clear communication improves productivity."],
            "repeat_sentence": ["Consistency is the key."],
            "story_retell": "Describe a memorable vacation.",
            "image_prompt": "Describe what you see in this image."
        }
    return {**data, "image_url": random.choice(COMMUNICATION_IMAGE_LIBRARY)["url"]}


# ==========================================
# ROUND 3: COMMUNICATION EVALUATION (GitHub + Cloudflare Fallback)
# ==========================================
def evaluate_communication(transcript: str, question_type: str = "general", prompt_text: str = "", expected_text: str = "") -> dict:
    if not transcript or not transcript.strip():
        return fallback_response()

    task = f"Evaluate communication quality of this response:\n{transcript}"
    if question_type == "read_aloud":
        task = f"Evaluate Read Aloud.\nExpected: '{expected_text}'\nSpoken: '{transcript}'"

    prompt = f"""
    Return ONLY valid JSON.
    {task}
    Output Format:
    {{"score": number, "pronunciation": number, "fluency": number, "grammar": number, "vocabulary": number, "confidence": number, "accuracy": number, "feedback": "short text"}}
    """
    try:
        # PRIMARY: GitHub Models
        res = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ GitHub Eval Failed, using Cloudflare: {e}")
        try:
            # FALLBACK: Cloudflare
            url = f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct"
            headers = {"Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}", "Content-Type": "application/json"}
            res = requests.post(url, headers=headers, json={"messages": [{"role": "user", "content": prompt}]})
            data = json.loads(res.json()["result"]["response"])
            return {
                "score": int(data.get("score", 70)), "pronunciation": int(data.get("pronunciation", 70)),
                "fluency": int(data.get("fluency", 70)), "grammar": int(data.get("grammar", 70)),
                "vocabulary": int(data.get("vocabulary", 70)), "confidence": int(data.get("confidence", 70)),
                "accuracy": int(data.get("accuracy", 70)), "feedback": data.get("feedback", "Good communication.")
            }
        except Exception:
            return fallback_response()

def fallback_response():
    return {"score": 70, "pronunciation": 70, "fluency": 70, "grammar": 70, "vocabulary": 70, "confidence": 70, "accuracy": 70, "feedback": "Good communication skills"}


# ==========================================
# ROUND 4: CODING EVALUATION (GitHub + Groq Fallback)
# ==========================================
def evaluate_coding_answer(problem_statement: str, code: str, language: str) -> dict:
    system_prompt = f"""
    Evaluate the code based on the problem.
    Problem: {problem_statement}
    Language: {language}
    Code:
    {code}

    Return ONLY valid JSON:
    {{ "coding_score": <0-100>, "syntax_correct": <Bool>, "optimal_complexity": <Bool>, "feedback": "3-4 sentences." }}
    """
    try:
        # PRIMARY: GitHub Models
        res = github_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(res.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ GitHub Code Eval Failed, using Groq: {e}")
        try:
            # FALLBACK: Groq
            res = groq_client.chat.completions.create(
                messages=[{"role": "system", "content": system_prompt}],
                model="llama-3.1-8b-instant",
                response_format={"type": "json_object"}
            )
            return json.loads(res.choices[0].message.content)
        except Exception:
            return {"coding_score": 0, "syntax_correct": False, "optimal_complexity": False, "feedback": "Evaluation error."}