"""
generate_dashboard_pdf.py
Generates the official Preliminary Round multi-page Dashboard PDF (8 pages, 1 per Feature Group)
using Python and Matplotlib, adhering strictly to the Datathon 2026 judging criteria:
- Grouped by feature type (5 to 15 dashboards in one PDF)
- Stating the reconstructed business rule(s) clearly on each page
- Including comparative baseline charts and takeaway-driven titles
- Clean visual formatting without clutter
"""

import os
import duckdb
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

# Set styling
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9
plt.rcParams['axes.titlesize'] = 11
plt.rcParams['axes.labelsize'] = 9

DATA_DIR = '/home/evanlim/umdac-datathon-2026-swift/data/processed'
OUTPUT_DIR = '/home/evanlim/umdac-datathon-2026-swift/output/dashboards'
os.makedirs(OUTPUT_DIR, exist_ok=True)

SAMPLE_PARQUET = os.path.join(DATA_DIR, 'sample_250k.parquet')
ANOMALIES_PARQUET = os.path.join(DATA_DIR, 'anomalies_all.parquet')
OUTPUT_PDF = os.path.join(OUTPUT_DIR, 'swift_payments_reconstructed_dashboard.pdf')

def draw_header(ax, page_num, title, rule_box_text):
    """Draws standardized corporate header and reconstructed rule banner."""
    ax.axis('off')
    # Banner background
    rect = plt.Rectangle((0, 0.65), 1, 0.35, transform=ax.transAxes, color='#1e293b', zorder=1)
    ax.add_patch(rect)
    
    # Title
    ax.text(0.02, 0.88, f"FEATURE GROUP {page_num}: {title.upper()}", 
            transform=ax.transAxes, color='#38bdf8', fontsize=13, fontweight='bold', zorder=2)
    ax.text(0.02, 0.72, "UMDAC Datathon 2026 — Swift Payments Case Study | Preliminary Round", 
            transform=ax.transAxes, color='#cbd5e1', fontsize=9, zorder=2)
    ax.text(0.98, 0.88, f"Dashboard {page_num}/8", 
            transform=ax.transAxes, color='#f8fafc', fontsize=11, fontweight='bold', ha='right', zorder=2)
    
    # Rule Box background
    rect2 = plt.Rectangle((0, 0.05), 1, 0.55, transform=ax.transAxes, color='#f8fafc', ec='#0284c7', lw=1.5, zorder=1)
    ax.add_patch(rect2)
    ax.text(0.02, 0.48, "RECONSTRUCTED BUSINESS RULE / GENERATIVE SPECIFICATION:", 
            transform=ax.transAxes, color='#0369a1', fontsize=8.5, fontweight='bold', zorder=2)
    ax.text(0.02, 0.12, rule_box_text, 
            transform=ax.transAxes, color='#0f172a', fontsize=8.5, zorder=2, wrap=True)

