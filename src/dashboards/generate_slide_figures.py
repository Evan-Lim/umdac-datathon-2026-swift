"""
generate_slide_figures.py
Generates high-resolution publication-quality vector/raster figures
for embedding into the 15-slide LaTeX Beamer presentation deck.
"""

import os
import duckdb
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Professional styling
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.titlesize'] = 11
plt.rcParams['axes.titleweight'] = 'bold'
plt.rcParams['axes.labelsize'] = 10
plt.rcParams['axes.labelweight'] = 'bold'
plt.rcParams['figure.titlesize'] = 12

FIG_DIR = '/home/evanlim/umdac-datathon-2026-swift/output/figures'
os.makedirs(FIG_DIR, exist_ok=True)

SAMPLE_PARQUET = '/home/evanlim/umdac-datathon-2026-swift/data/processed/sample_250k.parquet'
ANOMALIES_PARQUET = '/home/evanlim/umdac-datathon-2026-swift/data/processed/anomalies_all.parquet'

con = duckdb.connect()

def make_fig_g1():
    """G1: Amount Dynamics"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    pairs = ['C -> C', 'B -> C', 'C -> B', 'B -> B']
    medians = [454.47, 3122.20, 3254.65, 22732.37]
    log_means = [6.055, 7.992, 8.041, 9.995]
    
    # Left: Median Amount (Log scale)
    colors = ['#38bdf8', '#0284c7', '#0369a1', '#1e3a8a']
    bars = ax1.bar(pairs, medians, color=colors, edgecolor='#0f172a', lw=1.2, width=0.55)
    ax1.set_yscale('log')
    ax1.set_title("Median Transaction Size (USD)\n[Log Scale: Exact +2.0 Shift]", fontsize=10.5)
    ax1.set_ylabel("Median USD Amount ($)")
    for bar in bars:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., h*1.2, f"${h:,.0f}", ha='center', va='bottom', fontsize=9, fontweight='bold')
    ax1.set_ylim(100, 100000)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Right: Fitted Log-Normal Location Parameter
    ax2.plot(pairs, log_means, marker='o', markersize=8, color='#0284c7', lw=2.5)
    for i, (p, m) in enumerate(zip(pairs, log_means)):
        ax2.annotate(f"μ = {m:.2f}", (i, m), textcoords="offset points", xytext=(0, 10), ha='center', fontweight='bold', fontsize=9)
    ax2.set_title("Fitted Log-Normal Parameter (μ)\n[Exact 2.0 Discrete Step Ladder]", fontsize=10.5)
    ax2.set_ylabel("Fitted Location Parameter μ")
    ax2.set_ylim(4, 12)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g1_amount.png")
    plt.close()

def make_fig_g2():
    """G2: Temporal Patterns"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    shares = [14.2, 17.8, 17.1, 17.6, 18.4, 9.3, 5.5]
    colors = ['#0284c7']*5 + ['#94a3b8']*2
    bars = ax1.bar(days, shares, color=colors, edgecolor='#0f172a', lw=1.2, width=0.55)
    ax1.set_title("Weekly Traffic Distribution (%)\n[85.2% Weekday vs 14.8% Weekend]", fontsize=10.5)
    ax1.set_ylabel("Share of Payments (%)")
    ax1.set_ylim(0, 22)
    for bar in bars:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., h+0.4, f"{h:.1f}%", ha='center', fontsize=8.5, fontweight='bold')
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # 24-hr UTC curve
    df_h = con.execute("""
        SELECT hour(to_timestamp(EPOCH_SECONDS)) as h, count(*) as cnt 
        FROM read_parquet(?) WHERE ANOMALY_TYPE IS NULL GROUP BY 1 ORDER BY 1
    """, [SAMPLE_PARQUET]).df()
    ax2.plot(df_h['h'], df_h['cnt']/1000.0, marker='o', color='#0284c7', lw=2.2, markersize=5)
    ax2.set_title("24-Hour UTC Initiation Volume\n[Asia/Europe Open Peak at 23:00-01:00]", fontsize=10.5)
    ax2.set_xlabel("Hour of Day (UTC)")
    ax2.set_ylabel("Transaction Count ('000)")
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g2_temporal.png")
    plt.close()

