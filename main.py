from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import anthropic
import base64
import json
import os
from dotenv import load_dotenv
from database.db import ViroDB
import bcrypt
import jwt
from datetime import datetime, timedelta


load_dotenv()

app = FastAPI(title="Viro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = ViroDB()
client = anthropic.Anthropic()

# ── Companies ──────────────────────────────────────────────────
@app.get("/companies")
def get_companies():
    companies = db.query("SELECT * FROM companies")
    return companies.to_dict(orient="records")

# ── Products ───────────────────────────────────────────────────
@app.get("/products/{company_id}")
def get_products(company_id: str):
    products = db.get_products(company_id)
    return products.to_dict(orient="records")

# ── Defects ────────────────────────────────────────────────────
@app.get("/defects/{company_id}")
def get_defects(company_id: str):
    defects = db.get_defects(company_id)
    return defects.to_dict(orient="records")

@app.get("/defects/{company_id}/{product_id}")
def get_product_defects(company_id: str, product_id: str):
    defects = db.get_defects(company_id, product_id)
    return defects.to_dict(orient="records")

@app.get("/defects/by-stage/{company_id}")
def get_defects_by_stage(company_id: str):
    data = db.get_defects_by_stage(company_id)
    return data.to_dict(orient="records")

class DefectCreate(BaseModel):
    company_id: str
    product_id: str
    stage_number: int
    defect_type: str
    severity: str
    notes: Optional[str] = None

@app.post("/defects")
def create_defect(defect: DefectCreate):
    defect_id = db.log_defect(
        defect.company_id, defect.product_id,
        defect.stage_number, defect.defect_type,
        defect.severity, defect.notes
    )
    return {"defect_id": defect_id, "message": "Defect logged successfully"}

# ── Stages ─────────────────────────────────────────────────────
@app.get("/stages/{company_id}")
def get_stages(company_id: str):
    stages = db.query(
        "SELECT * FROM stages WHERE company_id = ? ORDER BY stage_number",
        (company_id,)
    )
    return stages.to_dict(orient="records")


# ── Image Analysis ─────────────────────────────────────────────
@app.post("/defects/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        base64_image = base64.standard_b64encode(image_bytes).decode("utf-8")
        media_type = file.content_type or "image/jpeg"

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": """You are a manufacturing quality inspector.
                        Analyze this image and return ONLY a JSON object:
                        {
                            "defect_type": "short phrase",
                            "severity": "low or medium or high or critical",
                            "notes": "one sentence description"
                        }"""
                    }
                ]
            }]
        )

        return json.loads(response.content[0].text)
    except Exception as e:
        return {"defect_type": "", "severity": "low", "notes": "", "error": str(e)}

# ── Predictive ─────────────────────────────────────────────────
@app.get("/predictive/at-risk/{company_id}")
def get_at_risk(company_id: str):
    data = db.get_at_risk_products(company_id)
    return data.to_dict(orient="records")

@app.get("/predictive/stage-health/{company_id}")
def get_stage_health(company_id: str):
    data = db.get_stage_health(company_id)
    return data.to_dict(orient="records")

# ── Analytics ──────────────────────────────────────────────────
@app.get("/analytics/trends/{company_id}")
def get_trends(company_id: str):
    data = db.get_defect_trends(company_id)
    return data.to_dict(orient="records")

# ── AI Assistant ───────────────────────────────────────────────
class AIRequest(BaseModel):
    question: str
    company_id: str
    history: List[dict] = []

@app.post("/ai/ask")
def ask_ai(request: AIRequest):
    try:
        result_df, sql = db.natural_language_query(
            request.question, request.company_id
        )

        # Get company terminology
        company_config = db.query(
            "SELECT config_key, config_value FROM company_config WHERE company_id = ?",
            (request.company_id,)
        )
        config = dict(zip(company_config["config_key"], company_config["config_value"])) if not company_config.empty else {}
        term_product = config.get("term_product", "product")
        term_defect = config.get("term_defect", "defect")
        term_stage = config.get("term_stage", "stage")
        term_issue = config.get("term_issue", "issue")

        # Get company info
        company_info = db.query(
            "SELECT * FROM companies WHERE company_id = ?",
            (request.company_id,)
        )
        company_name = company_info.iloc[0]["name"] if not company_info.empty else "this company"
        industry = company_info.iloc[0]["industry"] if not company_info.empty else "operations"

        system_prompt = f"""You are an AI assistant for {company_name}, a {industry} company.
You have access to their operational data and deep knowledge of their industry.
Be concise, direct, and actionable.

Use this companys specific terminology:
- Call products: {term_product}
- Call defects: {term_defect}
- Call stages: {term_stage}
- Call issues: {term_issue}

When you see problems in the data, provide specific recommendations."""

        if result_df is not None and not result_df.empty:
            data_context = f"""
            The user asked: {request.question}
            
            Company data query results:
            {result_df.head(20).to_string()}
            
            Answer using this data. Be concise and direct. Highlight critical issues.
            """
        else:
            data_context = f"""
            The user asked: {request.question}
            
            No specific company data was found for this query.
            Answer using your knowledge of {industry} and operational best practices.
            """

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search"
            }],
            messages=[
                *[{"role": m["role"], "content": m["content"]} 
                  for m in request.history[-6:]],
                {"role": "user", "content": data_context}
            ]
        )

        full_response = ""
        for block in response.content:
            if hasattr(block, "text"):
                full_response += block.text

        return {
            "answer": full_response,
            "data": result_df.to_dict(orient="records") if result_df is not None and not result_df.empty else [],
            "sql": sql if isinstance(sql, str) else ""
        }
    except Exception as e:
        return {"answer": f"Error: {str(e)}", "data": [], "sql": ""}


class FilteredQuery(BaseModel):
    company_id: str
    stages: list = []
    severities: list = []
    status: Optional[str] = None
    defect_type: Optional[str] = None
    product_id: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@app.post("/defects/filtered")
def get_filtered_defects(query: FilteredQuery):
    sql = "SELECT * FROM defects WHERE company_id = ?"
    params = [query.company_id]

    if query.stages:
        placeholders = ",".join("?" * len(query.stages))
        sql += f" AND stage_number IN ({placeholders})"
        params.extend(query.stages)

    if query.severities:
        placeholders = ",".join("?" * len(query.severities))
        sql += f" AND severity IN ({placeholders})"
        params.extend(query.severities)

    if query.defect_type:
        sql += " AND defect_type LIKE ?"
        params.append(f"%{query.defect_type}%")

    if query.product_id:
        sql += " AND product_id LIKE ?"
        params.append(f"%{query.product_id}%")

    if query.date_from:
        sql += " AND logged_at >= ?"
        params.append(query.date_from)

    if query.date_to:
        sql += " AND logged_at <= ?"
        params.append(query.date_to)

    sql += " ORDER BY logged_at DESC"

    result = db.query(sql, params)
    return result.to_dict(orient="records")

class AIFilterRequest(BaseModel):
    message: str
    company_id: str
    current_filters: dict = {}

@app.post("/ai/interpret-filters")
def interpret_filters(request: AIFilterRequest):
    """AI interprets natural language and returns filter changes"""
    try:
        # Get terminology
        company_config = db.query(
            "SELECT config_key, config_value FROM company_config WHERE company_id = ?",
            (request.company_id,)
        )
        config = dict(zip(company_config["config_key"], company_config["config_value"])) if not company_config.empty else {}
        term_product = config.get("term_product", "product")
        term_defect = config.get("term_defect", "defect")


        prompt = f"""
        A manager at a company said: "{request.message}"
        They call their products "{term_product}" and their defects "{term_defect}".

        
        Current filters: {request.current_filters}
        
        Determine if this is a filter/view change request or just a question.
        
        If it is a filter request, return ONLY this JSON:
        {{
            "is_filter_change": true,
            "filters": {{
                "stages": [list of stage numbers as integers, or empty list for all],
                "severities": [list from: "low","medium","high","critical", or empty for all],
                "status": "in_progress|completed|on_hold|flagged or null for all",
                "defect_type": "string or null",
                "product_id": "string or null",
                "date_from": "YYYY-MM-DD or null",
                "date_to": "YYYY-MM-DD or null"
            }},
            "message": "one sentence confirming what you changed"
        }}
        
        If it is just a question not a filter change, return:
        {{
            "is_filter_change": false,
            "filters": null,
            "message": ""
        }}
        
        Examples of filter requests:
        - "show me only critical defects" -> severities: ["critical"]
        - "filter to station 310" -> stages: [310]
        - "show flagged vehicles" -> status: "flagged"
        - "reset filters" -> all empty/null
        - "show high and critical from last week" -> severities + date range
        
        Examples of questions (not filter changes):
        - "which stage has the most defects?"
        - "what should I do about the brake issues?"
        - "how does our defect rate compare to industry?"
        
        Return ONLY the JSON, no other text.
        """

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(response.content[0].text.strip())
        return result

    except Exception as e:
        return {"is_filter_change": False, "filters": None, "message": ""}
# ── Auth ───────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "viro-secret-key-change-in-production")

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str
    company_id: str

def create_token(user_id: str, role: str, company_id: str):
    payload = {
        "user_id": user_id,
        "role": role,
        "company_id": company_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@app.post("/auth/register")
def register(req: RegisterRequest):
    import uuid
    existing = db.query(
        "SELECT * FROM users WHERE email = ?", (req.email,)
    )
    if not existing.empty:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = bcrypt.hashpw(
        req.password.encode(), bcrypt.gensalt()
    ).decode()

    user_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO users
        (user_id, company_id, email, password_hash, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, req.company_id, req.email, password_hash,
          req.role, req.first_name, req.last_name))

    token = create_token(user_id, req.role, req.company_id)
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": req.email,
            "role": req.role,
            "company_id": req.company_id,
            "first_name": req.first_name,
            "last_name": req.last_name,
        }
    }

@app.post("/auth/login")
def login(req: LoginRequest):
    user = db.query(
        "SELECT * FROM users WHERE email = ?", (req.email,)
    )
    if user.empty:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = user.iloc[0]
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["user_id"], user["role"], user["company_id"])
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "company_id": user["company_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
        }
    }

@app.get("/auth/me")
def get_me(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = db.query(
            "SELECT * FROM users WHERE user_id = ?",
            (payload["user_id"],)
        )
        if user.empty:
            raise HTTPException(status_code=401, detail="User not found")
        u = user.iloc[0]
        return {
            "user_id": u["user_id"],
            "email": u["email"],
            "role": u["role"],
            "company_id": u["company_id"],
            "first_name": u["first_name"],
            "last_name": u["last_name"],
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/production/line/{company_id}")
def get_production_line(company_id: str):
    """Get all active vehicles with their stage and defect status"""
    result = db.query("""
        SELECT 
            p.product_id,
            p.current_stage,
            p.status,
            p.entry_date,
            COUNT(d.defect_id) as total_defects,
            SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as open_defects,
            SUM(CASE WHEN d.severity = 'critical' AND d.resolved = 0 THEN 1 ELSE 0 END) as critical_open,
            SUM(CASE WHEN d.severity = 'high' AND d.resolved = 0 THEN 1 ELSE 0 END) as high_open
        FROM products p
        LEFT JOIN defects d ON p.product_id = d.product_id
            AND d.company_id = p.company_id
        WHERE p.company_id = ?
        AND p.status != 'completed'
        GROUP BY p.product_id
        ORDER BY p.current_stage ASC, critical_open DESC
    """, (company_id,))
    return result.to_dict(orient="records")

@app.put("/defects/{defect_id}/resolve")
def resolve_defect(defect_id: str):
    db.execute("""
        UPDATE defects SET resolved = 1 WHERE defect_id = ?
    """, (defect_id,))
    return {"message": "Defect resolved"}

@app.put("/products/{product_id}/stage")
def update_stage(product_id: str, stage: int, company_id: str):
    db.execute("""
        UPDATE products SET current_stage = ? WHERE product_id = ? AND company_id = ?
    """, (stage, product_id, company_id))
    return {"message": "Stage updated"}

@app.put("/products/{product_id}/status")
def update_status(product_id: str, status: str, company_id: str):
    db.execute("""
        UPDATE products SET status = ? WHERE product_id = ? AND company_id = ?
    """, (status, product_id, company_id))
    return {"message": "Status updated"}


# Defect types table setup
db.execute("""
    CREATE TABLE IF NOT EXISTS defect_types (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        default_severity TEXT DEFAULT 'medium',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS connectors_config (
        connector_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        connector_name TEXT NOT NULL,
        connector_type TEXT NOT NULL,
        config JSONB,
        column_mapping TEXT,
        sync_schedule TEXT DEFAULT 'manual',
        is_active INTEGER DEFAULT 1,
        last_sync TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS company_modules (
        company_id TEXT,
        module_id TEXT,
        enabled INTEGER DEFAULT 1,
        custom_label TEXT,
        custom_icon TEXT,
        sort_order INTEGER,
        PRIMARY KEY (company_id, module_id)
    )
""")



class StageCreate(BaseModel):
    company_id: str
    stage_number: int
    stage_name: str
    expected_duration_mins: Optional[int] = 30

class DefectTypeCreate(BaseModel):
    company_id: str
    name: str
    default_severity: str = "medium"

class RoleUpdate(BaseModel):
    role: str

class CompanyUpdate(BaseModel):
    name: str
    industry: str
    universal_id_field: str

@app.post("/settings/stages")
def add_stage(stage: StageCreate):
    import uuid
    stage_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO stages (stage_id, company_id, stage_number, stage_name, expected_duration_mins)
        VALUES (?, ?, ?, ?, ?)
    """, (stage_id, stage.company_id, stage.stage_number, stage.stage_name, stage.expected_duration_mins))
    return {"stage_id": stage_id, "message": "Stage added"}

@app.delete("/settings/stages/{stage_id}")
def delete_stage(stage_id: str):
    db.execute("DELETE FROM stages WHERE stage_id = ?", (stage_id,))
    return {"message": "Stage deleted"}

@app.get("/settings/defect-types/{company_id}")
def get_defect_types(company_id: str):
    result = db.query("SELECT * FROM defect_types WHERE company_id = ? ORDER BY name", (company_id,))
    return result.to_dict(orient="records")

@app.post("/settings/defect-types")
def add_defect_type(dt: DefectTypeCreate):
    import uuid
    type_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO defect_types (id, company_id, name, default_severity)
        VALUES (?, ?, ?, ?)
    """, (type_id, dt.company_id, dt.name, dt.default_severity))
    return {"id": type_id, "message": "Defect type added"}

@app.delete("/settings/defect-types/{type_id}")
def delete_defect_type(type_id: str):
    db.execute("DELETE FROM defect_types WHERE id = ?", (type_id,))
    return {"message": "Deleted"}

@app.get("/settings/users/{company_id}")
def get_users(company_id: str):
    result = db.query("""
        SELECT user_id, company_id, email, role, first_name, last_name, is_active
        FROM users WHERE company_id = ?
        ORDER BY role, first_name
    """, (company_id,))
    return result.to_dict(orient="records")

@app.put("/settings/users/{user_id}/role")
def update_user_role(user_id: str, update: RoleUpdate):
    db.execute("UPDATE users SET role = ? WHERE user_id = ?", (update.role, user_id))
    return {"message": "Role updated"}

@app.put("/settings/users/{user_id}/deactivate")
def deactivate_user(user_id: str):
    db.execute("UPDATE users SET is_active = 0 WHERE user_id = ?", (user_id,))
    return {"message": "User deactivated"}

@app.put("/settings/company/{company_id}")
def update_company(company_id: str, update: CompanyUpdate):
    db.execute("""
        UPDATE companies SET name = ?, industry = ?, universal_id_field = ?
        WHERE company_id = ?
    """, (update.name, update.industry, update.universal_id_field, company_id))
    return {"message": "Company updated"}

# ── Connectors ─────────────────────────────────────────────────
import pandas as pd
import io

class ConnectorCreate(BaseModel):
    company_id: str
    connector_name: str
    connector_type: str
    sync_schedule: str = "manual"
    column_mapping: Optional[str] = None

class ColumnMapping(BaseModel):
    company_id: str
    connector_id: str
    mapping: dict

@app.get("/connectors/{company_id}")
def get_connectors(company_id: str):
    result = db.query(
        "SELECT * FROM connectors_config WHERE company_id = ?",
        (company_id,)
    )
    return result.to_dict(orient="records")

@app.post("/connectors")
def create_connector(connector: ConnectorCreate):
    import uuid
    connector_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO connectors_config
        (connector_id, company_id, connector_name, connector_type, sync_schedule)
        VALUES (?, ?, ?, ?, ?)
    """, (connector_id, connector.company_id, connector.connector_name,
          connector.connector_type, connector.sync_schedule))
    return {"connector_id": connector_id, "message": "Connector created"}

@app.delete("/connectors/{connector_id}")
def delete_connector(connector_id: str):
    db.execute("DELETE FROM connectors_config WHERE connector_id = ?", (connector_id,))
    return {"message": "Connector deleted"}

@app.post("/connectors/{connector_id}/upload")
async def upload_file(connector_id: str, company_id: str, file: UploadFile = File(...)):
    """Upload CSV or Excel file and preview columns"""
    try:
        contents = await file.read()

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files supported")

        # Return column names and preview
        return {
            "columns": df.columns.tolist(),
            "preview": df.head(3).to_dict(orient="records"),
            "total_rows": len(df),
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/connectors/{connector_id}/sync")
async def sync_file(
    connector_id: str,
    company_id: str,
    file: UploadFile = File(...),
    product_id_col: str = "",
    stage_col: str = "",
    status_col: str = "",
    issue_type_col: str = "",
    severity_col: str = "",
    logged_at_col: str = "",
):
    """Sync file data into Viro standard model"""
    try:
        contents = await file.read()

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        imported = 0
        errors = 0

        for _, row in df.iterrows():
            try:
                product_id = str(row[product_id_col]) if product_id_col else None
                if not product_id:
                    continue

                # Upsert product
                existing = db.query(
                    "SELECT * FROM products WHERE product_id = ? AND company_id = ?",
                    (product_id, company_id)
                )

                stage = int(row[stage_col]) if stage_col and stage_col in row else 110
                status = str(row[status_col]) if status_col and status_col in row else "in_progress"

                if existing.empty:
                    db.execute("""
                        INSERT INTO products (product_id, company_id, entry_date, current_stage, status)
                        VALUES (?, ?, ?, ?, ?)
                    """, (product_id, company_id, datetime.now().isoformat(), stage, status))
                else:
                    db.execute("""
                        UPDATE products SET current_stage = ?, status = ?
                        WHERE product_id = ? AND company_id = ?
                    """, (stage, status, product_id, company_id))

                # Import issue if present
                if issue_type_col and issue_type_col in row and row[issue_type_col]:
                    import uuid
                    defect_id = str(uuid.uuid4())
                    severity = str(row[severity_col]).lower() if severity_col and severity_col in row else "medium"
                    if severity not in ["low", "medium", "high", "critical"]:
                        severity = "medium"
                    logged_at = str(row[logged_at_col]) if logged_at_col and logged_at_col in row else datetime.now().isoformat()

                    db.execute("""
                        INSERT INTO defects
                        (defect_id, company_id, product_id, stage_number, defect_type, severity, logged_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (defect_id, company_id, product_id, stage,
                          str(row[issue_type_col]), severity, logged_at))

                imported += 1
            except Exception:
                errors += 1

        # Update last sync
        db.execute(
            "UPDATE connectors_config SET last_sync = ? WHERE connector_id = ?",
            (datetime.now().isoformat(), connector_id)
        )

        return {
            "message": f"Sync complete",
            "imported": imported,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Terminology config ──────────────────────────────────────────
@app.get("/config/{company_id}")
def get_config(company_id: str):
    result = db.query(
        "SELECT config_key, config_value FROM company_config WHERE company_id = ?",
        (company_id,)
    )
    if result.empty:
        return {
            "term_product": "Product",
            "term_defect": "Defect",
            "term_stage": "Stage",
            "term_issue": "Issue",
        }
    return dict(zip(result["config_key"], result["config_value"]))

@app.post("/config/{company_id}")
def save_config(company_id: str, config: dict):
    for key, value in config.items():
        existing = db.query(
            "SELECT * FROM company_config WHERE company_id = ? AND config_key = ?",
            (company_id, key)
        )
        if existing.empty:
            db.execute(
                "INSERT INTO company_config VALUES (?, ?, ?)",
                (company_id, key, value)
            )
        else:
            db.execute(
                "UPDATE company_config SET config_value = ? WHERE company_id = ? AND config_key = ?",
                (value, company_id, key)
            )
    return {"message": "Config saved"}

# ── Onboarding ─────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str
    industry: str
    universal_id_field: str = "product"

@app.post("/onboarding/company")
def create_company(company: CompanyCreate):
    import uuid
    company_id = str(uuid.uuid4())[:8].upper()
    db.execute("""
        INSERT INTO companies (company_id, name, industry, universal_id_field)
        VALUES (?, ?, ?, ?)
    """, (company_id, company.name, company.industry, company.universal_id_field))
    return {"company_id": company_id, "message": "Company created"}

# ── Modules ────────────────────────────────────────────────────
class ModuleUpdate(BaseModel):
    modules: list

@app.get("/modules/{company_id}")
def get_modules(company_id: str):
    result = db.query(
        "SELECT * FROM company_modules WHERE company_id = ? ORDER BY sort_order",
        (company_id,)
    )
    return result.to_dict(orient="records")

@app.post("/modules/{company_id}")
def save_modules(company_id: str, update: ModuleUpdate):
    db.execute("DELETE FROM company_modules WHERE company_id = ?", (company_id,))
    for i, module in enumerate(update.modules):
        db.execute("""
            INSERT INTO company_modules 
            (company_id, module_id, enabled, custom_label, custom_icon, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            company_id,
            module["id"],
            1 if module.get("enabled", True) else 0,
            module.get("custom_label", ""),
            module.get("custom_icon", ""),
            i
        ))
    return {"message": "Modules saved"}
