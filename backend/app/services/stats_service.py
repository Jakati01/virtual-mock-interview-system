def calculate_skill_gap(user):
    """
    Identifies which skills the user is strong in vs. where they need work.
    """
    strong_points = []
    weak_points = []
    
    # Logic: If MCQ > 80 but Coding < 50, they are "Theoretical" but lack "Practical" skills.
    if user.mcq_score > 80 and user.coding_score < 50:
        weak_points.append(f"Practical implementation in {user.extracted_skills[0]}")
        strong_points.append("Theoretical Knowledge")
    
    if user.communication_score > 85:
        strong_points.append("Professional Communication")
    else:
        weak_points.append("Verbal Fluency and Confidence")
        
    return {"strengths": strong_points, "weaknesses": weak_points}