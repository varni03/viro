import sys
sys.path.append('.')
from database.db import ViroDB
import bcrypt
import uuid

db = ViroDB()

users = [
    ("manager@meridianvans.com", "password123", "Dana", "Reyes", "manager", "MV001"),
    ("worker@meridianvans.com", "password123", "Sam", "Okafor", "worker", "MV001"),
    ("manager@meddevice.com", "password123", "Sarah", "Jones", "manager", "MED001"),
    ("worker@meddevice.com", "password123", "Mike", "Brown", "worker", "MED001"),
    ("repair@meridianvans.com", "password123", "Riley", "Chen", "repair", "MV001"),
    ("repair@meddevice.com", "password123", "Lisa", "Chen", "repair", "MED001"),
]

for email, password, first, last, role, company_id in users:
    existing = db.query("SELECT * FROM users WHERE email = ?", (email,))
    if existing.empty:
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        db.execute("""
            INSERT INTO users
            (user_id, company_id, email, password_hash, role, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), company_id, email, password_hash, role, first, last))
        print(f"Created {role}: {email}")
    else:
        print(f"Already exists: {email}")

print("Done!")