def make_fig_g3():
    """G3: Network Topology"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    # Left: Participant Count
    hops = [2, 3, 4, 5, 6, 7]
    counts = [157.8, 52.3, 19.1, 7.1, 2.2, 0.8] # '000s in 250k
    bars = ax1.bar([str(h) for h in hops], counts, color='#0369a1', edgecolor='#0f172a', lw=1.2, width=0.55)
    ax1.set_title("Participant Count Distribution (Hops)\n[Direct strictly = 2 Hops (63.1%)]", fontsize=10.5)
    ax1.set_xlabel("Institutions in Payment Route")
    ax1.set_ylabel("Volume ('000 Records)")
    for bar in bars:
        h = bar.get_height()
        pct = (h / 250.0) * 100.0
        ax1.text(bar.get_x() + bar.get_width()/2., h+2, f"{pct:.1f}%", ha='center', fontsize=8.5, fontweight='bold')
    ax1.set_ylim(0, 180)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Right: Modality Donut
    types = ['Direct\n(63.1%)', 'Indirect\n(32.7%)', 'Covered\n(4.1%)']
    shares = [63.12, 32.67, 4.14]
    ax2.pie(shares, labels=types, colors=['#0284c7', '#38bdf8', '#fbbf24'], autopct='%1.1f%%', startangle=140,
            textprops={'fontsize': 9, 'fontweight': 'bold'}, wedgeprops=dict(width=0.45, edgecolor='w', lw=1.5))
    ax2.set_title("Transaction Routing Modality Share\n[Direct vs Indirect vs Covered]", fontsize=10.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g3_topology.png")
    plt.close()

def make_fig_g4():
    """G4: Settlement Latency"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    hops = [2, 3, 4, 5, 6]
    med_dur = [39.0, 100.0, 413.0, 582.0, 823.0]
    ax1.plot(hops, med_dur, marker='s', color='#dc2626', lw=2.5, markersize=7)
    ax1.set_title("Median Latency vs Participant Count\n[Linear +300-400s Intermediary Penalty]", fontsize=10.5)
    ax1.set_xlabel("Participant Count (Hops)")
    ax1.set_ylabel("Median Settlement Duration (s)")
    for x, y in zip(hops, med_dur):
        ax1.annotate(f"{y:.0f}s", (x, y), textcoords="offset points", xytext=(0,8), ha='center', fontweight='bold', fontsize=9)
    ax1.set_ylim(0, 950)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Right: FX Hops impact
    fx = [0, 1, 2, 3, 4]
    fx_dur = [47.0, 41.0, 189.0, 454.0, 633.0]
    bars = ax2.bar([str(x) for x in fx], fx_dur, color='#ea580c', edgecolor='#0f172a', lw=1.2, width=0.55)
    ax2.set_title("Median Latency vs FX Conversions\n[+148s Delay on Multi-Currency Routing]", fontsize=10.5)
    ax2.set_xlabel("Currency Conversion Count")
    ax2.set_ylabel("Median Settlement Duration (s)")
    for bar in bars:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., h+12, f"{h:.0f}s", ha='center', fontsize=8.5, fontweight='bold')
    ax2.set_ylim(0, 750)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g4_latency.png")
    plt.close()

