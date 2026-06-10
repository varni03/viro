import sqlite3
import pandas as pd
import os
import anthropic


DB_PATH = "viro_dev.db"

class ViroDB:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.setup_tables()

    def setup_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS companies (
                company_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                industry TEXT,
                universal_id_field TEXT DEFAULT 'product_id'
            );

            CREATE TABLE IF NOT EXISTS products (
                product_id TEXT NOT NULL,
                company_id TEXT NOT NULL,
                entry_date TEXT,
                current_stage INTEGER,
                status TEXT,
                PRIMARY KEY (product_id, company_id)
            );

            CREATE TABLE IF NOT EXISTS stages (
                stage_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                stage_number INTEGER,
                stage_name TEXT,
                expected_duration_mins INTEGER
            );

            CREATE TABLE IF NOT EXISTS defects (
                defect_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                stage_number INTEGER,
                defect_type TEXT,
                severity TEXT,
                notes TEXT,
                logged_at TEXT,
                resolved INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS inspections (
                inspection_id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                inspection_type TEXT,
                result TEXT,
                notes TEXT,
                inspected_at TEXT
            );
        """)
        self.conn.commit()

    def query(self, sql, params=None):
        if params:
            return pd.read_sql_query(sql, self.conn, params=params)
        return pd.read_sql_query(sql, self.conn)

    def execute(self, sql, params=None):
        if params:
            self.conn.execute(sql, params)
        else:
            self.conn.execute(sql)
        self.conn.commit()

    def get_products(self, company_id):
        return self.query("""
            SELECT 
                p.product_id,
                p.current_stage,
                p.status,
                p.entry_date,
                COUNT(d.defect_id) as total_defects
            FROM products p
            LEFT JOIN defects d ON p.product_id = d.product_id 
                AND d.company_id = p.company_id
            WHERE p.company_id = ?
            GROUP BY p.product_id
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
            SELECT 
                stage_number,
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
        """Return database schema as string for AI context"""
        return """
        Database Schema:
        
        companies (company_id, name, industry, universal_id_field)
        
        products (product_id, company_id, entry_date, current_stage, status)
        - status values: in_progress, completed, on_hold, flagged
        
        stages (stage_id, company_id, stage_number, stage_name, expected_duration_mins)
        
        defects (defect_id, company_id, product_id, stage_number, 
                    defect_type, severity, notes, logged_at, resolved)
        - severity values: low, medium, high, critical
        - resolved values: 0 (unresolved), 1 (resolved)
        
        inspections (inspection_id, company_id, product_id, inspection_type,
                        result, notes, inspected_at)
        - result values: pass, fail
        """

    def natural_language_query(self, question, company_id):
        """Convert natural language to SQL and execute it"""
        schema = self.get_schema()
        
        client = anthropic.Anthropic()
        
        prompt = f"""
        Convert this question to a SQLite SQL query.
        Return ONLY the SQL query, nothing else, no backticks, no explanation.
        
        Schema:
        {schema}
        
        Important rules:
        - Always filter by company_id = '{company_id}'
        - Only use SELECT statements, never INSERT, UPDATE, DELETE
        - Use SQLite syntax
        - Keep queries simple and efficient
        
        Question: {question}
        """
        
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        sql = response.content[0].text.strip()
        
        try:
            result = self.query(sql)
            return result, sql
        except Exception as e:
            return None, f"Query error: {str(e)}"

    def get_at_risk_products(self, company_id):
        """Flag products likely to have issues based on defect patterns"""
        return self.query("""
            SELECT 
                p.product_id,
                p.current_stage,
                p.status,
                COUNT(d.defect_id) as total_defects,
                SUM(CASE WHEN d.severity = 'critical' THEN 3
                            WHEN d.severity = 'high' THEN 2
                            WHEN d.severity = 'medium' THEN 1
                            ELSE 0 END) as risk_score,
                SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as unresolved_defects,
                GROUP_CONCAT(DISTINCT d.defect_type) as defect_types
            FROM products p
            LEFT JOIN defects d ON p.product_id = d.product_id
                AND d.company_id = p.company_id
            WHERE p.company_id = ?
            AND p.status != 'completed'
            GROUP BY p.product_id
            HAVING risk_score >= 3
            ORDER BY risk_score DESC
        """, (company_id,))

    def get_stage_health(self, company_id):
        """Get health score for each stage"""
        return self.query("""
            SELECT
                s.stage_number,
                s.stage_name,
                COUNT(d.defect_id) as total_defects,
                SUM(CASE WHEN d.severity IN ('high', 'critical') THEN 1 ELSE 0 END) as serious_defects,
                SUM(CASE WHEN d.resolved = 0 THEN 1 ELSE 0 END) as unresolved,
                ROUND(
                    100 - (
                        CAST(SUM(CASE WHEN d.severity IN ('high', 'critical') THEN 1 ELSE 0 END) AS FLOAT)
                        / MAX(COUNT(d.defect_id), 1) * 100
                    ), 1
                ) as health_score
            FROM stages s
            LEFT JOIN defects d ON s.stage_number = d.stage_number
                AND d.company_id = s.company_id
            WHERE s.company_id = ?
            GROUP BY s.stage_number, s.stage_name
            ORDER BY s.stage_number
        """, (company_id,))

    def get_defect_trends(self, company_id):
        """Get defect counts by date for trend analysis"""
        return self.query("""
            SELECT
                DATE(logged_at) as date,
                COUNT(*) as total_defects,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high
            FROM defects
            WHERE company_id = ?
            GROUP BY DATE(logged_at)
            ORDER BY date ASC
        """, (company_id,))
