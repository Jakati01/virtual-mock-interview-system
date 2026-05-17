from google import genai
from app.core.config import settings

# Initialize the client
client = genai.Client(api_key=settings.GEMINI_API_KEY)
def generate_final_report(user_data: dict):
    # Calculate Weighted Total
    # Resume (20%), Conceptual (25%), Real Task (35%), HR (20%)
    total_score = (
        (user_data['resume_score'] * 0.20) +
        (user_data['conceptual_score'] * 0.25) +
        (user_data['task_score'] * 0.35) +
        (user_data['hr_score'] * 0.20)
    )
    
    # Anti-Cheat Penalty
    # Every tab switch reduces the final score by 5 points
    penalty = user_data['tab_switches'] * 5
    final_score = max(0, total_score - penalty)
    
    # Recommendation Logic
    is_recommended = final_score >= 75 and user_data['tab_switches'] < 3
    
    return {
        "final_percentage": round(final_score, 2),
        "is_recommended": is_recommended,
        "verdict": "HIRE" if is_recommended else "REJECT",
        "penalty_applied": penalty
    }

async def get_ai_summary(user_data: dict):
    """Uses Gemini to write a professional summary for the recruiter."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Candidate Name: {user_data['username']}
    Scores: Resume({user_data['resume_score']}), Tech({user_data['conceptual_score']}), 
    Coding({user_data['task_score']}), HR({user_data['hr_score']}).
    Cheating Violations: {user_data['tab_switches']}
    
    Write a 3-sentence professional summary of this candidate for a Startup CEO. 
    Highlight their strongest skill and mention if their integrity (proctoring) is a concern.
    """
    response = model.generate_content(prompt)
    return response.text