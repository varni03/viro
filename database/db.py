import os
import pandas as pd
import anthropic

DATABASE_URL = os.getenv("DATABASE_URL")
USE_POSTGRES = bool(DATABASE_URL)

if not USE_POSTGRES:
    import sqlite3
    DB_PATH = "viro_dev.db"


class ViroDB:
    def __init__(self):
        if USE_POSTGRES:
            self.db_url = DATABASE_URL
        else:
            self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
        self.setup_tables()

    def get_engine(self):
        if not hasattr(self, '_engine'):
            from sqlalchemy import create_engine
            # Vercel runs many small instances, each with its own pool;
            # keep each one tiny so they fit Supabase's connection limit.
            serverless = bool(os.getenv("VERCEL"))
            self._engine = create_engine(
                self.db_url,
                pool_size=1 if serverless else 3,
                max_overflow=1 if serverless else 2,
                pool_pre_ping=True,
                pool_recycle=300,
            )
        return self._engine


    def query(self, sql, params=None):
        if USE_POSTGRES:
            from sqlalchemy import create_engine, text
            engine = self.get_engine()
            if params:
                for i in range(len(params)):
                    sql = sql.replace("?", f":p{i}", 1)
                param_dict = {f"p{i}": v for i, v in enumerate(params)}
                with engine.connect() as conn:
                    return pd.read_sql_query(text(sql), conn, params=param_dict)
            else:
                with engine.connect() as conn:
                    return pd.read_sql_query(text(sql), conn)
        else:
            if params:
                return pd.read_sql_query(sql, self.conn, params=params)
            return pd.read_sql_query(sql, self.conn)

    def execute(self, sql, params=None):
        if USE_POSTGRES:
            from sqlalchemy import create_engine, text
            engine = self.get_engine()
            if params:
                for i in range(len(params)):
                    sql = sql.replace("?", f":p{i}", 1)
                param_dict = {f"p{i}": v for i, v in enumerate(params)}
                with engine.connect() as conn:
                    conn.execute(text(sql), param_dict)
                    conn.commit()
            else:
                with engine.connect() as conn:
                    conn.execute(text(sql))
                    conn.commit()
        else:
            if params:
                self.conn.execute(sql, params)
            else:
                self.conn.execute(sql)
            self.conn.commit()

    def setup_tables(self):
        tables = [
            """CREATE TABLE IF NOT EXISTS companies (
                company_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                industry TEXT,
                universal_id_field TEXT DEFAULT 'product_id'
            )""",
            """CREATE TABLE IF NOT EXISTS products (
                product_id TEXT NOT NULL,
                company_id TEXT NOT NULL,
                entry_date TEXT,
                current_stage INTEGER,
                status TEXT,
                PRIMARY KEY (product_id, company_id)
            )""",
            """CREATE TABLE IF NOT EXISTS stages (
                stage_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                stage_number INTEGER,
                stage_name TEXT,
                expected_duration_mins INTEGER
            )""",
            """CREATE TABLE IF NOT EXISTS defects (
                defect_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                stage_number INTEGER,
                defect_type TEXT,
                severity TEXT,
                notes TEXT,
                logged_at TEXT,
                resolved INTEGER DEFAULT 0
            )""",
            """CREATE TABLE IF NOT EXISTS inspections (
                inspection_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                inspection_type TEXT,
                result TEXT,
                notes TEXT,
                inspected_at TEXT
            )""",
            """CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )""",
        ]

        if USE_POSTGRES:
            from sqlalchemy import create_engine, text
            engine = self.get_engine()
            with engine.connect() as conn:
                for stmt in tables:
                    conn.execute(text(stmt))
                conn.commit()
        else:
            script = ";\n".join(tables)
            self.conn.executescript(script)
            self.conn.commit()

    def get_products(self, company_id):
        return self.query("""
            SELECT p.product_id, p.current_stage, p.status, p.entry_date,
                COUNT(d.defect_id) as total_defects
            FROM products p
            LEFT JOIN defects d ON p.product_id = d.product_id
                AND d.company_id = p.company_id
            WHERE p.company_id = ?
            GROUP BY p.product_id, p.current_stage, p.status, p.entry_date
            ORDER BY total_defects DESC
        """, (company_id,))

    def get_defects(self, company_id, product_id=None):
        if product_id:
            return self.query("""
                SELECT * FROM defects
                WHERE company_id = ? AND product_id = ?
                ORDER BY logged_at DESC
            """, (company_id, product_id))
        return self.query("""
            SELECT * FROM defects
            WHERE company_id = ?
            ORDER BY logged_at DESC
        """, (company_id,))

    def get_defects_by_stage(self, company_id):
        return self.query("""
            SELECT stage_number,
                COUNT(*) as total_defects,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
            FROM defects
            WHERE company_id = ?
            GROUP BY stage_number
            ORDER BY stage_number
        """, (company_id,))

    def log_defect(self, company_id, product_id, stage_number,
                   defect_type, severity, notes=None):
        import uuid
        from datetime import datetime
        defect_id = str(uuid.uuid4())
        self.execute("""
            INSERT INTO defects
            (defect_id, company_id, product_id, stage_number,
             defect_type, severity, notes, logged_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (defect_id, company_id, product_id, stage_number,
              defect_type, severity, notes, datetime.now().isoformat()))
        return defect_id

    def get_schema(self):
        return """
        Tables:
        companies (company_id, name, industry, universal_id_field)
        products (product_id, company_id, entry_date, current_stage, status)
        stages (stage_id, company_id, stage_number, stage_name, expected_duration_mins)
        defects (defect_id, company_id, product_id, stage_number,
                    defect_type, severity, notes, logged_at, resolved)
        users (user_id, company_id, email, role, first_name, last_name)
        """

    def natural_language_query(self, question, company_id):
        schema = self.get_schema()
        client = anthropic.Anthropic()
        dialect = "PostgreSQL" if USE_POSTGRES else "SQLite"
        prompt = f"""Convert this to a {dialect} SQL query. Return ONLY the SQL.
        Schema: {schema}
        Rules: Filter by company_id = '{company_id}'. SELECT only.
        Question: {question}"""
        response = client.messages.create(
            model="claude-sonnet-4-6",  # keep in sync with AI_MODEL in main.py (old model retired 2026-06-15)
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        sql = response.content[0].text.strip()
        # Models often wrap SQL in a markdown code fence despite "Return ONLY the SQL".
        # Running that raw fails the query, so strip it.
        if sql.startswith("```"):
            sql = sql.split("```")[1]
            if sql.lower().startswith("sql"):
                sql = sql[3:]
            sql = sql.strip()
        try:
            result = self.query(sql)
            return result, sql
        except Exception as e:
            return None, f"Query error: {str(e)}"

    def get_at_risk_products(self, company_id):
        return self.query("""
            SELECT p.product_id, p.current_stage, p.status,
                COUNT(d.defect_id) as total_defects,
                SUM(CASE WHEN d.severity = 'critical' THEN 3
                         WHEN d.severity = 'high' THEN 2
                         WHEN d.severity = 'medium' THEN 1
                         ELSE 0 END) as risk_score,
                SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as unresolved_defects
            FROM products p
            LEFT JOIN defects d ON p.product_id = d.product_id
                AND d.company_id = p.company_id
            WHERE p.company_id = ?
            AND p.status != 'completed'
            GROUP BY p.product_id, p.current_stage, p.status
            HAVING SUM(CASE WHEN d.severity = 'critical' THEN 3
                            WHEN d.severity = 'high' THEN 2
                            WHEN d.severity = 'medium' THEN 1
                            ELSE 0 END) >= 3
            ORDER BY risk_score DESC
        """, (company_id,))

    def get_stage_health(self, company_id):
        return self.query("""
            SELECT s.stage_number, s.stage_name,
                COUNT(d.defect_id) as total_defects,
                SUM(CASE WHEN d.severity IN ('high', 'critical') THEN 1 ELSE 0 END) as serious_defects,
                SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as unresolved
            FROM stages s
            LEFT JOIN defects d ON s.stage_number = d.stage_number
                AND d.company_id = s.company_id
            WHERE s.company_id = ?
            GROUP BY s.stage_number, s.stage_name
            ORDER BY s.stage_number
        """, (company_id,))

    def get_defect_trends(self, company_id):
        if USE_POSTGRES:
            return self.query("""
                SELECT DATE(logged_at::timestamp) as date,
                    COUNT(*) as total_defects,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
                FROM defects
                WHERE company_id = ?
                GROUP BY DATE(logged_at::timestamp)
                ORDER BY date ASC
            """, (company_id,))
        else:
            return self.query("""
                SELECT DATE(logged_at) as date,
                    COUNT(*) as total_defects,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                    SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
                FROM defects
                WHERE company_id = ?
                GROUP BY DATE(logged_at)
                ORDER BY date ASC
            """, (company_id,))