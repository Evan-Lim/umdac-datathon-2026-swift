"""
interactive_explorer.py
Dynamic inquiry and exploration CLI for the Swift Payments dataset.
Allows users to dynamically query, filter, update metrics, and regenerate visualizations.

Usage:
    python src/dashboards/interactive_explorer.py --interactive
    python src/dashboards/interactive_explorer.py --query "SELECT CURRENCY_CODE, count(*) FROM payments GROUP BY 1"
    python src/dashboards/interactive_explorer.py --feature amount --pair B2B
    python src/dashboards/interactive_explorer.py --feature anomaly --anomaly ROMANCE_SCAM
    python src/dashboards/interactive_explorer.py --render-dashboard
"""

import sys
import os
import argparse
import duckdb
import pandas as pd
import numpy as np

BASE_DIR = '/home/evanlim/umdac-datathon-2026-swift'
DATA_DIR = os.path.join(BASE_DIR, 'data/processed')
SAMPLE_PARQUET = os.path.join(DATA_DIR, 'sample_250k.parquet')
ANOMALIES_PARQUET = os.path.join(DATA_DIR, 'anomalies_all.parquet')
FULL_PARQUET = os.path.join(DATA_DIR, 'swift_payments.parquet')

def get_connection():
    con = duckdb.connect()
    con.execute("SET max_memory = '2GB'")
    con.execute("SET threads = 4")
    # Register views
    con.execute(f"CREATE OR REPLACE VIEW sample AS SELECT * FROM read_parquet('{SAMPLE_PARQUET}')")
    con.execute(f"CREATE OR REPLACE VIEW anomalies AS SELECT * FROM read_parquet('{ANOMALIES_PARQUET}')")
    if os.path.exists(FULL_PARQUET):
        con.execute(f"CREATE OR REPLACE VIEW full_data AS SELECT * FROM read_parquet('{FULL_PARQUET}')")
    return con

def explore_amount(con, pair=None, currency=None):
    print(f"\n--- DYNAMIC ENQUIRY: AMOUNT DYNAMICS (Filter: pair={pair}, currency={currency}) ---")
    where_clauses = ["ANOMALY_TYPE IS NULL", "USD_AMOUNT > 0"]
    if pair:
        p_ord, p_ben = pair[0], pair[-1]
        where_clauses.append(f"ORDERING_TYPE = '{p_ord}' AND BENEFICIARY_TYPE = '{p_ben}'")
    if currency:
        where_clauses.append(f"CURRENCY_CODE = '{currency.upper()}'")
    
    where_str = " AND ".join(where_clauses)
    query = f"""
        SELECT 
            ORDERING_TYPE || ' -> ' || BENEFICIARY_TYPE as entity_pair,
            CURRENCY_CODE,
            count(*) as tx_count,
            round(min(USD_AMOUNT), 2) as min_usd,
            round(median(USD_AMOUNT), 2) as median_usd,
            round(avg(USD_AMOUNT), 2) as mean_usd,
            round(max(USD_AMOUNT), 2) as max_usd,
            round(stddev(USD_AMOUNT), 2) as std_usd,
            round(avg(ln(USD_AMOUNT)), 4) as fitted_log_mean,
            round(stddev(ln(USD_AMOUNT)), 4) as fitted_log_std
        FROM sample
        WHERE {where_str}
        GROUP BY 1, 2
        ORDER BY tx_count DESC
        LIMIT 15
    """
    df = con.execute(query).df()
    print(df.to_string(index=False))
    return df

def explore_anomaly(con, anomaly_type=None):
    print(f"\n--- DYNAMIC ENQUIRY: ANOMALIES (Filter: {anomaly_type or 'ALL'}) ---")
    where_clause = f"WHERE ANOMALY_TYPE = '{anomaly_type}'" if anomaly_type else ""
    query = f"""
        SELECT 
            ANOMALY_TYPE,
            count(*) as count,
            round(count(*)*100.0 / 7006, 2) as pct_of_anomalies,
            round(median(USD_AMOUNT), 2) as med_amt,
            round(avg(USD_AMOUNT), 2) as avg_amt,
            round(max(USD_AMOUNT), 2) as max_amt,
            round(median(TOTAL_DURATION), 1) as med_dur,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM anomalies
        {where_clause}
        GROUP BY 1
        ORDER BY count DESC
    """
    df = con.execute(query).df()
    print(df.to_string(index=False))
    return df

