from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = ViroDB()
client = anthropic.Anthropic()

# Single source of truth for the Claude model. Bump to "claude-opus-4-8" for
# richer output at higher cost. (claude-sonnet-4-20250514 retired 2026-06-15.)
AI_MODEL = "claude-sonnet-4-6"

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

@app.get("/defects/by-stage/{company_id}")
def get_defects_by_stage(company_id: str):
    try:
        data = db.get_defects_by_stage(company_id)
        return data.to_dict(orient="records")
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/defects/{company_id}/{product_id}")
def get_product_defects(company_id: str, product_id: str):
    defects = db.get_defects(company_id, product_id)
    return defects.to_dict(orient="records")


class DefectCreate(BaseModel):
    company_id: str
    product_id: str
    stage_number: int
    defect_type: str
    severity: str
    notes: Optional[str] = None

@app.post("/defects")
def create_defect(defect: DefectCreate):
    import uuid
    defect_id = db.log_defect(
        defect.company_id, defect.product_id,
        defect.stage_number, defect.defect_type,
        defect.severity, defect.notes
    )
    
    # Create notification for critical and high severity
    if defect.severity in ["critical", "high"]:
        notification_id = str(uuid.uuid4())
        title = f"{'🔴 Critical' if defect.severity == 'critical' else '🟠 High'} issue logged"
        message = f"{defect.defect_type.replace('_', ' ').title()} on {defect.product_id} at stage {defect.stage_number}"
        db.execute("""
            INSERT INTO notifications
            (notification_id, company_id, title, message, severity, product_id, defect_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (notification_id, defect.company_id, title, message,
              defect.severity, defect.product_id, defect_id))
    
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
            model=AI_MODEL,
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
@app.get("/analytics/summary/{company_id}")
def get_analytics_summary(company_id: str):
    # Total defects
    total = db.query(
        "SELECT COUNT(*) as count FROM defects WHERE company_id = ?",
        (company_id,)
    ).iloc[0]["count"]

    # Resolved vs unresolved
    resolved = db.query(
        "SELECT COUNT(*) as count FROM defects WHERE company_id = ? AND resolved = 1",
        (company_id,)
    ).iloc[0]["count"]

    # Critical count
    critical = db.query(
        "SELECT COUNT(*) as count FROM defects WHERE company_id = ? AND severity = 'critical'",
        (company_id,)
    ).iloc[0]["count"]

    # Average resolution time in hours
    avg_time = db.query("""
        SELECT AVG(
            EXTRACT(EPOCH FROM (NOW() - logged_at::timestamp)) / 3600
        ) as avg_hours
        FROM defects 
        WHERE company_id = ? AND resolved = 1
    """, (company_id,))
    avg_hours = round(avg_time.iloc[0]["avg_hours"] or 0, 1)

    # First pass yield — products with zero defects
    total_products = db.query(
        "SELECT COUNT(*) as count FROM products WHERE company_id = ?",
        (company_id,)
    ).iloc[0]["count"]

    defect_products = db.query(
        "SELECT COUNT(DISTINCT product_id) as count FROM defects WHERE company_id = ?",
        (company_id,)
    ).iloc[0]["count"]

    fpy = round(((total_products - defect_products) / total_products * 100) if total_products > 0 else 0, 1)

    return {
        "total_defects": int(total),
        "resolved": int(resolved),
        "unresolved": int(total - resolved),
        "critical": int(critical),
        "avg_resolution_hours": avg_hours,
        "first_pass_yield": fpy,
        "total_products": int(total_products),
    }

@app.get("/analytics/top-defects/{company_id}")
def get_top_defects(company_id: str):
    result = db.query("""
        SELECT 
            defect_type,
            COUNT(*) as count,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
            SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count,
            SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) as open_count
        FROM defects
        WHERE company_id = ?
        GROUP BY defect_type
        ORDER BY count DESC
        LIMIT 10
    """, (company_id,))
    return result.to_dict(orient="records")

@app.get("/analytics/stage-performance/{company_id}")
def get_stage_performance(company_id: str):
    result = db.query("""
        SELECT 
            d.stage_number,
            s.stage_name,
            COUNT(d.defect_id) as total_defects,
            SUM(CASE WHEN d.severity = 'critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN d.severity = 'high' THEN 1 ELSE 0 END) as high,
            SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as open_defects,
            ROUND(AVG(CASE WHEN d.resolved = 1 
                THEN EXTRACT(EPOCH FROM (NOW() - d.logged_at::timestamp)) / 3600
                ELSE NULL END), 1) as avg_resolution_hours
        FROM defects d
        LEFT JOIN stages s ON d.stage_number = s.stage_number 
            AND s.company_id = d.company_id
        WHERE d.company_id = ?
        GROUP BY d.stage_number, s.stage_name
        ORDER BY total_defects DESC
    """, (company_id,))
    return result.to_dict(orient="records")

@app.get("/analytics/resolution-trend/{company_id}")
def get_resolution_trend(company_id: str):
    result = db.query("""
        SELECT 
            DATE(logged_at::timestamp) as date,
            COUNT(*) as logged,
            SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved
        FROM defects
        WHERE company_id = ?
        AND logged_at::timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(logged_at::timestamp)
        ORDER BY date ASC
    """, (company_id,))
    return result.to_dict(orient="records")

@app.get("/analytics/saved/{company_id}")
def get_saved_analytics(company_id: str):
    result = db.query(
        "SELECT * FROM saved_analytics WHERE company_id = ? ORDER BY created_at DESC",
        (company_id,)
    )
    return result.to_dict(orient="records")

@app.delete("/analytics/saved/{analysis_id}")
def delete_saved_analysis(analysis_id: str):
    db.execute("DELETE FROM saved_analytics WHERE id = ?", (analysis_id,))
    return {"message": "Deleted"}

class AnalyticsRequest(BaseModel):
    company_id: str
    question: str

class SaveAnalytics(BaseModel):
    company_id: str
    title: str
    sql_query: str
    chart_type: str
    description: str

@app.post("/analytics/generate")
def generate_analytics(request: AnalyticsRequest):
    try:
        schema = """
        Tables:
        - products (product_id, company_id, current_stage, status, entry_date)
        - defects (defect_id, company_id, product_id, stage_number, defect_type, severity, notes, logged_at, resolved)
        - stages (stage_id, company_id, stage_number, stage_name)
        - defect_custom_values (defect_id, field_id, value)
        - custom_fields (field_id, company_id, field_name, field_label, field_type)
        """

        prompt = f"""You are a SQL expert for a manufacturing quality database.
        
        Database schema:
        {schema}
        
        The user wants this analysis: "{request.question}"
        
        Generate a SQLite SQL query that answers this question for company_id = '{request.company_id}'.
        
        Rules:
        - Always filter by company_id = '{request.company_id}'
        - Return maximum 20 rows
        - Use clear column aliases
        - Only use SELECT statements, no INSERT/UPDATE/DELETE
        - For time-based queries use logged_at field
        - Keep it simple and readable
        
        Return ONLY a JSON object:
        {{
            "sql": "SELECT ...",
            "title": "Short title for this analysis",
            "description": "One sentence describing what this shows",
            "chart_type": "bar or line or table",
            "x_axis": "column name for x axis",
            "y_axis": "column name for y axis"
        }}
        
        Return ONLY the JSON, no other text."""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(response.content[0].text.strip())
        
        # Run the query to preview
        try:
            df = db.query(result["sql"])
            preview = df.head(5).to_dict(orient="records")
            columns = df.columns.tolist()
        except Exception as e:
            return {"error": f"Query failed: {str(e)}", "sql": result.get("sql", "")}

        return {
            "sql": result["sql"],
            "title": result["title"],
            "description": result["description"],
            "chart_type": result["chart_type"],
            "x_axis": result.get("x_axis", columns[0] if columns else ""),
            "y_axis": result.get("y_axis", columns[1] if len(columns) > 1 else ""),
            "preview": preview,
            "columns": columns,
        }

    except Exception as e:
        return {"error": str(e)}

@app.post("/analytics/saved")
def save_analysis(data: SaveAnalytics):
    import uuid
    analysis_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO saved_analytics (id, company_id, title, sql_query, chart_type, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (analysis_id, data.company_id, data.title, data.sql_query, data.chart_type, data.description))
    return {"id": analysis_id, "message": "Analysis saved"}


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
            model=AI_MODEL,
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
            model=AI_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(response.content[0].text.strip())
        return result

    except Exception as e:
        return {"is_filter_change": False, "filters": None, "message": ""}
    
class PlatformCommandRequest(BaseModel):
    message: str
    company_id: str
    current_prefs: dict = {}
    current_modules: list = []

@app.post("/ai/command")
def interpret_command(request: PlatformCommandRequest):
    try:
        prompt = f"""You are an AI that controls a business operations platform.
        
The user said: "{request.message}"

Current display preferences: {request.current_prefs}
Current enabled modules: {request.current_modules}

Classify this as one of these command types and return ONLY JSON:

1. DISPLAY change (font size, density, layout):
{{
    "type": "display",
    "changes": {{
        "font_size": "small|normal|large|xlarge or null to keep",
        "density": "compact|normal|comfortable or null to keep",
        "dashboard_columns": 2|3|4 or null to keep
    }},
    "message": "confirmation message"
}}

2. MODULE toggle:
{{
    "type": "module",
    "module_id": "dashboard|search|log_issue|workflow|analytics|predictive|repair|settings",
    "enabled": true|false,
    "message": "confirmation message"
}}

3. FILTER default change:
{{
    "type": "filter",
    "default_severity_filter": "all|critical|high|medium|low",
    "message": "confirmation message"
}}

4. NOT a platform command (just a question or data request):
{{
    "type": "none",
    "message": ""
}}

Examples:
- "make the font bigger" -> display, font_size: "large"
- "use compact layout" -> display, density: "compact"  
- "show 4 columns on dashboard" -> display, dashboard_columns: 4
- "hide the predictive risk tab" -> module, predictive, enabled: false
- "only show critical by default" -> filter, critical
- "what are my top defects" -> none

Return ONLY the JSON."""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}]
        )

        result = json.loads(response.content[0].text.strip())
        return result

    except Exception as e:
        return {"type": "none", "message": ""}


# ── Insight layer (per-card AI annotations + click-any-card) ────
def _company_identity(company_id: str):
    info = db.query(
        "SELECT name, industry FROM companies WHERE company_id = ?",
        (company_id,)
    )
    if info.empty:
        return "the company", "operations"
    return info.iloc[0]["name"], (info.iloc[0]["industry"] or "operations")

def _strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # drop opening fence (``` or ```json) and trailing fence
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()

class CardInsightItem(BaseModel):
    key: str
    label: str
    type: Optional[str] = None
    data: Any = None

class DashboardInsightsRequest(BaseModel):
    cards: List[CardInsightItem]

@app.post("/dashboard/insights/{company_id}")
def dashboard_insights(company_id: str, req: DashboardInsightsRequest):
    """One Claude call → a one-sentence insight per dashboard card."""
    try:
        name, industry = _company_identity(company_id)
        cards = [
            {"key": c.key, "label": c.label, "type": c.type, "data": c.data}
            for c in req.cards
        ]
        cards_json = json.dumps(cards, default=str)
        prompt = f"""You are the intelligence layer of Viro, an operations platform for {name} ({industry}).

For each dashboard card below, write ONE sentence (max 18 words) naming the single most important thing the live numbers reveal — a decision, risk, or opportunity, never a description of what the card shows. Use the actual numbers. If a card has no data, write a short note saying so.

Cards (JSON):
{cards_json}

Return ONLY a JSON object mapping each card's "key" to its sentence. No other text."""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=700,
            messages=[{"role": "user", "content": prompt}],
        )
        text = _strip_json_fences(response.content[0].text)
        return {"insights": json.loads(text)}
    except Exception as e:
        return {"insights": {}, "error": str(e)}

