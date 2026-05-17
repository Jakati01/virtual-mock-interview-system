from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "your-super-secret-key-change-this-later"
    GROQ_API_KEY: str
    HUGGINGFACE_API_KEY: str
    GEMINI_API_KEY: str
    DEEPSEEK_API_KEY: str
    CLOUDFLARE_API_TOKEN: str
    CLOUDFLARE_ACCOUNT_ID: str
    OPENROUTER_API_KEY: str

    # THIS IS THE MAGIC LINE that tells Pydantic to read your .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
class Settings(BaseSettings):
    # ... other keys
    OPENROUTER_API_KEY: str  # Make sure it is spelled exactly like this!