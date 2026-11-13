"""
db_utils.py
Common database connection and querying utilities for swift payments data.
"""

import os
import duckdb

BASE_DIR = '/home/evanlim/umdac-datathon-2026-swift'
DATA_DIR = os.path.join(BASE_DIR, 'data/processed')
FULL_PARQUET = os.path.join(DATA_DIR, 'swift_payments.parquet')
SAMPLE_PARQUET = os.path.join(DATA_DIR, 'sample_250k.parquet')
ANOMALIES_PARQUET = os.path.join(DATA_DIR, 'anomalies_all.parquet')

def get_connection(memory_limit='2GB', threads=4):
    """Returns an optimized DuckDB in-memory connection."""
    con = duckdb.connect()
    con.execute(f"SET max_memory = '{memory_limit}'")
    con.execute(f"SET threads = {threads}")
    con.execute("SET preserve_insertion_order = false")
    return con

def query(sql, use_sample=False, use_anomalies=False):
    """Executes a SQL query against parquet tables."""
    con = get_connection()
    if use_anomalies:
        table_path = ANOMALIES_PARQUET
    elif use_sample or not os.path.exists(FULL_PARQUET):
        table_path = SAMPLE_PARQUET
    else:
        table_path = FULL_PARQUET
    
    # Replace placeholder 'payments' with actual parquet reader
    formatted_sql = sql.replace('payments', f"read_parquet('{table_path}')")
    return con.execute(formatted_sql).df()