class CardActionRequest(BaseModel):
    company_id: str
    action: str            # "explain" | "alert"
    label: str
    summary: Any = None
    question: Optional[str] = None

@app.post("/ai/card-action")
def card_action(req: CardActionRequest):
    """Click-any-card control plane: explain a card in context, or set an alert."""
    try:
        name, industry = _company_identity(req.company_id)

        if req.action == "alert":
            import uuid
            db.execute("""
                INSERT INTO notifications
                (notification_id, company_id, title, message, severity)
                VALUES (?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), req.company_id, "🔔 Alert set",
                  f"You'll be notified when '{req.label}' changes significantly.", "low"))
            return {"answer": f"Done — I'll alert you when {req.label} changes significantly."}

        summary_json = json.dumps(req.summary, default=str)
        ask = req.question or "Explain what this means and what to do about it."
        prompt = f"""You are the intelligence layer of Viro for {name} ({industry}).
A manager clicked on the dashboard card "{req.label}".

Card data (JSON):
{summary_json}

{ask}

Answer in 2-3 punchy sentences using the actual numbers. Be specific and actionable. No preamble."""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = "".join(b.text for b in response.content if hasattr(b, "text"))
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}

class PageInsightRequest(BaseModel):
    company_id: str
    page: str
    summary: Any = None

@app.post("/ai/page-insight")
def page_insight(req: PageInsightRequest):
    """One sentence answering the single most important question a page should answer."""
    try:
        name, industry = _company_identity(req.company_id)
        prompt = f"""You are the intelligence layer of Viro for {name} ({industry}).
A manager just opened the "{req.page}" screen. Its live data (JSON):
{json.dumps(req.summary, default=str)}

Write ONE sentence (max ~22 words) that answers the single most important question this screen should answer right now — the decision, risk, or action it points to — using the actual numbers. If the data looks healthy, say so confidently. No preamble, no "based on the data". Just the answer."""
        response = client.messages.create(
            model=AI_MODEL, max_tokens=160,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = "".join(b.text for b in response.content if hasattr(b, "text")).strip()
        return {"insight": answer}
    except Exception as e:
        return {"insight": "", "error": str(e)}


# ── Role automations (draft the documents teams write by hand) ──
DOC_SPECS = {
    "weekly_quality_report": ("Weekly Quality Report",
        "Write this week's quality report: a one-line headline on overall health, then 4-5 scannable bullet findings (first-pass-yield trend, top issue types with counts, the worst station, critical/open counts), then 2 concrete recommended actions. Professional and concise — ready to send to leadership."),
    "supplier_email": ("Supplier Escalation Email",
        "Draft a professional email to the supplier responsible for the most frequent or most critical recurring issue type in the data. Include a subject line. Reference the specific issue type and its counts, state the impact, and request corrective action by a reasonable date. Firm but courteous."),
    "shift_handover": ("Shift Handover Note",
        "Write an end-of-shift handover note for the incoming shift: what's blocked or critical right now, which stations/stages need attention, and the top 2-3 things the next shift should prioritize. Crisp and scannable."),
    "exec_summary": ("Executive Summary",
        "Write a 4-sentence executive summary of operations health this week for leadership — the single most important thing, the trend, the biggest risk, and the recommended focus. No preamble."),
}

class AutomationRequest(BaseModel):
    company_id: str
    type: str

@app.post("/automations/generate")
def generate_automation(req: AutomationRequest):
    """Draft a real operational document from the company's live data."""
    try:
        name, industry = _company_identity(req.company_id)
        spec = DOC_SPECS.get(req.type)
        if not spec:
            return {"error": "Unknown automation type"}
        title, instruction = spec

        context = {
            "summary": get_analytics_summary(req.company_id),
            "top_issues": get_top_defects(req.company_id),
            "stage_performance": get_stage_performance(req.company_id),
        }
        prompt = f"""You are an operations assistant at {name}, a {industry} company. Draft the following document using ONLY the live data provided — invent no numbers.

DOCUMENT: {title}
{instruction}

LIVE DATA (JSON):
{json.dumps(context, default=str)}

Return only the finished document text (include a subject line if it's an email). No commentary, no markdown code fences."""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        body = "".join(b.text for b in response.content if hasattr(b, "text")).strip()
        return {"title": title, "body": body}
    except Exception as e:
        return {"error": str(e)}


# ── Live dashboard reshape (AI panel as control plane) ──────────
RESHAPE_SOURCES_DOC = """AVAILABLE DATA SOURCES — use these exact endpoint paths as the values in "sources" ({cid} is a literal placeholder):
- "/analytics/summary/{cid}" -> object: total_defects, resolved, unresolved, critical, avg_resolution_hours, first_pass_yield, total_products
- "/defects/by-stage/{cid}" -> list: stage_number, total_defects, critical
- "/analytics/top-defects/{cid}" -> list: defect_type, count, critical_count, high_count, open_count
- "/production/line/{cid}" -> list: product_id, current_stage, status, total_defects, open_defects, critical_open, high_open
- "/analytics/stage-performance/{cid}" -> list: stage_number, stage_name, total_defects, critical, high, open_defects, avg_resolution_hours
- "/analytics/resolution-trend/{cid}" -> list: date, logged, resolved"""

RESHAPE_BLOCKS_DOC = """BLOCK TYPES:
- kpi: {"type":"kpi","source":<key>,"field":<a field on a summary-style object source>,"label":str,"suffix":""|"%"|"h","sub":str,"accent":bool,"danger":bool}
- pipeline: {"type":"pipeline","source":<key to a list source>,"label":str,"stage_field":"current_stage","unit":"vehicles","stages":[{"number":int,"name":str}]}
- ranked_bars: {"type":"ranked_bars","source":<key to a list source>,"label":str,"name":<field used as the row label>,"value":<numeric field>,"limit":int}
- table: {"type":"table","source":<key to a list source>,"label":str,"limit":int,"columns":[{"field":<field>,"label":str,"type":"severity"(optional),"mono":true(optional)}]}
- query: {"type":"query","label":str,"chart":"bar"|"line"|"pie"|"table"|"kpi","sql":<a PostgreSQL SELECT>,"x":<column for category/x-axis/label>,"y":<numeric column for value>,"suffix":""|"%"|"h"(optional)}
  USE "query" FOR ANY QUESTION THE FIXED SOURCES ABOVE CANNOT ANSWER (e.g. "defects by day of week", "pie of defect types", "criticals over time"). It carries its own SQL — no "source" needed. The result columns must suit the chart: pie/bar need a label column (x) + a numeric column (y); line needs an ordered x (usually a date) + a numeric y; kpi needs one numeric y; table shows every column."""

RESHAPE_SCHEMA_DOC = """DATABASE SCHEMA (for "query" blocks; dialect = PostgreSQL):
- products(product_id, company_id, entry_date, current_stage, status)
- defects(defect_id, company_id, product_id, stage_number, defect_type, severity, notes, logged_at, resolved)   -- severity in (low, medium, high, critical); resolved in (0, 1)
- stages(stage_id, company_id, stage_number, stage_name, expected_duration_mins)
SQL RULES for "query" blocks: SELECT only; ALWAYS include WHERE company_id = '{cid}'; give every column a clear alias; LIMIT 20; for dates use DATE(logged_at::timestamp) and ranges like NOW() - INTERVAL '30 days'."""

class ReshapeRequest(BaseModel):
    company_id: str
    instruction: str
    current_config: dict

@app.post("/ai/reshape-dashboard")
def reshape_dashboard(req: ReshapeRequest):
    """Turn a natural-language instruction into a new dashboard config, live."""
    try:
        name, industry = _company_identity(req.company_id)
        prompt = f"""You control a live, config-driven operations dashboard for {name} ({industry}). The entire dashboard is defined by a JSON config. A manager said: "{req.instruction}".

Decide whether this is a request to CHANGE THE DASHBOARD (refocus it, add/remove/replace cards, reorder, filter the view, change what metric is shown) or just a QUESTION to answer in chat.

CURRENT CONFIG:
{json.dumps(req.current_config)}

{RESHAPE_SOURCES_DOC}

{RESHAPE_BLOCKS_DOC}

{RESHAPE_SCHEMA_DOC.replace("{cid}", req.company_id)}

RULES:
- "sources" is an object mapping short keys (e.g. "summary","line") to endpoint paths from the list above. Every kpi/pipeline/ranked_bars/table block's "source" MUST be a key you defined in "sources". "query" blocks do NOT use "source".
- For anything the fixed sources can't express (specific groupings, time series, pie breakdowns, ad-hoc filters), use a "query" block with its own SQL — prefer this over forcing a fixed source.
- Keep the existing "title" and "subtitle_template".
- "sections" is a list of objects like {{"cols":"repeat(4, 1fr)" or "1.5fr 1fr","blocks":[...]}}.
- Make it genuinely answer the manager's intent and look great.

Return ONLY this JSON, nothing else:
{{"is_reshape": true|false, "config": <the FULL new config object, or null if just a question>, "message": "<one sentence describing what changed>"}}"""

        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=2200,
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(_strip_json_fences(response.content[0].text))
        cfg = result.get("config")
        if result.get("is_reshape") and isinstance(cfg, dict) and isinstance(cfg.get("sections"), list):
            cfg.setdefault("sources", {})
            return {"is_reshape": True, "config": cfg, "message": result.get("message", "Dashboard updated.")}
        return {"is_reshape": False, "config": None, "message": ""}
    except Exception as e:
        return {"is_reshape": False, "config": None, "message": "", "error": str(e)}


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
        GROUP BY p.product_id, p.current_stage, p.status, p.entry_date
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

db.execute("""
    CREATE TABLE IF NOT EXISTS custom_fields (
        field_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        field_label TEXT NOT NULL,
        field_type TEXT DEFAULT 'text',
        required INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS defect_custom_values (
        defect_id TEXT NOT NULL,
        field_id TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (defect_id, field_id)
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT,
        product_id TEXT,
        defect_id TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS saved_analytics (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        title TEXT NOT NULL,
        sql_query TEXT NOT NULL,
        chart_type TEXT DEFAULT 'bar',
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS display_preferences (
        company_id TEXT PRIMARY KEY,
        font_size TEXT DEFAULT 'normal',
        density TEXT DEFAULT 'normal',
        dashboard_columns INTEGER DEFAULT 3,
        default_severity_filter TEXT DEFAULT 'all',
        sidebar_collapsed INTEGER DEFAULT 0,
        custom_prefs TEXT DEFAULT '{}'
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS company_config (
        company_id TEXT,
        config_key TEXT,
        config_value TEXT,
        PRIMARY KEY (company_id, config_key)
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS dashboard_config (
        company_id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS dashboard_views (
        view_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

# ── Generative data model: each company defines its OWN entities + records ──
db.execute("""
    CREATE TABLE IF NOT EXISTS entities (
        entity_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        name_plural TEXT,
        icon TEXT,
        fields TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

db.execute("""
    CREATE TABLE IF NOT EXISTS records (
        record_id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
""")

@app.get("/dashboard-config/{company_id}")
def get_dashboard_config(company_id: str):
    result = db.query(
        "SELECT config FROM dashboard_config WHERE company_id = ?",
        (company_id,)
    )
    if result.empty:
        return {"config": None}
    return {"config": json.loads(result.iloc[0]["config"])}

class DashboardConfig(BaseModel):
    config: dict

@app.post("/dashboard-config/{company_id}")
def save_dashboard_config(company_id: str, body: DashboardConfig):
    existing = db.query(
        "SELECT company_id FROM dashboard_config WHERE company_id = ?",
        (company_id,)
    )
    config_str = json.dumps(body.config)
    if existing.empty:
        db.execute(
            "INSERT INTO dashboard_config (company_id, config) VALUES (?, ?)",
            (company_id, config_str)
        )
    else:
        db.execute(
            "UPDATE dashboard_config SET config = ?, updated_at = ? WHERE company_id = ?",
            (config_str, datetime.now().isoformat(), company_id)
        )
    return {"message": "Dashboard config saved"}


# ── Saved dashboard views (named, AI-built dashboards) ──────────
class DashboardViewCreate(BaseModel):
    name: str
    config: dict
    make_default: Optional[bool] = False

@app.get("/dashboard-views/{company_id}")
def list_dashboard_views(company_id: str):
    rows = db.query(
        "SELECT view_id, name, config, is_default FROM dashboard_views WHERE company_id = ? ORDER BY created_at",
        (company_id,)
    )
    out = []
    for _, r in rows.iterrows():
        out.append({
            "view_id": r["view_id"],
            "name": r["name"],
            "is_default": int(r["is_default"] or 0),
            "config": json.loads(r["config"]),
        })
    return out

@app.post("/dashboard-views/{company_id}")
def save_dashboard_view(company_id: str, body: DashboardViewCreate):
    import uuid
    config_str = json.dumps(body.config)
    existing = db.query(
        "SELECT view_id FROM dashboard_views WHERE company_id = ? AND name = ?",
        (company_id, body.name)
    )
    if existing.empty:
        view_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO dashboard_views (view_id, company_id, name, config, is_default) VALUES (?, ?, ?, ?, ?)",
            (view_id, company_id, body.name, config_str, 1 if body.make_default else 0)
        )
    else:
        view_id = existing.iloc[0]["view_id"]
        db.execute("UPDATE dashboard_views SET config = ? WHERE view_id = ?", (config_str, view_id))
    if body.make_default:
        db.execute("UPDATE dashboard_views SET is_default = 0 WHERE company_id = ?", (company_id,))
        db.execute("UPDATE dashboard_views SET is_default = 1 WHERE view_id = ?", (view_id,))
    return {"view_id": view_id, "message": "View saved"}

@app.delete("/dashboard-views/{view_id}")
def delete_dashboard_view(view_id: str):
    db.execute("DELETE FROM dashboard_views WHERE view_id = ?", (view_id,))
    return {"message": "View deleted"}

@app.put("/dashboard-views/{company_id}/default/{view_id}")
def set_default_dashboard_view(company_id: str, view_id: str):
    db.execute("UPDATE dashboard_views SET is_default = 0 WHERE company_id = ?", (company_id,))
    db.execute("UPDATE dashboard_views SET is_default = 1 WHERE view_id = ?", (view_id,))
    return {"message": "Default set"}


class DisplayPrefs(BaseModel):
    font_size: Optional[str] = "normal"
    density: Optional[str] = "normal"
    dashboard_columns: Optional[int] = 3
    default_severity_filter: Optional[str] = "all"
    sidebar_collapsed: Optional[int] = 0
    custom_prefs: Optional[str] = "{}"

@app.get("/prefs/{company_id}")
def get_prefs(company_id: str):
    result = db.query(
        "SELECT * FROM display_preferences WHERE company_id = ?",
        (company_id,)
    )
    if result.empty:
        return {
            "font_size": "normal",
            "density": "normal",
            "dashboard_columns": 3,
            "default_severity_filter": "all",
            "sidebar_collapsed": 0,
            "custom_prefs": "{}",
        }
    return result.iloc[0].to_dict()

@app.post("/prefs/{company_id}")
def save_prefs(company_id: str, prefs: DisplayPrefs):
    existing = db.query(
        "SELECT * FROM display_preferences WHERE company_id = ?",
        (company_id,)
    )
    if existing.empty:
        db.execute("""
            INSERT INTO display_preferences
            (company_id, font_size, density, dashboard_columns, default_severity_filter, sidebar_collapsed, custom_prefs)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (company_id, prefs.font_size, prefs.density,
              prefs.dashboard_columns, prefs.default_severity_filter,
              prefs.sidebar_collapsed, prefs.custom_prefs))
    else:
        db.execute("""
            UPDATE display_preferences SET
            font_size = ?, density = ?, dashboard_columns = ?,
            default_severity_filter = ?, sidebar_collapsed = ?, custom_prefs = ?
            WHERE company_id = ?
        """, (prefs.font_size, prefs.density, prefs.dashboard_columns,
              prefs.default_severity_filter, prefs.sidebar_collapsed,
              prefs.custom_prefs, company_id))
    return {"message": "Preferences saved"}


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

class RunQuery(BaseModel):
    sql: str
    company_id: str

@app.post("/analytics/run")
def run_saved_query(data: RunQuery):
    try:
        # Safety check - only allow SELECT
        if not data.sql.strip().upper().startswith("SELECT"):
            raise HTTPException(status_code=400, detail="Only SELECT queries allowed")
        df = db.query(data.sql)
        return {
            "data": df.head(20).to_dict(orient="records"),
            "columns": df.columns.tolist(),
        }
    except Exception as e:
        return {"data": [], "columns": [], "error": str(e)}


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

# ── Notifications ───────────────────────────────────────────────
@app.get("/notifications/{company_id}")
def get_notifications(company_id: str):
    result = db.query("""
        SELECT * FROM notifications 
        WHERE company_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
    """, (company_id,))
    return result.to_dict(orient="records")

@app.put("/notifications/{notification_id}/read")
def mark_read(notification_id: str):
    db.execute(
        "UPDATE notifications SET read = 1 WHERE notification_id = ?",
        (notification_id,)
    )
    return {"message": "Marked as read"}

@app.put("/notifications/{company_id}/read-all")
def mark_all_read(company_id: str):
    db.execute(
        "UPDATE notifications SET read = 1 WHERE company_id = ?",
        (company_id,)
    )
    return {"message": "All marked as read"}

# ── Custom Fields ───────────────────────────────────────────────
class CustomFieldCreate(BaseModel):
    company_id: str
    field_name: str
    field_label: str
    field_type: str = "text"
    required: int = 0

class CustomFieldValue(BaseModel):
    defect_id: str
    values: dict

@app.get("/custom-fields/{company_id}")
def get_custom_fields(company_id: str):
    result = db.query(
        "SELECT * FROM custom_fields WHERE company_id = ? ORDER BY sort_order",
        (company_id,)
    )
    return result.to_dict(orient="records")

@app.post("/custom-fields")
def create_custom_field(field: CustomFieldCreate):
    import uuid
    field_id = str(uuid.uuid4())
    db.execute("""
        INSERT INTO custom_fields
        (field_id, company_id, field_name, field_label, field_type, required)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (field_id, field.company_id, field.field_name,
          field.field_label, field.field_type, field.required))
    return {"field_id": field_id, "message": "Field created"}

@app.delete("/custom-fields/{field_id}")
def delete_custom_field(field_id: str):
    db.execute("DELETE FROM custom_fields WHERE field_id = ?", (field_id,))
    return {"message": "Field deleted"}

@app.post("/custom-fields/values")
def save_custom_values(data: CustomFieldValue):
    for field_id, value in data.values.items():
        existing = db.query(
            "SELECT * FROM defect_custom_values WHERE defect_id = ? AND field_id = ?",
            (data.defect_id, field_id)
        )
        if existing.empty:
            db.execute(
                "INSERT INTO defect_custom_values (defect_id, field_id, value) VALUES (?, ?, ?)",
                (data.defect_id, field_id, str(value))
            )
        else:
            db.execute(
                "UPDATE defect_custom_values SET value = ? WHERE defect_id = ? AND field_id = ?",
                (str(value), data.defect_id, field_id)
            )
    return {"message": "Values saved"}

@app.get("/custom-fields/values/{defect_id}")
def get_custom_values(defect_id: str):
    result = db.query(
        "SELECT * FROM defect_custom_values WHERE defect_id = ?",
        (defect_id,)
    )
    return result.to_dict(orient="records")

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

class OnboardingConverseRequest(BaseModel):
    messages: List[dict] = []
    state: dict = {}

ONBOARDING_SYSTEM = """You are Viro's onboarding guide. Viro is an AI operations platform that builds a company a custom dashboard + role automations from a short, natural conversation.

Have a warm, BRIEF conversation — ONE short question at a time — to learn how the user's operation runs, and continuously extract structured config. Understand messy input the way a sharp human would: typos, fragments, lowercase, shorthand, "idk", changing their mind. Never make them repeat themselves or fill a form. Keep it to ~5-6 exchanges, then finish.

Learn (skip what you already know; infer when you reasonably can):
1. What the company does / industry (and its name if mentioned)
2. The ONE thing that moves through their workflow — their "universal id" (e.g. Vehicle/VIN, RFQ, Batch, Shipment, Order)
3. The stages it passes through
4. The decisions/metrics that matter most each day
5. The manual paperwork that eats their time (to automate)

After EACH user message, return ONLY this JSON (no prose, no code fence):
{
  "reply": "<your next message — warm, concise, ONE question; or a confirmation once you're done>",
  "state": {
    "company_name": string|null,
    "industry": string|null,
    "universal_id": string|null,
    "terminology": {"term_product": string, "term_defect": string, "term_stage": string, "term_issue": string},
    "stages": [{"stage_number": integer ascending (100,200,300...), "stage_name": string}],
    "defect_types": [{"name": string, "default_severity": "low"|"medium"|"high"|"critical"}],
    "decisions": [string],
    "automations": [string],
    "modules": [subset of "dashboard","search","log_issue","workflow","analytics","predictive","repair","settings"],
    "entities": [
      {
        "name": "singular noun (e.g. Order)",
        "name_plural": "plural (e.g. Orders)",
        "icon": "one emoji",
        "fields": [
          {"key": "snake_case", "label": "Human Label", "type": "text|textarea|number|currency|date|select|boolean", "options": ["only for select"]}
        ]
      }
    ]
  },
  "options": [up to 4 short tappable quick-replies, or []],
  "ready": boolean
}

Rules:
- Carry forward EVERYTHING already in the provided state; only add or refine — never blank a field you already learned.
- **`entities` is the most important field.** Model the 2-6 things this business ACTUALLY tracks, each with 3-7 fields. Build the data model their operation truly needs — not a generic template. Examples: a café → Orders {item, qty, customer, status:select, total:currency}, Ingredients {name, on_hand:number, reorder_at:number, unit, supplier}, Suppliers {name, contact, lead_time_days:number}. A clinic → Patients, Appointments, Prescriptions. Use a `select` field with options for any status/stage; use `number` + a reorder `number` for anything inventory/supply-like; use `currency` for money. Pick a fitting emoji icon per entity.
- Always include "dashboard","search","log_issue","settings" in modules; add others when relevant.
- Infer sensible stages, terminology, and 4-6 defect_types from context even when the user is brief.
- "options" are tappable shortcuts (suggested industries, "Yes, those stages", "Add a QC step", etc.) — 1-4 words each.
- Set "ready": true once you have at least an industry, a universal_id, and 2+ stages, and the user has nothing major to add. When ready, the reply should warmly confirm you have what you need.
Return ONLY the JSON object."""

@app.post("/onboarding/converse")
def onboarding_converse(req: OnboardingConverseRequest):
    """Claude-driven onboarding: understands free-form input, extracts config live."""
    try:
        msgs = [{"role": m["role"], "content": m["content"]}
                for m in req.messages if m.get("role") in ("user", "assistant")]
        while msgs and msgs[0]["role"] != "user":
            msgs.pop(0)  # Anthropic API requires the first message to be from the user
        if not msgs:
            msgs = [{"role": "user", "content": "(let's begin)"}]

        system = ONBOARDING_SYSTEM + f"\n\nCURRENT EXTRACTED STATE (carry forward, refine — do not blank fields):\n{json.dumps(req.state)}"
        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=1000,
            system=system,
            messages=msgs,
        )
        data = json.loads(_strip_json_fences(response.content[0].text))
        return data
    except Exception as e:
        return {"reply": "Sorry — I glitched for a second. Could you say that another way?",
                "state": req.state, "options": [], "ready": False, "error": str(e)}

# ── Entities + Records (generative data model) ─────────────────
class EntityCreate(BaseModel):
    name: str
    name_plural: Optional[str] = None
    icon: Optional[str] = "▦"
    fields: list = []
    sort_order: Optional[int] = 0

class EntityBulk(BaseModel):
    entities: list

class RecordCreate(BaseModel):
    data: dict

def _entity_row(r):
    return {
        "entity_id": r["entity_id"], "name": r["name"],
        "name_plural": r["name_plural"] or (r["name"] + "s"),
        "icon": r["icon"] or "▦",
        "fields": json.loads(r["fields"]) if r["fields"] else [],
        "sort_order": int(r["sort_order"] or 0),
    }

@app.get("/entities/{company_id}")
def list_entities(company_id: str):
    rows = db.query("SELECT * FROM entities WHERE company_id = ? ORDER BY sort_order, created_at", (company_id,))
    return [_entity_row(r) for _, r in rows.iterrows()]

@app.post("/entities/{company_id}")
def create_entity(company_id: str, e: EntityCreate):
    import uuid
    entity_id = str(uuid.uuid4())[:12]
    db.execute(
        "INSERT INTO entities (entity_id, company_id, name, name_plural, icon, fields, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (entity_id, company_id, e.name, e.name_plural or (e.name + "s"), e.icon or "▦", json.dumps(e.fields), e.sort_order or 0)
    )
    return {"entity_id": entity_id, "message": "Entity created"}

@app.post("/entities/{company_id}/bulk")
def create_entities_bulk(company_id: str, body: EntityBulk):
    import uuid
    # replace existing set for this company (idempotent onboarding)
    db.execute("DELETE FROM entities WHERE company_id = ?", (company_id,))
    created = []
    for i, e in enumerate(body.entities):
        entity_id = str(uuid.uuid4())[:12]
        db.execute(
            "INSERT INTO entities (entity_id, company_id, name, name_plural, icon, fields, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (entity_id, company_id, e.get("name", "Item"), e.get("name_plural") or (e.get("name", "Item") + "s"),
             e.get("icon", "▦"), json.dumps(e.get("fields", [])), e.get("sort_order", i))
        )
        created.append(entity_id)
    return {"created": created}

