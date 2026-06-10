import uuid
import random
from datetime import datetime, timedelta
from database.db import ViroDB

def generate_fake_data():
    db = ViroDB()

    # ── Companies ──────────────────────────────────────────────
    companies = [
        ("MV001", "Meridian Vans", "Automotive", "vin"),
        ("MED001", "MedDevice Co", "Medical Devices", "serial_number"),
        ("FOOD001", "FreshPack Foods", "Food Production", "batch_number"),
    ]

    for company in companies:
        db.execute("""
            INSERT OR IGNORE INTO companies 
            (company_id, name, industry, universal_id_field)
            VALUES (?, ?, ?, ?)
        """, company)

    # ── Stages per company ─────────────────────────────────────
    stages_by_company = {
        "MV001": [
            (110, "Entry - In The Door", 30),
            (310, "Off End of Upfit Line", 45),
            (510, "VF Complete / VCD Inspected", 60),
            (710, "Approved to Park/Ship", 15),
        ],
        "MED001": [
            (100, "Assembly", 60),
            (200, "Sterilization", 90),
            (300, "Quality Check", 45),
            (400, "Packaging", 30),
        ],
        "FOOD001": [
            (100, "Intake", 20),
            (200, "Processing", 40),
            (300, "Packaging", 30),
            (400, "Final Inspection", 25),
        ],
    }

    for company_id, stage_list in stages_by_company.items():
        for stage_number, stage_name, duration in stage_list:
            stage_id = f"{company_id}_STG_{stage_number}"
            db.execute("""
                INSERT OR IGNORE INTO stages
                (stage_id, company_id, stage_number, stage_name, expected_duration_mins)
                VALUES (?, ?, ?, ?, ?)
            """, (stage_id, company_id, stage_number, stage_name, duration))

    # ── Products and defects per company ──────────────────────
    defect_types_by_company = {
        "MV001": ["scratch", "dent", "paint_issue", 
                  "electrical", "mechanical", "alignment"],
        "MED001": ["contamination", "dimensional_error", 
                   "surface_defect", "assembly_fault"],
        "FOOD001": ["contamination", "weight_variance", 
                    "seal_failure", "labeling_error"],
    }

    severities = ["low", "medium", "high", "critical"]
    statuses = ["in_progress", "completed", "on_hold", "flagged"]

    for company_id, stage_list in stages_by_company.items():
        stage_numbers = [s[0] for s in stage_list]
        defect_types = defect_types_by_company[company_id]

        for i in range(80):
            product_id = f"{company_id}_PROD_{str(i+1).zfill(4)}"
            entry_date = datetime.now() - timedelta(days=random.randint(0, 30))
            current_stage = random.choice(stage_numbers)
            status = random.choice(statuses)

            db.execute("""
                INSERT OR IGNORE INTO products
                (product_id, company_id, entry_date, current_stage, status)
                VALUES (?, ?, ?, ?, ?)
            """, (product_id, company_id, 
                  entry_date.isoformat(), current_stage, status))

            # 0-6 defects per product
            for _ in range(random.randint(0, 6)):
                defect_id = str(uuid.uuid4())
                stage_number = random.choice(stage_numbers[:-1])
                defect_type = random.choice(defect_types)
                severity = random.choices(
                    severities,
                    weights=[40, 30, 20, 10]  # low most common, critical rare
                )[0]
                logged_at = entry_date + timedelta(hours=random.randint(1, 72))
                resolved = random.choice([0, 0, 1])  # mostly unresolved

                db.execute("""
                    INSERT OR IGNORE INTO defects
                    (defect_id, company_id, product_id, stage_number,
                     defect_type, severity, logged_at, resolved)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (defect_id, company_id, product_id, stage_number,
                      defect_type, severity, logged_at.isoformat(), resolved))

    print("✅ Fake data generated successfully!")
    print("Companies: Meridian Vans, MedDevice Co, FreshPack Foods")
    print("Products: 80 per company (240 total)")

if __name__ == "__main__":
    generate_fake_data()
