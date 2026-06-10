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

        if result_df is not None and not result_df.empty:
            data_context = f"""
            The user asked: {request.question}
            
            Company data query results:
            {result_df.head(20).to_string()}
            
            Answer using this data. Also use your knowledge of manufacturing 
            best practices to provide additional context where relevant.
            Be concise and direct. Highlight critical issues.
            """
        else:
            data_context = f"""
            The user asked: {request.question}
            
            No specific company data was found for this query.
            Answer using your knowledge of manufacturing, quality control,
            and industry best practices.
            """

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system="""You are Viro, an expert manufacturing quality AI assistant. 
            You have access to company data and deep knowledge of manufacturing,
            quality control, lean manufacturing, Six Sigma, and industry best practices.
            Be concise, direct, and actionable. When you see quality issues in data,
            provide specific recommendations based on industry standards.""",
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

        # Extract text from response handling tool use
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
        prompt = f"""
        A manufacturing dashboard manager said: "{request.message}"
        
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