@app.put("/entities/{entity_id}")
def update_entity(entity_id: str, e: EntityCreate):
    db.execute(
        "UPDATE entities SET name = ?, name_plural = ?, icon = ?, fields = ?, sort_order = ? WHERE entity_id = ?",
        (e.name, e.name_plural or (e.name + "s"), e.icon or "▦", json.dumps(e.fields), e.sort_order or 0, entity_id)
    )
    return {"message": "Entity updated"}

@app.delete("/entities/{entity_id}")
def delete_entity(entity_id: str):
    db.execute("DELETE FROM records WHERE entity_id = ?", (entity_id,))
    db.execute("DELETE FROM entities WHERE entity_id = ?", (entity_id,))
    return {"message": "Entity deleted"}

@app.get("/records/{company_id}/{entity_id}")
def list_records(company_id: str, entity_id: str):
    rows = db.query(
        "SELECT * FROM records WHERE company_id = ? AND entity_id = ? ORDER BY created_at DESC",
        (company_id, entity_id)
    )
    out = []
    for _, r in rows.iterrows():
        out.append({"record_id": r["record_id"], "created_at": r["created_at"],
                    "updated_at": r["updated_at"], **(json.loads(r["data"]) if r["data"] else {})})
    return out

@app.post("/records/{company_id}/{entity_id}")
def create_record(company_id: str, entity_id: str, body: RecordCreate):
    import uuid
    record_id = str(uuid.uuid4())[:12]
    db.execute(
        "INSERT INTO records (record_id, company_id, entity_id, data) VALUES (?, ?, ?, ?)",
        (record_id, company_id, entity_id, json.dumps(body.data))
    )
    return {"record_id": record_id, "message": "Record created"}

