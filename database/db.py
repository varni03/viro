import sqlite3
import pandas as pd
import os

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
