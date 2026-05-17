from app.schemas.interview import AnswerSubmit

def validate_integrity(submission: AnswerSubmit):
    # your logic here


    if submission.tab_switch_count > 3 or submission.was_copy_pasted:
        # Log this in the database 'cheating_log' table
        return False
    return True