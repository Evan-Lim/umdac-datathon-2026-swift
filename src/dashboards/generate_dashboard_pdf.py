"""
generate_dashboard_pdf.py
Vectorized 8-Page Preliminary Round Dashboard Deliverable Generator for UMDAC Datathon 2026.
Generates an executive-ready 16:9 widescreen PDF (8 pages, exactly 1 page per Feature Group/Topic)
adhering strictly to Swift and UMDAC judging criteria:
- Grouped by feature type across the 3 analytical pillars
- Reconstructed business rules and mathematical formulas prominently stated
- Top KPI metric ribbons displaying exact empirical quantities
- High-resolution empirical evidence visualizations extracted from executed Google Colab cells
- Operational takeaways tailored for Swift RTGS liquidity managers, risk officers, and infrastructure architects
"""

import os
import shutil
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_pdf import PdfPages

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

OUTPUT_DIR = '/home/evanlim/umdac-datathon-2026-swift/output/dashboards'
FIGURES_DIR = '/home/evanlim/umdac-datathon-2026-swift/output/figures'
WINDOWS_MIRROR_DIR = '/mnt/c/Users/EvanLim/Downloads/datathon_submission_drafts'
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(WINDOWS_MIRROR_DIR, exist_ok=True)

OUTPUT_PDF = os.path.join(OUTPUT_DIR, 'swift_payments_reconstructed_dashboard.pdf')
WINDOWS_PDF = os.path.join(WINDOWS_MIRROR_DIR, 'swift_payments_reconstructed_dashboard.pdf')