def explore_latency(con, hops=None):
    print(f"\n--- DYNAMIC ENQUIRY: SETTLEMENT LATENCY (Filter: hops={hops or 'ALL'}) ---")
    where_clause = f"WHERE PARTICIPANT_COUNT = {hops}" if hops else "WHERE PARTICIPANT_COUNT <= 6"
    query = f"""
        SELECT 
            PARTICIPANT_COUNT as hops,
            TRANSACTION_TYPE_CODE,
            count(*) as count,
            round(min(TOTAL_DURATION), 1) as min_sec,
            round(median(TOTAL_DURATION), 1) as median_sec,
            round(avg(TOTAL_DURATION), 1) as mean_sec,
            round(quantile_cont(TOTAL_DURATION, 0.95), 1) as p95_sec
        FROM sample
        {where_clause}
        GROUP BY 1, 2
        ORDER BY 1, 2
    """
    df = con.execute(query).df()
    print(df.to_string(index=False))
    return df

def run_custom_query(con, sql):
    print(f"\n--- EXECUTING CUSTOM SQL QUERY ---")
    print(f"SQL: {sql}\n")
    # Support 'payments' as alias for sample
    sql_formatted = sql.replace('payments', 'sample')
    try:
        df = con.execute(sql_formatted).df()
        print(df.to_string(index=False))
        return df
    except Exception as e:
        print(f"Query Error: {e}")

def interactive_loop():
    con = get_connection()
    print("="*70)
    print("   SWIFT PAYMENTS INTERACTIVE DATA EXPLORER & INQUIRY SYSTEM")
    print("="*70)
    print("Commands:")
    print("  amount [pair] [currency]  -> e.g. 'amount B2B USD' or 'amount C2C'")
    print("  anomaly [type]            -> e.g. 'anomaly ROMANCE_SCAM' or 'anomaly'")
    print("  latency [hops]            -> e.g. 'latency 3' or 'latency'")
    print("  render                    -> Regenerates official Dashboard PDF")
    print("  sql <query>               -> Execute custom SQL against dataset")
    print("  exit / quit               -> Quit explorer")
    print("="*70)
    
    while True:
        try:
            line = input("\n[SWIFT-EXPLORER]> ").strip()
            if not line:
                continue
            parts = line.split()
            cmd = parts[0].lower()
            
            if cmd in ('exit', 'quit', 'q'):
                print("Exiting explorer. Goodbye!")
                break
            elif cmd == 'amount':
                pair = parts[1] if len(parts) > 1 else None
                curr = parts[2] if len(parts) > 2 else None
                explore_amount(con, pair=pair, currency=curr)
            elif cmd == 'anomaly':
                anom = parts[1] if len(parts) > 1 else None
                explore_anomaly(con, anomaly_type=anom)
            elif cmd == 'latency':
                h = int(parts[1]) if len(parts) > 1 else None
                explore_latency(con, hops=h)
            elif cmd == 'render':
                os.system(f"python3 {os.path.join(BASE_DIR, 'src/dashboards/generate_dashboard_pdf.py')}")
            elif cmd == 'sql':
                query_str = " ".join(parts[1:])
                run_custom_query(con, query_str)
            else:
                print(f"Unknown command: '{cmd}'. Try 'amount', 'anomaly', 'latency', 'render', or 'sql <query>'.")
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

def main():
    parser = argparse.ArgumentParser(description="Swift Payments Dynamic Data Explorer")
    parser.add_argument('--interactive', action='store_true', help="Start interactive CLI shell")
    parser.add_argument('--query', type=str, help="Execute single SQL query")
    parser.add_argument('--feature', type=str, choices=['amount', 'anomaly', 'latency'], help="Feature group to enquire")
    parser.add_argument('--pair', type=str, help="Entity pair filter (e.g. B2B, C2C)")
    parser.add_argument('--currency', type=str, help="Currency code filter (e.g. USD, EUR)")
    parser.add_argument('--anomaly', type=str, help="Anomaly type filter")
    parser.add_argument('--hops', type=int, help="Hops / Participant count filter")
    parser.add_argument('--render-dashboard', action='store_true', help="Render updated 8-page Dashboard PDF")
    
    args = parser.parse_args()
    con = get_connection()
    
    if args.interactive:
        interactive_loop()
    elif args.render_dashboard:
        os.system(f"python3 {os.path.join(BASE_DIR, 'src/dashboards/generate_dashboard_pdf.py')}")
    elif args.query:
        run_custom_query(con, args.query)
    elif args.feature == 'amount':
        explore_amount(con, pair=args.pair, currency=args.currency)
    elif args.feature == 'anomaly':
        explore_anomaly(con, anomaly_type=args.anomaly)
    elif args.feature == 'latency':
        explore_latency(con, hops=args.hops)
    else:
        # Default: print quick status overview
        explore_amount(con)
        explore_anomaly(con)

if __name__ == '__main__':
    main()
