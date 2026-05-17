import io
import json
import PyPDF2
from groq import Groq
from app.core.config import settings

# Initialize Groq client using your central settings
client = Groq(api_key=settings.GROQ_API_KEY)

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Reads the raw bytes of the uploaded PDF and extracts the text.
    """
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return ""

def analyze_resume_with_groq(resume_text: str) -> dict:
    """
    Sends the extracted resume text to Groq (Llama-3) to get the ATS 
    score, skills, feedback, and suitable domains in strict JSON format.
    """
    system_prompt = """
    You are an enterprise Applicant Tracking System (ATS) and a Senior IT Recruiter with 15+ years of experience hiring for top tech companies. 

    Your task is to analyze the provided candidate resume text strictly against current tech industry standards. You must evaluate their technical depth, project impact, and formatting.

    You MUST return your analysis EXACTLY as a valid JSON object. Do not include any markdown formatting, conversational text, or explanations outside of the JSON block.

    Use this exact JSON structure:
    {
      "overall_ats_score": <Integer 0-100>,
      "score_breakdown": {
        "keyword_match": <Integer 0-100>,
        "formatting": <Integer 0-100>,
        "impact_metrics": <Integer 0-100>
      },
      "extracted_skills": ["<Skill 1>", "<Skill 2>"],
      "missing_skills": ["<Crucial missing skill for their level>"],
      "feedback": "<1-2 sentences of brutal but constructive recruiter feedback focusing on action verbs and metrics.>",
      "suitable_domains": [
        {
          "domain": "<E.g., Full Stack Developer, Data Engineer, DevOps>",
          "match_percentage": <Integer 0-100>,
          "reason": "<1 sentence explaining why their skills match this specific domain.>"
        }
      ]
    }
    """

    try:
        print(f"[DEBUG] Calling Groq API with resume text length: {len(resume_text)}")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": f"Here is the candidate's parsed resume text. Analyze it now:\n\n{resume_text}"
                }
            ],
            model="llama-3.1-8b-instant", # Extremely fast and highly accurate for JSON
            response_format={"type": "json_object"}, # Forces perfect JSON output
            temperature=0.2, # Low temperature ensures analytical accuracy
            timeout=30.0 # 30 second timeout
        )
        
        # 1. Extract the raw string from Groq
        raw_json_string = chat_completion.choices[0].message.content
        print(f"[DEBUG] Groq response received, length: {len(raw_json_string)}")
        
        # 2. Convert the string into a Python Dictionary
        analysis_data = json.loads(raw_json_string)
        print(f"[DEBUG] JSON parsing successful")
        
        return analysis_data
        
    except json.JSONDecodeError as je:
        print(f"[ERROR] JSON parsing error from Groq: {je}")
        print(f"[ERROR] Raw response was: {raw_json_string if 'raw_json_string' in locals() else 'N/A'}")
        # Return safe fallback data
        return _get_fallback_analysis()
        
    except Exception as e:
        print(f"[ERROR] Groq API Error: {str(e)}")
        print(f"[ERROR] Error type: {type(e)}")
        # Return a safe fallback object so the FastAPI endpoint doesn't crash with a 500 Error
        return _get_fallback_analysis()


def _get_fallback_analysis() -> dict:
    """Fallback analysis data when Groq fails"""
    return {
        "overall_ats_score": 65,
        "score_breakdown": {
            "keyword_match": 65,
            "formatting": 65,
            "impact_metrics": 60
        },
        "extracted_skills": ["Communication", "Problem Solving", "Technical Skills"],
        "missing_skills": ["Specific Technical Skills", "Quantified Metrics"],
        "feedback": "Resume uploaded successfully. Groq AI analysis had an issue, but your resume has been saved.",
        "suitable_domains": [
            {
                "domain": "General Professional",
                "match_percentage": 65,
                "reason": "Generic professional resume format detected."
            }
        ]
    }