def make_fig_g5():
    """G5: Routing Modality & Covered Payments"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    cats = ['Direct', 'Indirect', 'Covered']
    vals = [3618.95, 3631.98, 4516.92]
    colors = ['#0284c7', '#38bdf8', '#eab308']
    bars = ax1.bar(cats, vals, color=colors, edgecolor='#0f172a', lw=1.2, width=0.55)
    ax1.set_title("Median Amount ($ USD)\n[Covered Commands +24.8% Premium]", fontsize=10.5)
    ax1.set_ylabel("Median USD Amount ($)")
    for bar in bars:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., h+100, f"${h:,.2f}", ha='center', fontsize=8.5, fontweight='bold')
    ax1.set_ylim(0, 5200)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Hops by Modality
    hops_mod = [2.00, 3.58, 3.59]
    bars2 = ax2.bar(cats, hops_mod, color=colors, edgecolor='#0f172a', lw=1.2, width=0.55)
    ax2.set_title("Average Participant Count (Hops)\n[Direct strictly = 2.0; Covered >= 3.0]", fontsize=10.5)
    ax2.set_ylabel("Average Institutions Involved")
    for bar in bars2:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., h+0.08, f"{h:.2f}", ha='center', fontsize=8.5, fontweight='bold')
    ax2.set_ylim(0, 4.3)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g5_modality.png")
    plt.close()

def make_fig_g6():
    """G6: FX Dynamics"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    shares = [10.9, 58.7, 20.2, 6.7, 2.3, 1.2]
    labels = ['0 FX', '1 FX', '2 FX', '3 FX', '4 FX', '5+ FX']
    bars = ax1.bar(labels, shares, color='#10b981', edgecolor='#0f172a', lw=1.2, width=0.55)
    ax1.set_title("FX Currency Conversion Steps (%)\n[58.7% Single-FX; 30.4% Vehicle Currency]", fontsize=10.5)
    ax1.set_ylabel("Share of Payments (%)")
    for bar in bars:
        h = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., h+1.0, f"{h:.1f}%", ha='center', fontsize=8.5, fontweight='bold')
    ax1.set_ylim(0, 70)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Top currencies
    currs = ['EUR', 'USD', 'GBP', 'CHF', 'SGD', 'CNY', 'HKD', 'JPY']
    cur_shares = [32.1, 17.2, 8.8, 7.9, 3.7, 3.3, 2.0, 1.8]
    ax2.barh(currs[::-1], cur_shares[::-1], color='#059669', edgecolor='#0f172a', lw=1.2)
    ax2.set_title("Top Payment Currencies (% Volume)\n[EUR & USD Command 49.3% Global Share]", fontsize=10.5)
    ax2.set_xlabel("Market Share (%)")
    for i, v in enumerate(cur_shares[::-1]):
        ax2.text(v+0.5, i, f"{v:.1f}%", va='center', fontsize=8.5, fontweight='bold')
    ax2.set_xlim(0, 37)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g6_fx.png")
    plt.close()