PAGES_CONFIG = [
    {
        'page_num': 1,
        'title': 'VALUATION DYNAMICS & THE LOG-NORMAL LADDER LAW',
        'pillar': 'Pillar 3: Financial & Modality Architecture | Zhi Yin',
        'cell_ref': 'Google Colab Cell 30 (Topic 2: Entity Pair Segment)',
        'rule_lines': [
            r"USD_AMOUNT follows a segmented Log-Normal distribution: ln(Amount) ~ N(mu, sigma=2.29). Location parameter mu shifts by exactly +2.0 increments per tier:",
            r"C->C (mu=6.0, median $454) -> B->C / C->B (mu=8.0, median $3,119) -> B->B (mu=10.0, median $22,888). Delta_mu = +2.0 multiplies median value by exp(2.0) = 7.39x."
        ],
        'kpis': [
            ('72.54%', 'B2B LIQUIDITY CAPTURE', '$705.14B settled of $972.04B total'),
            ('22.71%', 'B2B TRANSACTION VOLUME', '2,270,945 commercial payments'),
            ('$22,887.71', 'B2B WHOLESALE MEDIAN', 'Mean: $310,506.47 | mu = 10.04'),
            ('50.4x', 'B2B VS C2C VALUE RATIO', 'C2C Median: $454.12 | mu = 6.06')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_yin_t2_entities.png'),
        'footer_lines': [
            'B2B commercial invoices command nearly three-quarters of network liquidity ($705.14B) on less than a quarter of volume. Central bank RTGS collateral buffers',
            'and intraday credit facilities must be scaled around corporate clearing hours rather than aggregate transaction volume to prevent systemic queuing gridlock.'
        ]
    },
    {
        'page_num': 2,
        'title': 'GLOBAL FOREIGN EXCHANGE DYNAMICS & TRIANGULATION',
        'pillar': 'Pillar 3: Financial & Modality Architecture | Zhi Yin',
        'cell_ref': 'Google Colab Cell 28 (Topic 1: Currency Dominance & Value Concentration)',
        'rule_lines': [
            r"Global reserve currency duopoly (EUR 31.99% + USD 17.03%) captures 49.02% of total volume and 59.46% of settled turnover ($577.98B).",
            r"Thin exotic corridors lack direct quotes and triangulate through USD/EUR (>=2 FX steps), adding latency without altering ticket size (F=0.82, p=0.58)."
        ],
        'kpis': [
            ('59.46%', 'RESERVE DUOPOLY SHARE', '$577.98B settled across EUR & USD'),
            ('36.76%', 'EURO NETWORK VALUE', '$357.35B settled (31.99% volume)'),
            ('30.18%', 'TRIANGULATED VEHICLE FX', '>=2 conversions via global reserve pairs'),
            ('321.0s', 'MULTI-FX MEDIAN LATENCY', 'vs 41.0s for single FX conversion (7.8x)')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_yin_t1_currency.png'),
        'footer_lines': [
            'Cross-border currency conversion friction is heavily non-linear. Direct bilateral corridors settle in under a minute, while vehicle currency triangulation adds',
            'over 4.5 minutes of latency. Swift should promote regional multi-currency netting arrangements to eliminate secondary currency conversions.'
        ]
    },
    {
        'page_num': 3,
        'title': 'NETWORK CORRIDOR TOPOLOGY & DIRECT ROUTING INVARIANCE',
        'pillar': 'Pillar 2: Network Architecture & Routing | Evan',
        'cell_ref': 'Google Colab Cell 21 (Topic 1: Modality Volume & Route Distribution)',
        'rule_lines': [
            r"Direct routing is strictly equivalent to exactly two settlement institutions: Direct <=> N_hops == 2.0 (100.00% invariant, 6,323,283 payments).",
            r"Indirect (32.61%) and Covered (4.16%) route exclusively via 4 global clearing hubs: New York (US30), London (GB20), Frankfurt (DEF0), and Zurich (CHZ0)."
        ],
        'kpis': [
            ('63.23%', 'DIRECT ROUTING SHARE', '6,323,283 payments (N = 2.0 strictly)'),
            ('32.61%', 'INDIRECT MULTI-HOP', '3,261,289 payments (3 to 12 hops)'),
            ('81.4%', 'HUB CONCENTRATION', 'US30, GB20, DEF0, CHZ0 capture intermediary flow'),
            ('39.0s', 'DIRECT MEDIAN LATENCY', 'Baseline zero-intermediary clearance time')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_evan_t1_topology.png'),
        'footer_lines': [
            'Two-thirds of the network operates seamlessly through direct bilateral accounts. The remaining third is routed through an oligopoly of Western correspondent hubs.',
            'Regional payment infrastructure initiatives should establish direct bilateral RMAs to bypass correspondent toll-gates and reduce concentration risk.'
        ]
    },
    {
        'page_num': 4,
        'title': 'MULTI-HOP LATENCY SCALING & FX FRICTION BOTTLENECKS',
        'pillar': 'Pillar 2: Network Architecture & Routing | Evan',
        'cell_ref': 'Google Colab Cell 23 (Topic 2: Routing Latency Scaling & Bottlenecks)',
        'rule_lines': [
            r"Additive latency scaling law: Latency = 39.0s + beta_hop * Delta_N + 148s * 1_{FX >= 2}. Intermediary hops add +87s to +292s per institution.",
            r"Geographic physical distance has zero correlation (r = 0.018, p = 0.34), strictly rejecting the geographic latency hypothesis (NEG-01)."
        ],
        'kpis': [
            ('39.0s', 'BASE DIRECT LATENCY', 'Median zero-hop clearance duration'),
            ('+87.0s', 'MEDIAN HOP PENALTY', 'Incremental delay per correspondent handoff'),
            ('r = 0.018', 'GEOGRAPHIC CORRELATION', 'p = 0.34 (Physical distance is 100% irrelevant)'),
            ('2,410s', 'MAX HOP PATH DURATION', '22-hop multi-jurisdictional routing extreme')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_evan_t2_latency.png'),
        'footer_lines': [
            'Payment processing delay is purely a function of institutional governance and compliance checks at intermediary nodes, not physical transit distance.',
            'Upgrading fiber or telecom infrastructure yields zero latency benefits; end-to-end straight-through processing (STP) at correspondent nodes is the sole lever for speed.'
        ]
    },
    {
        'page_num': 5,
        'title': 'TEMPORAL SETTLEMENT RHYTHMS & 24-HOUR DIURNAL WINDOWS',
        'pillar': 'Pillar 2: Network Architecture & Routing | Evan',
        'cell_ref': 'Google Colab Cell 25 (Topic 3: Temporal Rhythm & Diurnal Window)',
        'rule_lines': [
            r"Institutional business-week scheduling concentrates 88.82% of volume on weekdays. Monday and Friday peak at 18.34% each (1.83M payments).",
            r"Global diurnal execution features a sharp nocturnal release spike at 23:00-01:00 UTC coinciding with Asian market open and US batch dispatch."
        ],
        'kpis': [
            ('88.82%', 'WEEKDAY VOLUME SHARE', 'Mon-Fri corporate clearing dominance'),
            ('18.34%', 'PEAK DAY SHARE (FRI/MON)', '1.83M payments per peak trading day'),
            ('5.59%', 'WEEKEND LIQUIDITY FLOOR', '-69.5% drop during Saturday/Sunday lull'),
            ('23:00 UTC', 'DIURNAL PROCESSING PEAK', '620k tx/hour nocturnal batch release')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_evan_t3_temporal.png'),
        'footer_lines': [
            'Liquidity pressure is heavily synchronized around weekday opening windows and nocturnal automated batch dispatches. Central bank RTGS liquidity bridges',
            'and automated liquidity-saving mechanisms (LSMs) must allocate maximum buffer capacity between 22:00 and 02:00 UTC to absorb batch clearing surges.'
        ]
    },
    {
        'page_num': 6,
        'title': 'PAYMENT MODALITY SEGMENTATION & COVERED LIQUIDITY THRESHOLDS',
        'pillar': 'Pillar 1: Observability, Modality & Fraud | Joy / Pillar 3 | Zhi Yin',
        'cell_ref': 'Google Colab Cell 32 (Topic 3: Settlement Execution & Latency Mechanics)',
        'rule_lines': [
            r"Institutional modality partitioning dictates execution speed and ticket sizes: Instant payments settle in median 12.0s; Direct settles in 39.0s;",
            r"Indirect averages 281.0s; Covered settlement averages 383.0s. Covered payments require >=3 participants and exhibit +24.8% higher ticket sizes."
        ],
        'kpis': [
            ('12.0s', 'INSTANT MODALITY MEDIAN', 'Real-time domestic/regional clearing'),
            ('383.0s', 'COVERED SETTLEMENT MEDIAN', 'Dual MT103+MT202COV coordination overhead'),
            ('4.16%', 'COVERED MODALITY SHARE', '416,211 multi-bank liquidity-backed payments'),
            ('+24.8%', 'COVERED VALUE PREMIUM', 'Higher nominal ticket justifies coverage fee')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_yin_t3_settlement.png'),
        'footer_lines': [
            'Covered routing (MT202COV) introduces significant latency overhead due to asynchronous settlement message reconciliation. Financial institutions',
            'should transition from bilateral covered arrangements to synchronized multilateral payment-versus-payment (PvP) clearing engines.'
        ]
    },
    {
        'page_num': 7,
        'title': 'ROUTE OBSERVABILITY BLIND SPOTS & TOKEN INTEGRITY',
        'pillar': 'Pillar 1: Observability, Modality & Fraud Signatures | Joy',
        'cell_ref': 'Google Colab Cell 15 (Topic 2: Continuity Quality & Route Integrity)',
        'rule_lines': [
            r"CONTINUITY_QFLAG serves as the primary route observability flag. Verified routes ('Y', 92.33%) settle in 54.0s median; blind spots ('N', 7.67%)",
            r"jump to 155.0s median (2.87x latency surge). Numeric tokens suffer a +50.8% elevated anomaly rate (0.095% vs 0.063%), while corporate gating is strictly invariant."
        ],
        'kpis': [
            ('92.33%', 'VERIFIED ROUTE VISIBILITY', '9,232,888 payments with full telemetry'),
            ('7.67%', 'MASKED ROUTE BLIND SPOTS', '767,112 payments (CONTINUITY_QFLAG = \'N\')'),
            ('2.87x', 'BLIND SPOT LATENCY SURGE', '155.0s median vs 54.0s for verified routes'),
            ('+50.8%', 'NUMERIC TOKEN RISK', '0.095% anomaly rate vs 0.063% baseline')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_joy_t2_observability.png'),
        'footer_lines': [
            'Payments with masked continuity flags represent critical visibility blind spots with severe latency penalties. Swift gpi mandatory confirmation protocols',
            'must be strictly enforced on opaque correspondent corridors to eliminate blind spots and preemptively reroute high-friction transactions.'
        ]
    },
    {
        'page_num': 8,
        'title': 'SYNTHETIC ANOMALY CENSUS & FRAUD TICKET DISTORTION',
        'pillar': 'Pillar 1: Observability, Modality & Fraud Signatures | Joy',
        'cell_ref': 'Google Colab Cell 17 (Topic 3: Anomaly Breakdown & Modality Conditioning)',
        'rule_lines': [
            r"Exactly 7,006 anomalous transactions exist across the 10,000,000 dataset (0.07006% global rate). Strict entity conditioning holds:",
            r"P(Consumer | Romance Scam) = 1.0000; P(Business | CEO Scam) = 1.0000. System Malfunctions cause a deterministic 100x ticket size inflation (mu -> 12.0)."
        ],
        'kpis': [
            ('7,006', 'TOTAL ANOMALY CENSUS', 'Exact signatures across 10M payments (0.070%)'),
            ('100.0%', 'ENTITY GATING PRECISION', 'Romance = 100% Retail; CEO = 100% Corporate'),
            ('100x', 'MALFUNCTION TICKET INFLATION', 'Nominal amount multiplied by 10^2 factor'),
            ('1,557s', 'SCAM INVESTIGATION HOLD', 'Average clearance delay on flagged accounts')
        ],
        'image_file': os.path.join(FIGURES_DIR, 'colab_joy_t3_anomalies.png'),
        'footer_lines': [
            'Rule-based entity-type priors achieve near-perfect discrimination for targeted scam typologies. Fraud screening engines should implement Bayesian priors',
            'conditioned on counterparty legal entity identifiers (LEI) to suppress false positives on commercial accounts and halt consumer social engineering.'
        ]
    }
]

def render_dashboard_page(pdf, cfg):
    fig = plt.figure(figsize=(16, 9), dpi=150)
    fig.patch.set_facecolor('#f8fafc')

    # 1. Header Bar
    ax_header = fig.add_axes([0, 0.91, 1, 0.09])
    ax_header.axis('off')
    ax_header.add_patch(patches.Rectangle((0, 0), 1, 1, facecolor='#0b2545', edgecolor='none'))
    ax_header.text(0.025, 0.65, 'SWIFT  |  UMDAC DATATHON 2026', color='#38bdf8', fontsize=11, fontweight='bold', va='center')
    ax_header.text(0.025, 0.30, 'Preliminary Round Deliverable 1 — Reverse-Engineered Business Rules & Network Diagnostics', color='#94a3b8', fontsize=8.5, va='center')
    ax_header.text(0.50, 0.65, f"PAGE {cfg['page_num']}: {cfg['title']}", color='#ffffff', fontsize=12.5, fontweight='bold', ha='center', va='center')
    ax_header.text(0.975, 0.50, f"{cfg['pillar'].split('|')[0].strip()} | Page {cfg['page_num']} of 8", color='#38bdf8', fontsize=9.5, fontweight='bold', ha='right', va='center', bbox=dict(boxstyle='round,pad=0.4', facecolor='#1e3a8a', edgecolor='#38bdf8', lw=1))

    # 2. Rule Box
    ax_rule = fig.add_axes([0.025, 0.81, 0.95, 0.085])
    ax_rule.axis('off')
    ax_rule.add_patch(patches.Rectangle((0, 0), 1, 1, facecolor='#f0f9ff', edgecolor='#0284c7', lw=1.5))
    ax_rule.text(0.015, 0.72, 'RECONSTRUCTED BUSINESS RULE / GENERATIVE SPECIFICATION:', color='#0369a1', fontsize=8.5, fontweight='bold', va='center')
    rule_joined = cfg['rule_lines'][0] + '\n' + cfg['rule_lines'][1]
    ax_rule.text(0.015, 0.32, rule_joined, color='#0f172a', fontsize=8.5, va='center')

    # 3. KPI Ribbon
    for i, (val, title, sub) in enumerate(cfg['kpis']):
        x_pos = 0.025 + i * 0.245
        ax_kpi = fig.add_axes([x_pos, 0.695, 0.22, 0.095])
        ax_kpi.axis('off')
        ax_kpi.add_patch(patches.Rectangle((0, 0), 1, 1, facecolor='#ffffff', edgecolor='#cbd5e1', lw=1))
        ax_kpi.add_patch(patches.Rectangle((0, 0.94), 1, 0.06, facecolor='#0284c7', edgecolor='none'))
        ax_kpi.text(0.06, 0.78, title, color='#64748b', fontsize=7.5, fontweight='bold', va='center')
        ax_kpi.text(0.06, 0.44, val, color='#0b2545', fontsize=15, fontweight='bold', va='center')
        ax_kpi.text(0.06, 0.16, sub, color='#475569', fontsize=7.2, va='center')

    # 4. Visual Frame & Embedded Image
    ax_viz_frame = fig.add_axes([0.025, 0.115, 0.95, 0.56])
    ax_viz_frame.axis('off')
    ax_viz_frame.add_patch(patches.Rectangle((0, 0), 1, 1, facecolor='#ffffff', edgecolor='#cbd5e1', lw=1))
    ax_viz_frame.text(0.015, 0.965, f"EMPIRICAL EVIDENCE & GENERATIVE TWIN BENCHMARK ({cfg['cell_ref'].upper()})", color='#1e293b', fontsize=8.5, fontweight='bold', va='center')

    ax_img = fig.add_axes([0.035, 0.125, 0.93, 0.50])
    ax_img.axis('off')
    if os.path.exists(cfg['image_file']):
        img = Image.open(cfg['image_file'])
        ax_img.imshow(img, aspect='equal')
    else:
        ax_img.text(0.5, 0.5, f"Figure missing: {cfg['image_file']}", ha='center', va='center', color='red')

    # 5. Operational Takeaway Footer
    ax_foot = fig.add_axes([0.025, 0.02, 0.95, 0.08])
    ax_foot.axis('off')
    ax_foot.add_patch(patches.Rectangle((0, 0), 1, 1, facecolor='#1e293b', edgecolor='#0f172a', lw=1))
    ax_foot.text(0.015, 0.72, 'OPERATIONAL TAKEAWAY FOR SWIFT & FINANCIAL INSTITUTIONS:', color='#38bdf8', fontsize=8, fontweight='bold', va='center')
    foot_joined = cfg['footer_lines'][0] + '\n' + cfg['footer_lines'][1]
    ax_foot.text(0.015, 0.32, foot_joined, color='#f1f5f9', fontsize=8.2, va='center')

    pdf.savefig(fig, dpi=150)
    plt.close(fig)

def main():
    print("=== GENERATING 8-PAGE WIDESCREEN 16:9 PRELIMINARY ROUND DASHBOARD DELIVERABLE ===")
    with PdfPages(OUTPUT_PDF) as pdf:
        for idx, cfg in enumerate(PAGES_CONFIG):
            print(f"Rendering Dashboard Page {cfg['page_num']}/8: {cfg['title']}...")
            render_dashboard_page(pdf, cfg)
            
    shutil.copy2(OUTPUT_PDF, WINDOWS_PDF)
    file_size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"SUCCESS: Generated {OUTPUT_PDF} ({file_size_kb:.1f} KB, 8 pages)")
    print(f"SUCCESS: Mirrored to {WINDOWS_PDF}")

if __name__ == '__main__':
    main()