@app.put("/records/{record_id}")
def update_record(record_id: str, body: RecordCreate):
    db.execute(
        "UPDATE records SET data = ?, updated_at = ? WHERE record_id = ?",
        (json.dumps(body.data), datetime.now().isoformat(), record_id)
    )
    return {"message": "Record updated"}

@app.delete("/records/{record_id}")
def delete_record(record_id: str):
    db.execute("DELETE FROM records WHERE record_id = ?", (record_id,))
    return {"message": "Record deleted"}


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

class ProductCreate(BaseModel):
    company_id: str
    product_id: str
    current_stage: int
    status: str = "in_progress"

@app.post("/products")
def create_product(product: ProductCreate):
    existing = db.query(
        "SELECT * FROM products WHERE product_id = ? AND company_id = ?",
        (product.product_id, product.company_id)
    )
    if existing.empty:
        db.execute("""
            INSERT INTO products (product_id, company_id, entry_date, current_stage, status)
            VALUES (?, ?, ?, ?, ?)
        """, (product.product_id, product.company_id, 
              datetime.now().isoformat(), product.current_stage, product.status))
    return {"message": "Product created"}

@app.post("/admin/dedupe-stages/{company_id}")
def dedupe_stages(company_id: str):
    # keep the lowest stage_id per stage_number, delete the rest
    rows = db.query(
        "SELECT stage_id, stage_number FROM stages WHERE company_id = ? ORDER BY stage_number, stage_id",
        (company_id,)
    )
    seen = set()
    deleted = 0
    for _, r in rows.iterrows():
        num = r["stage_number"]
        if num in seen:
            db.execute("DELETE FROM stages WHERE stage_id = ?", (r["stage_id"],))
            deleted += 1
        else:
            seen.add(num)
    return {"deleted": deleted, "kept": len(seen)}
