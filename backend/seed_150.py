import json
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.aptitude import AptitudeQuestion

# 1. Ensure the table actually exists in PostgreSQL
Base.metadata.create_all(bind=engine)

def seed_bulk_data():
    db: Session = SessionLocal()
    try:
        # 2. Open and read your JSON file
        with open("aptitude_bank.json", "r") as file:
            questions_data = json.load(file)

        print(f"📦 Found {len(questions_data)} questions in aptitude_bank.json.")
        
        # 3. Clear existing questions so you don't get duplicates if you run this twice
        db.query(AptitudeQuestion).delete()
        print("🧹 Cleared old questions from database.")

        # 4. Insert all 150 questions
        print("🔄 Seeding Database...")
        for q_data in questions_data:
            new_question = AptitudeQuestion(
                question=q_data["question"],
                # PostgreSQL requires lists to be converted to JSON strings
                options=json.dumps(q_data["options"]), 
                correct_answer=q_data["correct_answer"]
            )
            db.add(new_question)
        
        # 5. Save the changes to PostgreSQL
        db.commit()
        print(f"✅ Successfully seeded all {len(questions_data)} Aptitude Questions!")
        
    except FileNotFoundError:
        print("🚨 Error: 'aptitude_bank.json' file not found. Make sure it is in the same folder as this script.")
    except Exception as e:
        db.rollback()
        print(f"🚨 Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_bulk_data()