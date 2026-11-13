"""
reverse_engineer_all_groups.py
Systematically tests hypotheses, fits parametric distributions,
and extracts the ground-truth generating rules across all feature groups.
"""

import duckdb
import numpy as np
import pandas as pd

SAMPLE_PARQUET = '/home/evanlim/umdac-datathon-2026-swift/data/processed/sample_250k.parquet'
ANOMALIES_PARQUET = '/home/evanlim/umdac-datathon-2026-swift/data/processed/anomalies_all.parquet'
OUTPUT_DIR = '/home/evanlim/umdac-datathon-2026-swift/output/tables'

import os
os.makedirs(OUTPUT_DIR, exist_ok=True)

def main():
    con = duckdb.connect()
    con.execute(f"CREATE VIEW sample AS SELECT * FROM read_parquet('{SAMPLE_PARQUET}') WHERE ANOMALY_TYPE IS NULL")
    
    print("=================================================================")
    print("1. FEATURE GROUP 1: AMOUNT DYNAMICS BY ENTITY PAIR & CURRENCY")
    print("=================================================================")
    df_amt = con.execute("""
        SELECT 
            ORDERING_TYPE || ' -> ' || BENEFICIARY_TYPE as entity_pair,
            count(*) as count,
            round(min(USD_AMOUNT), 2) as min_amt,
            round(median(USD_AMOUNT), 2) as med_amt,
            round(avg(USD_AMOUNT), 2) as mean_amt,
            round(stddev(USD_AMOUNT), 2) as std_amt,
            round(avg(ln(USD_AMOUNT)), 4) as log_mean,
            round(stddev(ln(USD_AMOUNT)), 4) as log_std
        FROM sample
        WHERE USD_AMOUNT > 0
        GROUP BY 1
        ORDER BY med_amt DESC
    """).df()
    print(df_amt.to_string(index=False))
    df_amt.to_csv(f"{OUTPUT_DIR}/g1_amount_stats.csv", index=False)
    
    print("\n=================================================================")
    print("2. FEATURE GROUP 2: TEMPORAL PATTERNS & LOCAL SOLAR HOURS")
    print("=================================================================")
    # Extract ordering country from BIC8: characters 5 and 6
    df_time = con.execute("""
        SELECT 
            dayname(to_timestamp(EPOCH_SECONDS)) as day_of_week,
            count(*) as count,
            round(count(*)*100.0 / 250000, 2) as pct
        FROM sample
        GROUP BY 1
        ORDER BY count DESC
    """).df()
    print("Day of week distribution:")
    print(df_time.to_string(index=False))
    
    df_hours = con.execute("""
        SELECT 
            hour(to_timestamp(EPOCH_SECONDS)) as utc_hour,
            count(*) as tx_count
        FROM sample
        GROUP BY 1
        ORDER BY utc_hour
    """).df()
    print("\nUTC hour distribution (sample top 5 / bottom 5):")
    print("Peak hours:", df_hours.sort_values('tx_count', ascending=False).head(3).to_dict(orient='records'))
    print("Trough hours:", df_hours.sort_values('tx_count', ascending=True).head(3).to_dict(orient='records'))
    
    print("\n=================================================================")
    print("3. FEATURE GROUP 3: NETWORK TOPOLOGY & PARTICIPANT HOPS")
    print("=================================================================")
    df_topo = con.execute("""
        SELECT 
            PARTICIPANT_COUNT,
            TRANSACTION_TYPE_CODE,
            CONTINUITY_QFLAG,
            count(*) as count,
            round(count(*)*100.0 / 250000, 2) as pct,
            round(median(TOTAL_DURATION), 1) as med_dur,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM sample
        GROUP BY 1, 2, 3
        ORDER BY PARTICIPANT_COUNT, TRANSACTION_TYPE_CODE, CONTINUITY_QFLAG
    """).df()
    print(df_topo.to_string(index=False))
    df_topo.to_csv(f"{OUTPUT_DIR}/g3_topology_stats.csv", index=False)
    
    print("\n=================================================================")
    print("4. FEATURE GROUP 4: SETTLEMENT DURATION DECOMPOSITION (LATENCY)")
    print("=================================================================")
    df_dur = con.execute("""
        SELECT 
            PARTICIPANT_COUNT,
            CURRENCY_CONVERSION_COUNT,
            count(*) as count,
            round(median(TOTAL_DURATION), 1) as med_dur,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM sample
        WHERE PARTICIPANT_COUNT <= 5 AND CURRENCY_CONVERSION_COUNT <= 3
        GROUP BY 1, 2
        ORDER BY 1, 2
    """).df()
    print(df_dur.to_string(index=False))
    df_dur.to_csv(f"{OUTPUT_DIR}/g4_duration_decomposition.csv", index=False)
    
    print("\n=================================================================")
    print("5. FEATURE GROUP 5: TRANSACTION ROUTING MODALITY (COVERED VS DIRECT)")
    print("=================================================================")
    df_mod = con.execute("""
        SELECT 
            TRANSACTION_TYPE_CODE,
            count(*) as count,
            round(count(*)*100.0 / 250000, 2) as pct,
            round(median(USD_AMOUNT), 2) as med_amt,
            round(avg(USD_AMOUNT), 2) as avg_amt,
            round(avg(PARTICIPANT_COUNT), 2) as avg_participants,
            round(avg(CURRENCY_CONVERSION_COUNT), 2) as avg_fx_hops
        FROM sample
        GROUP BY 1
        ORDER BY count DESC
    """).df()
    print(df_mod.to_string(index=False))
    df_mod.to_csv(f"{OUTPUT_DIR}/g5_modality_stats.csv", index=False)
    
    print("\n=================================================================")
    print("6. FEATURE GROUP 6: CURRENCY CONVERSION (FX) COUNTS")
    print("=================================================================")
    df_fx = con.execute("""
        SELECT 
            CURRENCY_CONVERSION_COUNT,
            count(*) as count,
            round(count(*)*100.0 / 250000, 2) as pct,
            round(median(TOTAL_DURATION), 1) as med_dur,
            round(avg(TOTAL_DURATION), 1) as avg_dur
        FROM sample
        GROUP BY 1
        ORDER BY CURRENCY_CONVERSION_COUNT
    """).df()
    print(df_fx.to_string(index=False))
    df_fx.to_csv(f"{OUTPUT_DIR}/g6_fx_stats.csv", index=False)
    
    print("\n=================================================================")
    print("7. FEATURE GROUP 7: SYNTHETIC TOKEN TAGS & COUNTRY PATTERNS")
    print("=================================================================")
    df_tokens = con.execute("""
        SELECT 
            ORDERING_TYPE,
            case when ORDERING_TOKENS like '%<iban:%' then 'IBAN' else 'NON_IBAN' end as has_iban,
            case when ORDERING_TOKENS like '%<business:%' then 'HAS_BIZ_TOKEN' else 'NO_BIZ_TOKEN' end as has_biz,
            count(*) as count,
            round(count(*)*100.0 / sum(count(*)) over(partition by ORDERING_TYPE), 2) as pct_within_type
        FROM sample
        GROUP BY 1, 2, 3
        ORDER BY 1, count DESC
    """).df()
    print(df_tokens.to_string(index=False))
    df_tokens.to_csv(f"{OUTPUT_DIR}/g7_token_stats.csv", index=False)
    
    print("\n=== COMPLETED ALL REVERSE-ENGINEERING QUERIES ===")

if __name__ == '__main__':
    main()