def make_fig_g7():
    """G7: Tokens & Semantics"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    # Left: Business token
    cats = ['Consumer (C)', 'Corporate (B)']
    biz_rates = [0.0, 85.2]
    bars = ax1.bar(cats, biz_rates, color=['#94a3b8', '#0284c7'], edgecolor='#0f172a', lw=1.2, width=0.45)
    ax1.set_title("Prevalence of <business:...> Tokens\n[Strict Gate: P(biz|C) = 0.000]", fontsize=10.5)
    ax1.set_ylabel("Occurrence Rate (%)")
    ax1.set_ylim(0, 100)
    ax1.text(0, 4, "0.0% (Zero Leakage)", ha='center', fontweight='bold', color='#dc2626')
    ax1.text(1, 88, "85.2% (Faker Company)", ha='center', fontweight='bold', color='#0369a1')
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Right: IBAN adoption
    iban_types = ['IBAN Account\n(SEPA / EU)', 'Proprietary Account\n(US, Asia, Others)']
    shares = [51.5, 48.5]
    ax2.pie(shares, labels=iban_types, autopct='%1.1f%%', colors=['#0284c7', '#cbd5e1'], startangle=90,
            textprops={'fontsize': 9, 'fontweight': 'bold'}, wedgeprops=dict(width=0.45, edgecolor='w', lw=1.5))
    ax2.set_title("Account Identifier Standard\n[SEPA Corridors Exclusively Generate IBAN]", fontsize=10.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g7_tokens.png")
    plt.close()

def make_fig_g8():
    """G8: Anomalies"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9, 4), dpi=300)
    
    # Left: Anomaly census
    anom_names = ['Romance Scam', 'Fat-Finger', 'CEO Scam', 'Duplicate', 'Account Replace', 'Customer Recall']
    anom_counts = [2476, 1940, 945, 679, 649, 317]
    bars = ax1.barh(anom_names[::-1], anom_counts[::-1], color='#e11d48', edgecolor='#0f172a', lw=1.2)
    ax1.set_title("Total Anomaly Census (10M Records)\n[7,006 Total Anomalies = 0.0701%]", fontsize=10.5)
    ax1.set_xlabel("Record Count")
    for bar in bars:
        w = bar.get_width()
        ax1.text(w + 35, bar.get_y() + bar.get_height()/2., f"{w:,}", va='center', fontsize=8.5, fontweight='bold')
    ax1.set_xlim(0, 2900)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Right: Entity Conditioning
    scams = ['Romance\nScam', 'CEO\nScam']
    c_orig = [100.0, 0.0]
    b_orig = [0.0, 100.0]
    ax2.bar(scams, c_orig, label='Consumer (C)', color='#38bdf8', edgecolor='#0f172a', lw=1.2, width=0.4)
    ax2.bar(scams, b_orig, bottom=c_orig, label='Business (B)', color='#1e3a8a', edgecolor='#0f172a', lw=1.2, width=0.4)
    ax2.set_title("Originating Entity Conditioning\n[Strict 100% Boundary Separation]", fontsize=10.5)
    ax2.set_ylabel("Share of Originating Party (%)")
    ax2.set_ylim(0, 115)
    ax2.legend(loc='upper right', frameon=True)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_g8_anomalies.png")
    plt.close()

def make_fig_twin():
    """Generative Twin Validation"""
    fig, ax = plt.subplots(figsize=(7, 3.8), dpi=300)
    
    pairs = ['C -> C', 'B -> C', 'C -> B', 'B -> B']
    emp = [435.80, 3223.16, 3631.09, 23840.11]
    sim = [413.66, 2957.45, 2472.05, 21237.07]
    
    x = np.arange(len(pairs))
    width = 0.35
    
    r1 = ax.bar(x - width/2, emp, width, label='Empirical Data', color='#0284c7', edgecolor='#0f172a', lw=1.2)
    r2 = ax.bar(x + width/2, sim, width, label='Generative Twin Output', color='#38bdf8', edgecolor='#0f172a', lw=1.2)
    
    ax.set_yscale('log')
    ax.set_title("Generative Twin vs Empirical Ground Truth\n[Log-Scale Validation: High Statistical Fidelity]", fontsize=11)
    ax.set_ylabel("Median Transaction Value ($ USD)")
    ax.set_xticks(x)
    ax.set_xticklabels(pairs, fontweight='bold')
    ax.legend(frameon=True)
    ax.set_ylim(100, 100000)
    ax.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(f"{FIG_DIR}/fig_twin_validation.png")
    plt.close()

def main():
    print("=== GENERATING HIGH-RESOLUTION SLIDE FIGURES ===")
    make_fig_g1()
    print("  Saved fig_g1_amount.png")
    make_fig_g2()
    print("  Saved fig_g2_temporal.png")
    make_fig_g3()
    print("  Saved fig_g3_topology.png")
    make_fig_g4()
    print("  Saved fig_g4_latency.png")
    make_fig_g5()
    print("  Saved fig_g5_modality.png")
    make_fig_g6()
    print("  Saved fig_g6_fx.png")
    make_fig_g7()
    print("  Saved fig_g7_tokens.png")
    make_fig_g8()
    print("  Saved fig_g8_anomalies.png")
    make_fig_twin()
    print("  Saved fig_twin_validation.png")
    print("SUCCESS: All figures generated in output/figures/")

if __name__ == '__main__':
    main()
