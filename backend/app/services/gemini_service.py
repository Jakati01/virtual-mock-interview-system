from google import genai
import json
import re
from app.core.config import settings

class GeminiService:
    def __init__(self):
        # Using gemini-1.5-flash for speed and efficiency in real-time analysis
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = 'gemini-1.5-flash'

    async def analyze_communication(self, transcript: str):
        """
        Analyzes the transcript for grammar, fluency, and communication score.
        """
        if not transcript or len(transcript.strip()) < 5:
            return {
                "grammar_score": 0,
                "fluency_score": 0,
                "communication_score": 0,
                "feedback": "Transcript too short to analyze.",
                "improvements": "Please provide a more detailed verbal response."
            }

        prompt = f"""
        You are a professional communication coach and linguistic expert.
        Analyze the following interview answer transcript for communication quality:
        
        Transcript: "{transcript}"
        
        Tasks:
        1. Evaluate Grammar (0-100).
        2. Evaluate Fluency (0-100) - check for 'um', 'ah', repetition, and flow.
        3. Provide a brief feedback summary.
        4. Suggest 2 specific improvements.
        
        Return the result ONLY as a JSON object with this exact structure:
        {{
            "grammar_score": 85,
            "fluency_score": 70,
            "communication_score": 78,
            "feedback": "String describing overall communication",
            "improvements": "String with 2 suggestions"
        }}
        """

        try:
            # Generate content
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt
            )
            
            # Extract text from response and clean it (in case Gemini adds markdown ```json)
            response_text = response.text
            clean_json = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if clean_json:
                return json.loads(clean_json.group())
            else:
                # Fallback if regex fails
                return json.loads(response_text)
                
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return {
                "grammar_score": 0,
                "fluency_score": 0,
                "communication_score": 0,
                "feedback": "Failed to analyze communication due to an internal error.",
                "improvements": "Check API connection."
            }
        
        