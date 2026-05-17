import requests
from app.core.config import settings

class HuggingFaceService:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/dbmdz/bert-large-cased-finetuned-conll03-english"
        self.headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}

    async def extract_skills(self, text: str):
        # Using a Token Classification model for NER
        response = requests.post(self.api_url, headers=self.headers, json={"inputs": text})
        if response.status_code != 200:
            return []
        entities = response.json()
        # Filter for entities related to skills/organizations/technologies
        return list(set([ent['word'] for ent in entities if ent['entity_group'] in ['ORG', 'MISC']]))