"""
group8_anomaly_signatures.py
Reverse-engineers the exact mathematical and procedural injection rules
for each anomaly typology in the Swift payments dataset.
"""

import duckdb
import pandas as pd
import numpy as np

ANOMALIES_PARQUET = '/home/evanlim/umdac-datathon-2026-swift/data/processed/anomalies_all.parquet'

def main():
    con = duckdb.connect()
    
    print("=== REVERSE-ENGINEERING ANOMALY SIGNATURES ===")
    
    # 1. Anomaly breakdown by Entity Type (Ordering -> Beneficiary)
    print("\n--- 1. Anomaly by Entity Pair Types ---")
    df_pair = con.execute(f"""
        SELECT 
            ANOMALY_TYPE,
            ORDERING_TYPE || ' -> ' || BENEFICIARY_TYPE as entity_pair,
            count(*) as count,
            round(count(*)*100.0 / sum(count(*)) over(partition by ANOMALY_TYPE), 2) as pct_within_anomaly
        FROM read_parquet('{ANOMALIES_PARQUET}')
        GROUP BY 1, 2
        ORDER BY 1, count DESC
    """).df()
    print(df_pair.to_string(index=False))
    
    # 2. Amount and Duration statistics by Anomaly
    print("\n--- 2. Amount & Duration Statistics by Anomaly ---")
    df_stats = con.execute(f"""
        SELECT 
            ANOMALY_TYPE,
            count(*) as n,
            round(min(USD_AMOUNT), 2) as min_amt,
            round(median(USD_AMOUNT), 2) as med_amt,
            round(avg(USD_AMOUNT), 2) as avg_amt,
            round(max(USD_AMOUNT), 2) as max_amt,
            round(stddev(USD_AMOUNT), 2) as std_amt,
            round(median(TOTAL_DURATION), 1) as med_dur,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM read_parquet('{ANOMALIES_PARQUET}')
        GROUP BY 1
        ORDER BY n DESC
    """).df()
    print(df_stats.to_string(index=False))
    
    # 3. Investigating FAT_FINGER_MISTAKE: Amount structure
    print("\n--- 3. Investigating FAT_FINGER_MISTAKE: Amount Mantissas / Multipliers ---")
    df_ff = con.execute(f"""
        SELECT 
            USD_AMOUNT,
            CURRENCY_CODE,
            ORDERING_TYPE,
            BENEFICIARY_TYPE,
            TOTAL_DURATION
        FROM read_parquet('{ANOMALIES_PARQUET}')
        WHERE ANOMALY_TYPE = 'FAT_FINGER_MISTAKE'
        LIMIT 20
    """).df()
    print(df_ff.head(15).to_string(index=False))
    
    # 4. Investigating DUPLICATE_PAYMENT
    print("\n--- 4. Investigating DUPLICATE_PAYMENT: Account and Amount repetition ---")
    df_dup = con.execute(f"""
        SELECT 
            EPOCH_SECONDS,
            USD_AMOUNT,
            CURRENCY_CODE,
            ORDERING_ACCOUNT,
            BENEFICIARY_ACCOUNT,
            BIC8_PATH,
            TOTAL_DURATION
        FROM read_parquet('{ANOMALIES_PARQUET}')
        WHERE ANOMALY_TYPE = 'DUPLICATE_PAYMENT'
        ORDER BY ORDERING_ACCOUNT, EPOCH_SECONDS
        LIMIT 20
    """).df()
    print(df_dup.head(15).to_string(index=False))
    
    # 5. Investigating ROMANCE_SCAM: Repeat accounts / corridors
    print("\n--- 5. Investigating ROMANCE_SCAM: Ordering/Beneficiary Corridors ---")
    df_romance = con.execute(f"""
        SELECT 
            substring(ORDERING_BIC8, 5, 2) as ord_country,
            substring(BENEFICIARY_BIC8, 5, 2) as ben_country,
            CURRENCY_CODE,
            count(*) as cnt,
            round(avg(USD_AMOUNT), 2) as avg_amt
        FROM read_parquet('{ANOMALIES_PARQUET}')
        WHERE ANOMALY_TYPE = 'ROMANCE_SCAM'
        GROUP BY 1, 2, 3
        ORDER BY cnt DESC
        LIMIT 15
    """).df()
    print(df_romance.to_string(index=False))
    
    # 6. Investigating CEO_SCAM
    print("\n--- 6. Investigating CEO_SCAM: Characteristics ---")
    df_ceo = con.execute(f"""
        SELECT 
            substring(ORDERING_BIC8, 5, 2) as ord_country,
            substring(BENEFICIARY_BIC8, 5, 2) as ben_country,
            CURRENCY_CODE,
            count(*) as cnt,
            round(avg(USD_AMOUNT), 2) as avg_amt,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM read_parquet('{ANOMALIES_PARQUET}')
        WHERE ANOMALY_TYPE = 'CEO_SCAM'
        GROUP BY 1, 2, 3
        ORDER BY cnt DESC
        LIMIT 15
    """).df()
    print(df_ceo.to_string(index=False))

if __name__ == '__main__':
    main()
