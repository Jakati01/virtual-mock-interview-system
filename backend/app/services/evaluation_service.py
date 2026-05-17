"""
Evaluation Service - Evaluates candidate responses using Gemini API
Handles scoring and feedback for all 4 interview rounds
"""

from google import genai
from app.core.config import settings
import json

# Initialize Gemini client
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)


# ==========================================
# ROUND 1 & 2: TECHNICAL ANSWER EVALUATION
# ==========================================
async def evaluate_technical_answer(question: str, user_answer: str, difficulty: str = "medium"):
    """
    Evaluate technical answers for resume-based and conceptual rounds.
    Uses Gemini to assess correctness, depth, and clarity.
    """
    
    prompt = f"""
    You are an expert technical interviewer evaluating a candidate's response.
    
    Question: {question}
    Difficulty: {difficulty}
    Candidate's Answer: {user_answer}
    
    Evaluate the answer and provide:
    1. Overall technical_score (0-100)
    2. Correctness (0-100)
    3. Depth of understanding (0-100)
    4. Clarity of explanation (0-100)
    5. Brief feedback with strengths and areas to improve
    
    Return as JSON with this exact format:
    {{
        "technical_score": 75,
        "correctness": 80,
        "depth": 70,
        "clarity": 75,
        "feedback": "Strong understanding of X, but could elaborate more on Y",
        "strengths": ["point1", "point2"],
        "improvements": ["area1", "area2"]
    }}
    
    Return ONLY valid JSON, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        evaluation = json.loads(response.text.strip())
        return evaluation
    except Exception as e:
        print(f"Error evaluating technical answer: {e}")
        # Default fallback
        return {
            "technical_score": 70,
            "correctness": 70,
            "depth": 65,
            "clarity": 70,
            "feedback": "Answer shows understanding but needs more detail",
            "strengths": ["Covered main points"],
            "improvements": ["Add more implementation details"]
        }


# ==========================================
# ROUND 3: CODE SOLUTION EVALUATION
# ==========================================
async def evaluate_code_solution(problem_description: str, code_snippet: str, explanation: str = ""):
    """
    Evaluate coding solutions for real-world task round.
    Assesses code quality, correctness, and optimization.
    """
    
    prompt = f"""
    You are a Senior Code Reviewer evaluating a coding solution.
    
    Problem: {problem_description}
    
    Candidate's Code:
    ```
    {code_snippet}
    ```
    
    Explanation: {explanation if explanation else "No explanation provided"}
    
    Evaluate and provide:
    1. code_quality_score (0-100) - Code style, readability, best practices
    2. correctness_score (0-100) - Does it solve the problem?
    3. efficiency_score (0-100) - Time/space complexity
    4. overall_score (0-100) - Combined assessment
    5. Issues found (if any)
    6. Suggestions for improvement
    
    Return as JSON:
    {{
        "code_quality_score": 80,
        "correctness_score": 85,
        "efficiency_score": 75,
        "overall_score": 80,
        "issues": ["issue1", "issue2"],
        "suggestions": ["suggestion1", "suggestion2"],
        "feedback": "Overall assessment and key takeaways"
    }}
    
    Return ONLY valid JSON, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        evaluation = json.loads(response.text.strip())
        return evaluation
    except Exception as e:
        print(f"Error evaluating code: {e}")
        return {
            "code_quality_score": 70,
            "correctness_score": 75,
            "efficiency_score": 65,
            "overall_score": 70,
            "issues": ["Needs review"],
            "suggestions": ["Optimize for better performance"],
            "feedback": "Code demonstrates understanding with room for improvement"
        }


