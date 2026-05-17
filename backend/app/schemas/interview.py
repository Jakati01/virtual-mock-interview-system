from pydantic import BaseModel

class AnswerSubmit(BaseModel):
    answer_text: str
    
    # Anti-Cheat Tracking (Sent from your frontend)
    tab_switch_count: int = 0
    was_copy_pasted: bool = False