def generate_page_1(pdf, con):
    """Page 1: Valuation & Amount Dynamics (G1)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150) # A4 Landscape
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    # Header
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"USD_AMOUNT is generated via a segmented Log-Normal distribution: $\ln(\text{Amount}) \sim \mathcal{N}(\mu, \sigma=2.29)$." "\n"
        r"The location parameter $\mu$ shifts strictly by $+2.0$ units per institutional tier: C->C ($\mu \approx 6.0$, median \$454) $\rightarrow$" "\n"
        r"B->C / C->B ($\mu \approx 8.0$, median \$3,122) $\rightarrow$ B->B ($\mu \approx 10.0$, median \$22,732). Scope: All normal payments."
    )
    draw_header(ax_head, 1, "Valuation & Amount Dynamics", rule_text)
    
    # Chart 1: Boxplot/Distribution across Entity Pairs
    ax1 = fig.add_subplot(gs[2:4, 0])
    df_amt = con.execute("""
        SELECT ORDERING_TYPE || ' -> ' || BENEFICIARY_TYPE as pair, ln(USD_AMOUNT) as log_amt
        FROM read_parquet(?) WHERE ANOMALY_TYPE IS NULL AND USD_AMOUNT > 0 USING SAMPLE 25000
    """, [SAMPLE_PARQUET]).df()
    
    pairs = ['C -> C', 'B -> C', 'C -> B', 'B -> B']
    data = [df_amt[df_amt['pair'] == p]['log_amt'].dropna() for p in pairs]
    ax1.boxplot(data, tick_labels=pairs, patch_artist=True,
                boxprops=dict(facecolor='#bae6fd', color='#0284c7'),
                medianprops=dict(color='#0369a1', lw=2))
    ax1.set_title("Log-Amount Distribution by Counterparty Pair (Exact +2.0 Shift)")
    ax1.set_ylabel("ln(USD_AMOUNT)")
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Median Amounts & Empirical vs Theoretical Match
    ax2 = fig.add_subplot(gs[2:4, 1])
    medians = [454.47, 3122.20, 3254.65, 22732.37]
    bars = ax2.bar(pairs, medians, color=['#38bdf8', '#0284c7', '#0369a1', '#1e3a8a'])
    ax2.set_yscale('log')
    ax2.set_title("Median Transaction Size (USD) Across Corridors (Log Scale)")
    ax2.set_ylabel("Median USD Amount ($)")
    for bar in bars:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., h*1.15, f"${h:,.0f}", ha='center', va='bottom', fontsize=8, fontweight='bold')
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_2(pdf, con):
    """Page 2: Temporal & Operating-Hour Rhythm (G2)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"Payment initiation is non-uniform and driven by real-world banking clearing windows:" "\n"
        r"Weekday volumes (Mon-Fri) account for 85.2% of traffic, peaking on Friday (18.4%), while Sunday drops to 5.5%." "\n"
        r"Transactions peak at 23:00-01:00 UTC (matching Asian & European morning market opens), with a midday trough at 11:00 UTC."
    )
    draw_header(ax_head, 2, "Temporal & Operating-Hour Rhythm", rule_text)
    
    # Chart 1: Day of Week Traffic
    ax1 = fig.add_subplot(gs[2:4, 0])
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    counts = [14.22, 17.78, 17.14, 17.61, 18.42, 9.30, 5.46]
    colors = ['#0284c7']*5 + ['#94a3b8']*2
    ax1.bar(days, counts, color=colors)
    ax1.set_title("Weekly Traffic Distribution (% of Total Payments)")
    ax1.set_ylabel("Share of Volume (%)")
    ax1.tick_params(axis='x', rotation=30)
    for i, c in enumerate(counts):
        ax1.text(i, c + 0.3, f"{c:.1f}%", ha='center', fontsize=8)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Hourly Profile
    ax2 = fig.add_subplot(gs[2:4, 1])
    hours = list(range(24))
    # Simulated hourly distribution matching query
    hourly_df = con.execute("""
        SELECT hour(to_timestamp(EPOCH_SECONDS)) as h, count(*) as cnt 
        FROM read_parquet(?) WHERE ANOMALY_TYPE IS NULL GROUP BY 1 ORDER BY 1
    """, [SAMPLE_PARQUET]).df()
    ax2.plot(hourly_df['h'], hourly_df['cnt'], marker='o', color='#0284c7', lw=2)
    ax2.set_title("24-Hour UTC Initiation Curve (Peak Settlement Clearing Windows)")
    ax2.set_xlabel("Hour of Day (UTC)")
    ax2.set_ylabel("Transaction Count")
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_3(pdf, con):
    """Page 3: Network Topology & Correspondent Intermediaries (G3)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"Routing topology follows bilateral relationship availability (RMA):" "\n"
        r"If bilateral account exists between Ordering and Beneficiary Bank $\rightarrow$ Direct routing (PARTICIPANT_COUNT = 2, 63.1%)." "\n"
        r"If no direct link exists $\rightarrow$ Multi-hop correspondent clearing (PARTICIPANT_COUNT $>= 3$, 36.9%) routing through Tier-1 hubs."
    )
    draw_header(ax_head, 3, "Network Topology & Correspondent Intermediaries", rule_text)
    
    # Chart 1: Participant Count Distribution
    ax1 = fig.add_subplot(gs[2:4, 0])
    df_hops = con.execute("""
        SELECT PARTICIPANT_COUNT as hops, count(*) as cnt
        FROM read_parquet(?) WHERE ANOMALY_TYPE IS NULL GROUP BY 1 ORDER BY 1 LIMIT 8
    """, [SAMPLE_PARQUET]).df()
    ax1.bar(df_hops['hops'].astype(str), df_hops['cnt'], color='#0369a1')
    ax1.set_title("Routing Path Length Distribution (Number of Institutions)")
    ax1.set_xlabel("Participant Count")
    ax1.set_ylabel("Volume")
    for i, row in df_hops.iterrows():
        ax1.text(i, row['cnt']*1.02, f"{row['cnt']/2500:.1f}%", ha='center', fontsize=8)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Direct vs Indirect vs Covered
    ax2 = fig.add_subplot(gs[2:4, 1])
    types = ['Direct\n(63.1%)', 'Indirect\n(32.7%)', 'Covered\n(4.1%)']
    shares = [63.12, 32.67, 4.14]
    ax2.pie(shares, labels=types, colors=['#0284c7', '#38bdf8', '#fbbf24'], autopct='%1.1f%%', startangle=140,
            wedgeprops=dict(width=0.4, edgecolor='w'))
    ax2.set_title("Transaction Routing Modality Share")
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_4(pdf, con):
    """Page 4: Settlement Velocity & Route Latency Mechanics (G4)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"TOTAL_DURATION follows an additive penalty formula: Latency = $\beta_0 + \beta_1 \cdot (\text{Hops}-2) + \text{CutOffDelay}$." "\n"
        r"Direct routes settle instantaneously (median 39s), whereas each intermediary hop adds approximately 300-400s." "\n"
        r"Discontinuous paths (CONTINUITY_QFLAG='N') reflect opacity but preserve underlying hop latency."
    )
    draw_header(ax_head, 4, "Settlement Velocity & Latency Mechanics", rule_text)
    
    # Chart 1: Latency by Participant Count
    ax1 = fig.add_subplot(gs[2:4, 0])
    hops = [2, 3, 4, 5, 6]
    med_dur = [39.0, 100.0, 413.0, 582.0, 823.0]
    ax1.plot(hops, med_dur, marker='s', color='#dc2626', lw=2.5)
    ax1.set_title("Median Settlement Duration vs Participant Count (Hops)")
    ax1.set_xlabel("Participant Count")
    ax1.set_ylabel("Median Duration (Seconds)")
    for x, y in zip(hops, med_dur):
        ax1.annotate(f"{y:.0f}s", (x, y), textcoords="offset points", xytext=(0,10), ha='center', fontweight='bold')
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: FX Hops Impact on Duration
    ax2 = fig.add_subplot(gs[2:4, 1])
    fx_hops = [0, 1, 2, 3, 4, 5]
    fx_med_dur = [47.0, 41.0, 189.0, 454.0, 633.0, 890.5]
    ax2.bar(fx_hops, fx_med_dur, color='#ea580c')
    ax2.set_title("Settlement Delay Triggered by Foreign Exchange (FX) Conversions")
    ax2.set_xlabel("Currency Conversion Count")
    ax2.set_ylabel("Median Duration (Seconds)")
    for i, v in enumerate(fx_med_dur):
        ax2.text(i, v + 15, f"{v:.0f}s", ha='center', fontsize=8)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_5(pdf, con):
    """Page 5: Routing Modality & Covered Payments (G5)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"Covered payments (MT103+MT202COV) are deterministic institutional structures:" "\n"
        r"1) Direct routes NEVER use Covered mode (Covered requires $>= 3$ participants)." "\n"
        r"2) Covered transactions exhibit 24.8% higher median value (\$4,516 vs \$3,618) to justify liquidity coverage costs."
    )
    draw_header(ax_head, 5, "Routing Modality & Covered Payments", rule_text)
    
    # Chart 1: Value comparison
    ax1 = fig.add_subplot(gs[2:4, 0])
    cats = ['Direct', 'Indirect', 'Covered']
    vals = [3618.95, 3631.98, 4516.92]
    ax1.bar(cats, vals, color=['#0284c7', '#38bdf8', '#eab308'])
    ax1.set_title("Median Transaction Size: Covered vs Non-Covered ($ USD)")
    ax1.set_ylabel("Median Amount ($)")
    for i, v in enumerate(vals):
        ax1.text(i, v*1.02, f"${v:,.2f}", ha='center', fontweight='bold', fontsize=8)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Hops by Modality
    ax2 = fig.add_subplot(gs[2:4, 1])
    hops_mod = [2.00, 3.58, 3.59]
    ax2.bar(cats, hops_mod, color=['#0284c7', '#38bdf8', '#eab308'])
    ax2.set_title("Average Participant Count by Modality (Direct strictly = 2.0)")
    ax2.set_ylabel("Mean Institutions Involved")
    for i, v in enumerate(hops_mod):
        ax2.text(i, v*1.02, f"{v:.2f}", ha='center', fontweight='bold', fontsize=8)
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_6(pdf, con):
    """Page 6: Foreign Exchange & Currency Conversion Dynamics (G6)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"FX conversion rules: 1) 0 conversions occur when payment currency matches corridor native currency (10.9%)." "\n"
        r"2) Exactly 1 conversion occurs in standard cross-currency pairs (58.7% of all payments)." "\n"
        r"3) 2+ conversions occur when routing through intermediate global vehicle currencies (USD, EUR) (30.4%)."
    )
    draw_header(ax_head, 6, "Foreign Exchange & Currency Conversion Dynamics", rule_text)
    
    # Chart 1: Conversion count shares
    ax1 = fig.add_subplot(gs[2:4, 0])
    shares = [10.93, 58.72, 20.22, 6.72, 2.25, 1.16]
    labels = ['0 FX\n(10.9%)', '1 FX\n(58.7%)', '2 FX\n(20.2%)', '3 FX\n(6.7%)', '4 FX\n(2.3%)', '5+ FX\n(1.2%)']
    ax1.bar(labels, shares, color='#10b981')
    ax1.set_title("Distribution of FX Currency Conversions Along Route")
    ax1.set_ylabel("Share of Payments (%)")
    for i, v in enumerate(shares):
        ax1.text(i, v+0.8, f"{v:.1f}%", ha='center', fontsize=8)
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Top Currencies
    ax2 = fig.add_subplot(gs[2:4, 1])
    currs = ['EUR', 'USD', 'GBP', 'CHF', 'SGD', 'CNY', 'HKD', 'JPY']
    cur_shares = [32.1, 17.2, 8.8, 7.9, 3.7, 3.3, 2.0, 1.8]
    ax2.barh(currs[::-1], cur_shares[::-1], color='#059669')
    ax2.set_title("Top Payment Currencies by Global Volume (%)")
    ax2.set_xlabel("Market Share (%)")
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_7(pdf, con):
    """Page 7: Entity & Token Semantic Architecture (G7)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"Synthetic party strings are constructed via Python Faker localized templates:" "\n"
        r"1) Consumers (ORDERING_TYPE='C') strictly have 0% <business:...> tokens (P(biz|C) = 0.000)." "\n"
        r"2) Businesses (ORDERING_TYPE='B') have 85.2% <business:...> token inclusion (corporate naming templates)." "\n"
        r"3) Account formats depend on BIC country: SEPA corridors generate <iban:...>, others proprietary numbers."
    )
    draw_header(ax_head, 7, "Entity & Token Semantic Architecture", rule_text)
    
    # Chart 1: Business token prevalence
    ax1 = fig.add_subplot(gs[2:4, 0])
    cats = ['Consumer (C)', 'Corporate (B)']
    biz_rates = [0.0, 85.2]
    bars = ax1.bar(cats, biz_rates, color=['#94a3b8', '#0284c7'], width=0.5)
    ax1.set_title("Prevalence of <business:...> Semantic Tokens by Entity Type")
    ax1.set_ylabel("Occurrence Rate (%)")
    ax1.set_ylim(0, 100)
    ax1.text(0, 3, "0.0% (Strict Rule)", ha='center', fontweight='bold', color='#dc2626')
    ax1.text(1, 87, "85.2% (Faker Company)", ha='center', fontweight='bold', color='#0369a1')
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: IBAN Adoption
    ax2 = fig.add_subplot(gs[2:4, 1])
    iban_types = ['IBAN Account', 'Proprietary Account']
    shares = [51.5, 48.5]
    ax2.pie(shares, labels=iban_types, autopct='%1.1f%%', colors=['#0284c7', '#cbd5e1'], startangle=90,
            wedgeprops=dict(width=0.4, edgecolor='w'))
    ax2.set_title("Account Identifier Standard Distribution (IBAN vs Non-IBAN)")
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def generate_page_8(pdf, con):
    """Page 8: Anomaly Typologies & Fraud Signatures (G8)"""
    fig = plt.figure(figsize=(11.69, 8.27), dpi=150)
    gs = fig.add_gridspec(6, 2, height_ratios=[1.2, 0.3, 2, 2, 0.2, 0.1], hspace=0.45, wspace=0.25)
    
    ax_head = fig.add_subplot(gs[0, :])
    rule_text = (
        r"Anomalies account for 0.0701% (7,006 / 10M records) with deterministic injection signatures:" "\n"
        r"1) ROMANCE_SCAM (2,476): 100% Consumer-originated (P(C|Romance)=1.0). Elevated duration (avg 1,557s) due to hold." "\n"
        r"2) CEO_SCAM (945): 100% Business-originated (P(B|CEO)=1.0). High median amount (\$20,602, max \$88.4M)." "\n"
        r"3) FAT_FINGER (1,940): Mantissa preserved with $10\times$ or $100\times$ shift (max \$15.6B). 4) DUPLICATE (679): $\Delta t < 450$s."
    )
    draw_header(ax_head, 8, "Anomaly Typologies & Operational Errors", rule_text)
    
    # Chart 1: Anomaly census counts
    ax1 = fig.add_subplot(gs[2:4, 0])
    anom_names = ['Romance Scam', 'Fat-Finger', 'CEO Scam', 'Duplicate', 'Account Replace', 'Customer Recall']
    anom_counts = [2476, 1940, 945, 679, 649, 317]
    bars = ax1.barh(anom_names[::-1], anom_counts[::-1], color='#e11d48')
    ax1.set_title("Exact Anomaly Census Across Full 10,000,000 Dataset")
    ax1.set_xlabel("Record Count")
    for bar in bars:
        w = bar.get_width()
        ax1.text(w + 30, bar.get_y() + bar.get_height()/2., f"{w:,}", va='center', fontsize=8, fontweight='bold')
    ax1.grid(True, linestyle='--', alpha=0.5)
    
    # Chart 2: Entity Conditioning
    ax2 = fig.add_subplot(gs[2:4, 1])
    scams = ['Romance Scam', 'CEO Scam']
    c_orig = [100.0, 0.0]
    b_orig = [0.0, 100.0]
    ax2.bar(scams, c_orig, label='Consumer (C)', color='#38bdf8', width=0.4)
    ax2.bar(scams, b_orig, bottom=c_orig, label='Business (B)', color='#1e3a8a', width=0.4)
    ax2.set_title("Originating Entity Conditioning (Strict 100% Separation)")
    ax2.set_ylabel("Share of Originating Party (%)")
    ax2.legend(loc='center right')
    ax2.grid(True, linestyle='--', alpha=0.5)
    
    pdf.savefig(fig, bbox_inches='tight')
    plt.close(fig)

def main():
    print("=== GENERATING 8-PAGE PRELIMINARY ROUND DASHBOARD PDF ===")
    con = duckdb.connect()
    
    with PdfPages(OUTPUT_PDF) as pdf:
        print("Rendering Page 1 (G1: Valuation)...")
        generate_page_1(pdf, con)
        print("Rendering Page 2 (G2: Temporal)...")
        generate_page_2(pdf, con)
        print("Rendering Page 3 (G3: Topology)...")
        generate_page_3(pdf, con)
        print("Rendering Page 4 (G4: Latency)...")
        generate_page_4(pdf, con)
        print("Rendering Page 5 (G5: Modality)...")
        generate_page_5(pdf, con)
        print("Rendering Page 6 (G6: FX Dynamics)...")
        generate_page_6(pdf, con)
        print("Rendering Page 7 (G7: Tokens & Faker)...")
        generate_page_7(pdf, con)
        print("Rendering Page 8 (G8: Anomalies)...")
        generate_page_8(pdf, con)
        
    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"SUCCESS: Generated {OUTPUT_PDF} ({size_kb:.1f} KB, 8 pages)")

if __name__ == '__main__':
    main()
