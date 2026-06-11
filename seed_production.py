import requests
import random
from datetime import datetime, timedelta
import uuid

BASE_URL = "https://web-production-0457e.up.railway.app"
COMPANY_ID = "9FDA7C8E"

defect_types = [
    "scratch", "dent", "paint_issue", "electrical_fault",
    "mechanical_failure", "alignment_issue", "brake_issue",
    "lift_malfunction", "weld_defect", "trim_issue"
]

severities = ["low", "medium", "high", "critical"]
severity_weights = [0.4, 0.3, 0.2, 0.1]
stages = [110, 310, 510, 710]
statuses = ["in_progress", "in_progress", "in_progress", "flagged"]

print("Seeding products and defects...")

for i in range(1, 51):
    product_id = f"MV-VIN-{str(i).zfill(4)}"
    stage = random.choice(stages)
    status = random.choice(statuses)

    # Create product
    requests.post(f"{BASE_URL}/products", json={
        "company_id": COMPANY_ID,
        "product_id": product_id,
        "current_stage": stage,
        "status": status,
    })

    # Add 0-4 defects per product
    num_defects = random.randint(0, 4)
    for j in range(num_defects):
        days_ago = random.randint(0, 30)
        logged_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
        severity = random.choices(severities, weights=severity_weights)[0]
        resolved = random.choice([0, 0, 1])  # 33% resolved

        requests.post(f"{BASE_URL}/defects", json={
            "company_id": COMPANY_ID,
            "product_id": product_id,
            "stage_number": random.choice(stages),
            "defect_type": random.choice(defect_types),
            "severity": severity,
            "notes": f"Issue found during inspection at stage {stage}",
        })

print("Done! 50 vehicles and defects seeded.")
