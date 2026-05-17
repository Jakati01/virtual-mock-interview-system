from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr # 👈 This automatically enforces valid email formats (e.g. user@mail.com)
    password: str = Field(..., min_length=6) # 👈 Passwords must be at least 6 chars

class UserLogin(BaseModel):
    login_id: str  # 👈 This will accept EITHER a username OR an email
    password: str