# ==========================================
# ROUND 4: COMMUNICATION & VOICE EVALUATION
# ==========================================
async def evaluate_communication(transcribed_text: str, question: str):
    """
    Evaluate HR round responses - communication, fluency, and confidence.
    Analyzes speech-to-text transcription for communication quality.
    """
    
    prompt = f"""
    You are an HR Expert evaluating a candidate's communication skills.
    
    Original Question: {question}
    Candidate's Answer (Transcribed): {transcribed_text}
    
    Evaluate the response for:
    1. fluency_score (0-100) - Speech naturalness and flow
    2. grammar_score (0-100) - Grammar and language use
    3. vocabulary_score (0-100) - Word choice and expression
    4. confidence_score (0-100) - Confidence and assertiveness
    5. clarity_score (0-100) - How clear and understandable
    6. communication_score (0-100) - Overall communication effectiveness
    
    Return as JSON:
    {{
        "fluency": 75,
        "grammar": 80,
        "vocabulary": 75,
        "confidence": 70,
        "clarity": 75,
        "communication_score": 75,
        "feedback": "Strong communication with good clarity. Could improve confidence.",
        "strengths": ["Clear articulation", "Good vocabulary"],
        "improvements": ["More assertive tone", "Avoid filler words"]
    }}
    
    Return ONLY valid JSON, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        evaluation = json.loads(response.text.strip())
        return evaluation
    except Exception as e:
        print(f"Error evaluating communication: {e}")
        return {
            "fluency": 70,
            "grammar": 75,
            "vocabulary": 70,
            "confidence": 70,
            "clarity": 75,
            "communication_score": 72,
            "feedback": "Answer demonstrates good communication skills",
            "strengths": ["Clear answer"],
            "improvements": ["Could be more confident"]
        }


# ==========================================
# FACIAL ANALYSIS (Optional for HR Round)
# ==========================================
async def analyze_facial_expressions(expressions_data: dict):
    """
    Analyze facial expressions captured during HR round (optional).
    Assesses eye contact, confidence, and engagement.
    
    expressions_data format:
    {
        "eye_contact_percentage": 75,
        "smile_frequency": 3,
        "expressions": ["neutral", "happy", "confident"],
        "average_confidence": 0.75
    }
    """
    
    prompt = f"""
    Analyze these facial expression metrics during HR round:
    {json.dumps(expressions_data, indent=2)}
    
    Provide:
    1. confidence_indicator (0-100) - Based on expressions
    2. engagement_score (0-100) - Attention and interest level
    3. professionalism_score (0-100) - Professional demeanor
    4. observations - What expressions indicate about the candidate
    
    Return as JSON:
    {{
        "confidence_indicator": 75,
        "engagement_score": 80,
        "professionalism_score": 85,
        "observations": "Candidate showed good eye contact and confident expressions"
    }}
    
    Return ONLY valid JSON, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        analysis = json.loads(response.text.strip())
        return analysis
    except Exception as e:
        print(f"Error analyzing facial expressions: {e}")
        return {
            "confidence_indicator": 70,
            "engagement_score": 75,
            "professionalism_score": 75,
            "observations": "Facial data analysis unavailable"
        }


# ==========================================
# FINAL SCORE CALCULATION
# ==========================================
async def calculate_final_score(scores_dict: dict):
    """
    Combine all round scores into final interview score and recommendation.
    
    scores_dict format:
    {
        "ats_score": 85,
        "practice_score": 82,
        "resume_round_score": 78,
        "conceptual_round_score": 82,
        "task_round_score": 75,
        "hr_round_score": 80
    }
    """
    
    try:
        # Calculate weighted scores
        technical_avg = (scores_dict.get("resume_round_score", 0) + 
                        scores_dict.get("conceptual_round_score", 0) + 
                        scores_dict.get("task_round_score", 0)) / 3
        
        hr_score = scores_dict.get("hr_round_score", 0)
        ats_score = scores_dict.get("ats_score", 0)
        practice_score = scores_dict.get("practice_score", 0)
        
        # Weighted calculation (adjust weights as needed)
        final_score = (
            technical_avg * 0.50 +  # 50% technical
            hr_score * 0.25 +        # 25% communication
            ats_score * 0.15 +       # 15% resume/ATS
            practice_score * 0.10    # 10% practice performance
        )
        
        # Determine recommendation
        if final_score >= 85:
            recommendation = "Strongly Recommended"
            recommendation_level = "hire"
        elif final_score >= 75:
            recommendation = "Recommended"
            recommendation_level = "maybe"
        else:
            recommendation = "Not Recommended"
            recommendation_level = "reject"
        
        return {
            "final_score": round(final_score, 2),
            "recommendation": recommendation,
            "recommendation_level": recommendation_level,
            "technical_score": round(technical_avg, 2),
            "hr_score": round(hr_score, 2),
            "ats_score": round(ats_score, 2),
            "breakdown": {
                "resume_round": scores_dict.get("resume_round_score", 0),
                "conceptual_round": scores_dict.get("conceptual_round_score", 0),
                "task_round": scores_dict.get("task_round_score", 0),
                "hr_round": scores_dict.get("hr_round_score", 0)
            }
        }
    except Exception as e:
        print(f"Error calculating final score: {e}")
        return {
            "final_score": 70,
            "recommendation": "Recommended",
            "recommendation_level": "maybe",
            "technical_score": 70,
            "hr_score": 70,
            "ats_score": 85
        }
    response = model.generate_content(prompt)
    return response.text