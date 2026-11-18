import fs from 'node:fs';
import path from 'node:path';
import { ANOMALY_CENSUS } from '../shared/anomalyCensus';
import type { AnomalyCensusItem } from '../types';

export { ANOMALY_CENSUS };
export type { AnomalyCensusItem };

const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const TABLES_DIR = path.join(OUTPUT_DIR, 'tables');
const FIGURES_DIR = path.join(OUTPUT_DIR, 'figures');
const SLIDES_PAGES_DIR = path.join(OUTPUT_DIR, 'slides', 'pages');
const REPORTS_DIR = path.join(ROOT_DIR, 'reports');

export interface CsvRow {
  [key: string]: string | number;
}

function parseCsv(filePath: string): CsvRow[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      const val = vals[idx] ?? '';
      const num = Number(val);
      row[h] = val !== '' && !Number.isNaN(num) ? num : val;
    });
    return row;
  });
}

export interface DashboardPageConfig {
  pageNum: number;
  featureGroup: string;
  title: string;
  pillar: string;
  cellRef: string;
  formulaExpr: string;
  baselineComparison: string;
  ruleLines: [string, string];
  kpis: Array<{ value: string; label: string; sub: string }>;
  imageUrl: string;
  figureUrl: string;
  footerLines: [string, string];
}

export const DASHBOARD_PAGES: DashboardPageConfig[] = [
  {
    pageNum: 1,
    featureGroup: 'Group 1 · Valuation Dynamics',
    title: 'Valuation Dynamics & The Log-Normal Ladder Law',
    pillar: 'Pillar 3: Financial & Modality Architecture',
    cellRef: 'Colab Cell 30 · Topic 2: Entity Pair Segmentation',
    formulaExpr: 'ln(USD_AMOUNT) ~ Normal(mu_tier, sigma = 2.29) | Delta_mu = +2.00 per tier (exp(2) = 7.39x)',
    baselineComparison: 'Baseline: C->C Retail Median ($454.47) vs. B->B Wholesale Median ($22,732.37, 50.0x)',
    ruleLines: [
      'USD_AMOUNT strictly follows a segmented Log-Normal distribution where location parameter mu shifts by +2.0 increments per institutional counterparty tier.',
      'C->C (mu=6.055, med $454.47) -> B->C / C->B (mu=7.992 / 8.041, med $3,122 / $3,255) -> B->B (mu=9.995, med $22,732.37); holds identically inside USD, EUR, GBP, and CNY.',
    ],
    kpis: [
      { value: '72.54%', label: 'B2B Liquidity Capture', sub: '$705.14B settled of $972.04B total' },
      { value: '22.71%', label: 'B2B Volume Share', sub: '2,270,945 commercial wires' },
      { value: '$22,732.37', label: 'B2B Wholesale Median', sub: 'Mean: $248,281 | mu = 9.995' },
      { value: '7.39x', label: 'Tier Step Multiplier', sub: 'Exact exp(+2.0) log-ladder jump' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-1.png',
    figureUrl: '/output/figures/colab_yin_t2_entities.png',
    footerLines: [
      'B2B commercial invoices command nearly three-quarters of network liquidity ($705.14B) on less than a quarter of transaction volume.',
      'Central bank RTGS collateral buffers and intraday credit facilities should scale around corporate clearing hours rather than aggregate message count.',
    ],
  },
  {
    pageNum: 2,
    featureGroup: 'Group 6 · Foreign Exchange',
    title: 'Global Foreign Exchange Dynamics & Triangulation',
    pillar: 'Pillar 3: Financial & Modality Architecture',
    cellRef: 'Colab Cell 28 · Topic 1: Currency Dominance & FX Steps',
    formulaExpr: 'FX_Delay = +148.0s if CURRENCY_CONVERSION_COUNT >= 2 | Ticket Size ANOVA: F = 0.82, p = 0.58',
    baselineComparison: 'Baseline: Single FX (41.0s median, 58.72%) vs. Multi-FX Triangulation (189s-454s median, 30.18%)',
    ruleLines: [
      'Reserve currency duopoly (EUR 32.1% + USD 17.2%) captures 49.3% of message volume and 59.46% of settled turnover ($577.98B across 56 ISO currencies).',
      'Exotic corridors lacking direct bilateral quotes triangulate via USD/EUR (>=2 FX steps), surging latency without altering ticket size (HYP-NEG-02 rejected).',
    ],
    kpis: [
      { value: '59.46%', label: 'Reserve Duopoly Value', sub: '$577.98B settled in EUR & USD' },
      { value: '58.72%', label: 'Single-FX Bilateral', sub: '41.0s median clearance time' },
      { value: '30.35%', label: 'Vehicle FX (>=2 Steps)', sub: '20.22% at 2 FX, 10.13% at 3+ FX' },
      { value: '454.0s', label: '3-Step FX Latency', sub: '11.1x slower than 1-FX baseline' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-2.png',
    figureUrl: '/output/figures/colab_yin_t1_currency.png',
    footerLines: [
      'Currency conversion friction is non-linear: direct bilateral corridors settle in 41s while vehicle currency triangulation pushes median latency to 189s-454s.',
      'Regional multi-currency PvP netting arrangements can eliminate intermediate USD/EUR vehicle legs on high-frequency trade corridors.',
    ],
  },
  {
    pageNum: 3,
    featureGroup: 'Group 3 · Network Topology',
    title: 'Network Corridor Topology & Direct Routing Invariance',
    pillar: 'Pillar 2: Network Architecture & Routing',
    cellRef: 'Colab Cell 21 · Topic 1: Corridor Hops & Hub Centrality',
    formulaExpr: 'TRANSACTION_TYPE_CODE = Direct <=> PARTICIPANT_COUNT == 2 (100.00% invariant across 6.32M tx)',
    baselineComparison: 'Baseline: Direct Bilateral (N=2, 63.12%, 39.0s) vs. Correspondent Multi-Hop (N>=3, 36.88%)',
    ruleLines: [
      'Direct settlement is mathematically equivalent to exactly two participating institutions (63.12% of traffic, zero exceptions across 10M records).',
      'Intermediary corridors (Indirect 32.67%, Covered 4.14%) concentrate 81.4% of hops through four hubs: US30 (New York), GB20 (London), DEF0 (Frankfurt), CHZ0 (Zurich).',
    ],
    kpis: [
      { value: '63.12%', label: 'Direct Routing Share', sub: 'Strictly N = 2.0 institutions' },
      { value: '32.67%', label: 'Indirect Multi-Hop', sub: 'Serial MT103 across 3 to 14 hops' },
      { value: '81.4%', label: 'Hub Oligopoly Share', sub: 'US30, GB20, DEF0, CHZ0 hubs' },
      { value: '39.0s', label: 'Direct STP Baseline', sub: 'Zero intermediary handoff delay' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-3.png',
    figureUrl: '/output/figures/colab_evan_t1_topology.png',
    footerLines: [
      'Two-thirds of global flows clear via direct Nostro/Vostro RMA links; the remaining third routes through an oligopoly of four Western correspondent hubs.',
      'Establishing direct regional RMA links bypasses correspondent toll-gates and reduces systemic concentration exposure.',
    ],
  },
  {
    pageNum: 4,
    featureGroup: 'Group 4 · Settlement Latency',
    title: 'Multi-Hop Latency Scaling & Geographic Falsification',
    pillar: 'Pillar 2: Network Architecture & Routing',
    cellRef: 'Colab Cell 23 · Topic 2: Additive Queueing Decomposition',
    formulaExpr: 'Median_Duration(s) = 39.0 + Beta_hop(N - 2) + 148.0 * I(FX >= 2) | Distance r = 0.018 (p = 0.34)',
    baselineComparison: 'Baseline: 2 Hops (39s) -> 3 Hops (100s) -> 4 Hops (413s) -> 5 Hops (582s) -> 6 Hops (823s)',
    ruleLines: [
      'Settlement delay is an additive function of institutional handoffs (+61s at 3 hops, +374s at 4 hops, +543s at 5 hops) and multi-FX queuing (+148s).',
      'Great-circle physical distance between capital cities has zero causal effect (r = 0.018, p = 0.34), falsifying HYP-NEG-01.',
    ],
    kpis: [
      { value: '39.0s', label: '2-Hop Direct Base', sub: 'Zero correspondent queue delay' },
      { value: '413.0s', label: '4-Hop Indirect Median', sub: '+374s over direct STP baseline' },
      { value: 'r = 0.018', label: 'Distance Correlation', sub: 'p = 0.34 (Falsified negative result)' },
      { value: '+148.0s', label: 'FX Batch Queueing', sub: 'Triggered when FX conversions >= 2' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-4.png',
    figureUrl: '/output/figures/colab_evan_t2_latency.png',
    footerLines: [
      'Latency is governed by institutional compliance screening and balance-sheet cutoff windows at intermediary banks, not physical fiber transit.',
      'End-to-end Straight-Through Processing (STP) automation at correspondent nodes is the sole operational lever for reducing settlement duration.',
    ],
  },
  {
    pageNum: 5,
    featureGroup: 'Group 2 · Temporal Rhythm',
    title: 'Temporal Settlement Rhythms & 24-Hour Diurnal Windows',
    pillar: 'Pillar 2: Network Architecture & Routing',
    cellRef: 'Colab Cell 25 · Topic 3: Weekday & UTC Diurnal Cycles',
    formulaExpr: 'Weekday Share = 85.2%–88.8% | Weekend Contraction = -69.5% | Nocturnal Batch Peak = 23:00–01:00 UTC',
    baselineComparison: 'Baseline: Friday/Monday Peak (18.34% each) vs. Weekend Lull (5.59% Sunday) & 11:00 UTC Trough',
    ruleLines: [
      'Institutional clearing calendars concentrate 85.2%-88.8% of payment volume on Monday-Friday, with Friday and Monday peaking at ~18.34% each.',
      'Diurnal UTC volume spikes sharply at 23:00-01:00 UTC (620k tx/hr) during Asia market open / US EOD batch release, dipping to a trough at 11:00-12:00 UTC.',
    ],
    kpis: [
      { value: '88.82%', label: 'Weekday Concentration', sub: 'Mon-Fri institutional clearing' },
      { value: '18.34%', label: 'Peak Day Share', sub: '1.83M tx on Monday & Friday' },
      { value: '-69.5%', label: 'Weekend Drop', sub: 'Interbank RTGS clearing closure' },
      { value: '23:00 UTC', label: 'Diurnal Peak Hour', sub: '620k tx/hr nocturnal batch surge' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-5.png',
    figureUrl: '/output/figures/colab_evan_t3_temporal.png',
    footerLines: [
      'Intraday liquidity pressure is tightly synchronized around weekday opening windows and the 23:00-01:00 UTC batch release window.',
      'Automated Liquidity-Saving Mechanisms (LSMs) should pre-allocate peak collateral buffers between 22:00 and 02:00 UTC.',
    ],
  },
  {
    pageNum: 6,
    featureGroup: 'Group 5 · Routing Modality',
    title: 'Payment Modality Segmentation & Covered Liquidity Thresholds',
    pillar: 'Pillar 3: Financial & Modality Architecture',
    cellRef: 'Colab Cell 32 · Topic 3: MT103 vs MT202 COV Mechanics',
    formulaExpr: 'Covered => Hops >= 3 (0% Direct) & Median_Covered ($4,516.92) = 1.248 * Median_Direct ($3,618.95)',
    baselineComparison: 'Baseline: Direct ($3,618.95, 39s) vs. Indirect ($3,631.98, 281s) vs. Covered ($4,516.92, 383s)',
    ruleLines: [
      'Covered routing (MT103 customer leg + MT202 COV liquidity leg) accounts for 4.14% of volume and is strictly forbidden on direct 2-hop corridors.',
      'Covered instructions carry a statistically significant +24.8% ticket size premium (p < 1e-15) and are nearly absent in pure C2C retail flows (HYP-NEG-03).',
    ],
    kpis: [
      { value: '4.14%', label: 'Covered Modality Share', sub: '10,356 sample / 416k full tx' },
      { value: '$4,516.92', label: 'Covered Median Ticket', sub: 'Mean: $94,231.10 (vs $77,458 Direct)' },
      { value: '+24.8%', label: 'Covered Value Premium', sub: 'Justifies dual MT103+MT202COV cost' },
      { value: '3.59', label: 'Avg Participant Hops', sub: 'Strictly >= 3 institutions required' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-6.png',
    figureUrl: '/output/figures/colab_yin_t3_settlement.png',
    footerLines: [
      'Asynchronous reconciliation between MT103 customer messages and MT202 COV cover funds introduces substantial settlement latency.',
      'Migrating bilateral covered corridors toward ISO 20022 synchronized Payment-versus-Payment (PvP) engines removes reconciliation lag.',
    ],
  },
  {
    pageNum: 7,
    featureGroup: 'Group 7 · Token & Observability',
    title: 'Route Observability Blind Spots & Semantic Token Gating',
    pillar: 'Pillar 1: Observability & Fraud Signatures',
    cellRef: 'Colab Cell 15 · Topic 2: Continuity Flag & Token Integrity',
    formulaExpr: 'P(<business:> | ORDERING_TYPE = C) = 0.0000 | P(<business:> | B) = 0.8520 | Numeric Risk = +50.8%',
    baselineComparison: 'Baseline: Verified Continuity Y (54.0s med, 0.063% risk) vs. Masked N (155.0s med) & Numeric (+50.8%)',
    ruleLines: [
      'Corporate semantic gating is absolute: 0.00% of Consumer accounts contain <business:> tokens, whereas 85.22% of Business accounts emit them.',
      'Masked continuity paths (CONTINUITY_QFLAG = N) experience a 2.87x overall latency surge (155s vs 54s), while direct N paths match Y at 39.0s (HYP-NEG-04).',
    ],
    kpis: [
      { value: '0.00%', label: 'Consumer Biz-Token Leak', sub: '53,330 Consumer rows strictly 0%' },
      { value: '85.22%', label: 'Business Token Rate', sub: '43.12% IBAN + 42.10% Non-IBAN' },
      { value: '2.87x', label: 'Blind Spot Latency', sub: '155.0s median vs 54.0s verified' },
      { value: '+50.8%', label: 'Numeric Token Risk', sub: '0.095% anomaly rate vs 0.063% base' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-7.png',
    figureUrl: '/output/figures/colab_joy_t2_observability.png',
    footerLines: [
      'Discontinuous paths and legacy numeric-only account tokens signal observability gaps and elevated operational error rates.',
      'Enforcing mandatory Swift gpi end-to-end UETR tracking on numeric-token corridors suppresses blind-spot settlement delays.',
    ],
  },
  {
    pageNum: 8,
    featureGroup: 'Group 8 · Anomaly Signatures',
    title: 'Synthetic Anomaly Census & Deterministic Fraud Conditioning',
    pillar: 'Pillar 1: Observability & Fraud Signatures',
    cellRef: 'Colab Cell 17 · Topic 3: 7,006 Anomaly Census',
    formulaExpr: 'P(Consumer | Romance) = 1.000 | P(Business | CEO) = 1.000 | FatFinger = Base * 10^k (up to $15.66B)',
    baselineComparison: 'Baseline: Normal ($3,619 med, 769s avg) vs. Romance ($109.5, 1,558s) & CEO Scam ($20,602, 1,179s)',
    ruleLines: [
      'Exhaustive full-dataset audit isolated exactly 7,006 anomalies across 10,000,000 records (0.0701%): Romance (2,476), Fat Finger (1,940), CEO (945), Duplicate (679), Acct Repl (649), Recall (317).',
      'Fraud typologies obey strict entity priors (Romance = 100% Consumer; CEO = 100% Business) and inject +400s to +800s AML investigation delays.',
    ],
    kpis: [
      { value: '7,006', label: 'Exact Anomaly Census', sub: '0.0701% of 10M (0 sampling loss)' },
      { value: '100.0%', label: 'Entity Prior Purity', sub: 'Romance=Consumer | CEO=Business' },
      { value: '1,557.9s', label: 'Romance Scam Hold', sub: '+788.5s over normal 769.4s mean' },
      { value: '$15.66B', label: 'Fat-Finger Peak', sub: '10^k decimal shift outlier max' },
    ],
    imageUrl: '/output/dashboards/pages/dashboard_page-8.png',
    figureUrl: '/output/figures/colab_joy_t3_anomalies.png',
    footerLines: [
      'Entity-conditioned Bayesian priors achieve zero-leakage separation between retail social engineering and corporate BEC fraud.',
      'Pre-clearing mantissa validation rules instantly trap 10x/100x fat-finger errors before RTGS liquidity reservation.',
    ],
  },
];

export interface SlideInfo {
  slideNum: number;
  category: string;
  title: string;
  speaker: string;
  layoutType:
    | 'title'
    | 'architecture'
    | 'methodology'
    | 'hypotheses'
    | 'data_audit'
    | 'feature'
    | 'twin'
    | 'recommendations';
  formulaHeader?: string;
  formulaExpr?: string;
  formulaDesc?: string;
  evidenceBullets?: string[];
  economicRationale?: string;
  figureUrl?: string;
  figureCaption?: string;
  imageUrl: string;
  script: string;
  judgeQuestion: string;
  judgeDefense: string;
}

const SLIDE_METADATA: Array<Omit<SlideInfo, 'script' | 'judgeQuestion' | 'judgeDefense' | 'imageUrl'>> = [
  {
    slideNum: 1,
    category: 'Competition Mandate · UMDAC Datathon 2026',
    title: 'Reverse-Engineering the Swift Synthetic Payment Graph',
    speaker: 'Evan Lim (Lead) · Lim Zhi Yin · Joy',
    layoutType: 'title',
    formulaHeader: 'Core Achievement',
    formulaExpr: '10,000,000 Transactions · 8 Feature Groups · Causal DAG + Executable Generative Twin (<10% Error)',
    formulaDesc:
      'Complete reconstruction of closed-form parametric distributions, correspondent topology invariants, and deterministic anomaly signatures.',
    evidenceBullets: [
      'Insight Quality (45%): Closed-form MLE laws + 4 confirmed hypotheses + 4 falsified negatives',
      'Evidence & Integrity (23%): 100% 10M-row DuckDB Parquet audit + zero-leakage anomaly census (7,006)',
      'Communication & Economics (32%): Standalone 8-page M3 dashboard + banking liquidity prescriptions',
    ],
  },
  {
    slideNum: 2,
    category: 'Executive Summary · Tripartite Architecture',
    title: 'Tripartite Collaborative Architecture Across 3 Banking Pillars',
    speaker: 'All Team Members',
    layoutType: 'architecture',
    formulaHeader: 'Architectural Division',
    formulaExpr: 'Pillar 1 (Observability & Fraud) + Pillar 2 (Topology & Latency) + Pillar 3 (Valuation & FX)',
    formulaDesc:
      'Sub-0.4s vectorized DuckDB queries streaming ZSTD Parquet directly into CPU cache across all 10M rows.',
    evidenceBullets: [
      'Pillar 1 (Joy): Macro Ecosystem, Semantic Token Gating (G7), 7,006 Anomaly Census (G8)',
      'Pillar 2 (Evan Lim): Direct Routing Invariance (G3), Additive Latency (G4), Diurnal Rhythm (G2)',
      'Pillar 3 (Lim Zhi Yin): Log-Normal Ladder (G1), Covered Modality (G5), FX Triangulation (G6)',
    ],
  },
  {
    slideNum: 3,
    category: 'Methodology · Rubric 3.3 Justified Simplicity',
    title: 'Vectorized DuckDB Pipeline & Closed-Form Parametric Inference',
    speaker: 'Evan Lim (Infrastructure)',
    layoutType: 'methodology',
    formulaHeader: '4-Stage Scientific Pipeline',
    formulaExpr: '4.72 GB Raw CSV -> 1.2 GB ZSTD Parquet -> 100% Anomaly Table (7,006) -> Closed-Form MLE',
    formulaDesc:
      'Prioritizes interpretable closed-form statistical inference and causal DAG decomposition over opaque black-box models.',
    evidenceBullets: [
      'Stage 1: RFC 4180 multiline quote parsing via DuckDB with zero row loss across 10,000,000 records',
      'Stage 2: Full-census isolation of all 7,006 anomalies (no downsampling of rare fraud typologies)',
      'Stage 3: Deterministic hash sample (250k) for rapid exploratory slicing + full 10M aggregations',
      'Stage 4: Confounder-controlled parametric fitting & Generative Twin causal closure verification',
    ],
  },
  {
    slideNum: 4,
    category: 'Scientific Rigor · Rubric 1.3 Negative Results',
    title: 'Structured Hypothesis Ledger: Confirmed Laws vs. Falsified Negatives',
    speaker: 'Evan Lim (Falsification)',
    layoutType: 'hypotheses',
    formulaHeader: 'Causal Falsification Standard',
    formulaExpr: '4 Confirmed Generative Laws (HYP-01..04) | 4 Empirically Rejected Hypotheses (HYP-NEG-01..04)',
    formulaDesc:
      'Explicitly separates genuine causal mechanisms from spurious correlations using ANOVA, Mann-Whitney U, and distance tests.',
  },
  {
    slideNum: 5,
    category: 'Data Engineering · Rubric 3.1 Audit Log',
    title: 'Data Integrity, Issues Log & Sensitivity Controls (ISS-01 to ISS-05)',
    speaker: 'Joy (Data Engineering)',
    layoutType: 'data_audit',
    formulaHeader: 'Zero-Loss Ingestion Guarantee',
    formulaExpr: '10,000,000 / 10,000,000 Records Verified Intact | 5 Structural Data Anomalies Resolved',
    formulaDesc:
      'Documented resolution of multiline CSV breaks, disclaimer artifacts, masked hops, fat-finger skew, and zero-duration log singularities.',
  },
  {
    slideNum: 6,
    category: 'Feature Group 1 · Valuation Dynamics',
    title: 'Valuation Dynamics & The Log-Normal +2.0 Ladder Law',
    speaker: 'Lim Zhi Yin (Pillar 3)',
    layoutType: 'feature',
    formulaHeader: 'Reconstructed Valuation Law (G1)',
    formulaExpr: 'ln(USD_AMOUNT) ~ N(mu_tier, sigma = 2.29) | Step Multiplier = exp(2.0) = 7.39x',
    formulaDesc:
      'C->C (mu=6.05, med $454) -> B->C / C->B (mu=8.0, med $3,122 / $3,255) -> B->B (mu=9.99, med $22,732).',
    evidenceBullets: [
      'B2B invoices are 22.71% of volume yet capture 72.54% of total liquidity ($705.14B of $972.04B).',
      'B2B median ($22,732) is 50.0x larger than C2C remittances ($454.47).',
      'Confounder check: +2.0 log-shift holds identically inside USD, EUR, GBP, and CNY.',
    ],
    economicRationale:
      'Reflects real-world corporate treasury invoice tiers vs. retail payroll/remittance sizes; RTGS buffers must track B2B hours.',
    figureUrl: '/output/figures/fig_entity_amount_distribution.png',
    figureCaption: 'Figure G1: Reverse-Engineered Log-Normal Densities Across Entity Tiers (sigma = 2.29)',
  },
  {
    slideNum: 7,
    category: 'Feature Group 2 · Temporal Rhythm',
    title: 'Weekly Clearing Calendars & 24-Hour Nocturnal Batch Windows',
    speaker: 'Evan Lim (Pillar 2)',
    layoutType: 'feature',
    formulaHeader: 'Temporal Generation Law (G2)',
    formulaExpr: 'Weekdays = 88.82% (Mon/Fri Peak 18.34%) | Weekend Drop = -69.5% | Diurnal Peak = 23:00–01:00 UTC',
    formulaDesc:
      'Automated institutional batch releases align with Asia-Pacific market open (08:00 JST/SGT) and US end-of-day cutoffs.',
    evidenceBullets: [
      'Monday and Friday tie as peak trading days (18.34% each, 1.83M payments per day).',
      'Saturday & Sunday collapse to 5.59%-9.3% due to global RTGS interbank clearing closures.',
      '23:00 UTC peak hits ~620k tx/hour; diurnal trough occurs at 11:00-12:00 UTC.',
    ],
    economicRationale:
      'Intraday liquidity stress peaks during overlapping Asian opening and Western EOD batch settlement windows.',
    figureUrl: '/output/figures/fig_g2_temporal.png',
    figureCaption: 'Figure G2: Day-of-Week Concentration & 24-Hour UTC Diurnal Volume Distribution',
  },
  {
    slideNum: 8,
    category: 'Feature Group 3 · Network Topology',
    title: 'Correspondent Corridor Topology & Direct Routing Invariance',
    speaker: 'Evan Lim (Pillar 2)',
    layoutType: 'feature',
    formulaHeader: 'Topological Invariance Law (G3)',
    formulaExpr: 'TRANSACTION_TYPE_CODE = Direct <=> PARTICIPANT_COUNT == 2.0 (100.00% Invariant)',
    formulaDesc:
      'When bilateral Nostro/Vostro RMA links exist (63.12% of traffic), settlement requires strictly 2 institutions.',
    evidenceBullets: [
      '6,323,283 Direct payments settle with N=2 institutions; 32.67% Indirect & 4.14% Covered require N >= 3.',
      '81.4% of intermediary clearing hops pass through 4 hubs: US30 (NY), GB20 (London), DEF0 (Frankfurt), CHZ0 (Zurich).',
      'Tail multi-jurisdictional corridors reach up to 14-22 intermediary hops.',
    ],
    economicRationale:
      'Demonstrates correspondent banking hub-and-spoke concentration where emerging corridors rely on Tier-1 USD/EUR clearers.',
    figureUrl: '/output/figures/fig_g3_topology.png',
    figureCaption: 'Figure G3: Participant Hop Count Stratification by Routing Modality',
  },
  {
    slideNum: 9,
    category: 'Feature Group 4 · Settlement Velocity',
    title: 'Additive Multi-Hop Latency Scaling & Distance Falsification',
    speaker: 'Evan Lim (Pillar 2)',
    layoutType: 'feature',
    formulaHeader: 'Additive Latency Law (G4)',
    formulaExpr: 'Duration(s) = 39.0 + Beta_hop * (Hops - 2) + 148.0 * I(FX >= 2) + Exp(150)',
    formulaDesc:
      'Direct baseline is 39.0s; 3 hops = 100s (+61s), 4 hops = 413s (+374s), 5 hops = 582s, 6 hops = 823s.',
    evidenceBullets: [
      'Great-circle physical distance correlation is r = 0.018 (p = 0.34) — physical distance has ZERO effect.',
      'US-to-UK Direct (5,500 km) clears in 39s vs. France-to-Germany 4-hop Indirect (800 km) at 1,046s.',
      'Multi-currency triangulation (>=2 FX) adds an independent +148s batch delay.',
    ],
    economicRationale:
      'Telecom fiber speed is instantaneous; clearing delays stem solely from compliance checks and batch cutoffs at intermediary banks.',
    figureUrl: '/output/figures/fig_duration_waterfall.png',
    figureCaption: 'Figure G4: Additive Latency Decomposition Waterfall (STP vs. Hop & FX Penalties)',
  },
  {
    slideNum: 10,
    category: 'Feature Group 5 · Routing Modality',
    title: 'Covered Payment Mechanics & Institutional Value Premium',
    speaker: 'Lim Zhi Yin & Joy',
    layoutType: 'feature',
    formulaHeader: 'Covered Trigger Constraint (G5)',
    formulaExpr: 'Covered => Hops >= 3 & Median_Covered ($4,516.92) = 1.248 * Median_Direct ($3,618.95)',
    formulaDesc:
      'Split-messaging (MT103 customer leg + MT202 COV liquidity cover) is structurally banned on 2-hop direct routes.',
    evidenceBullets: [
      'Covered payments represent 4.14% of volume (avg 3.59 hops, mean ticket $94,231 vs $77,458 Direct).',
      '+24.8% ticket size premium (Mann-Whitney p < 1e-15) compensates dual MT103+MT202 COV messaging fees.',
      'Virtually absent in C2C retail corridors (HYP-NEG-03 rejected) — strictly wholesale banking.',
    ],
    economicRationale:
      'Dual-message asynchronous cover settlement requires higher nominal values to justify liquidity reservation overhead.',
    figureUrl: '/output/figures/fig_g5_modality.png',
    figureCaption: 'Figure G5: Modality Share, Ticket Size Premium & Execution Latency Comparison',
  },
  {
    slideNum: 11,
    category: 'Feature Group 6 · Foreign Exchange',
    title: 'Reserve Currency Duopoly & Vehicle Triangulation Mechanics',
    speaker: 'Lim Zhi Yin (Pillar 3)',
    layoutType: 'feature',
    formulaHeader: 'FX Corridor Rule (G6)',
    formulaExpr: '0 FX (10.9%, 47s) | 1 FX (58.7%, 41s) | >=2 Vehicle FX (30.4%, 189s-454s) | Amount F=0.82',
    formulaDesc:
      'EUR (32.1%) and USD (17.2%) dominate global volume; exotic corridors triangulate through reserve vehicle pairs.',
    evidenceBullets: [
      'EUR + USD account for 59.46% of total settled value ($577.98B across 56 unique ISO currencies).',
      '30.4% of transactions require >=2 FX steps, driving median duration from 41s to 189s-454s.',
      'ANOVA confirms FX count is independent of USD_AMOUNT (F = 0.82, p = 0.58; HYP-NEG-02 rejected).',
    ],
    economicRationale:
      'Thin bilateral liquidity forces emerging-market currency pairs to cross through USD or EUR clearing books.',
    figureUrl: '/output/figures/fig_g6_fx.png',
    figureCaption: 'Figure G6: Currency Conversion Step Frequency & Median Latency Escalation',
  },
  {
    slideNum: 12,
    category: 'Feature Group 7 · Token & Observability',
    title: 'Semantic Token Gating & Route Observability Blind Spots',
    speaker: 'Joy (Pillar 1)',
    layoutType: 'feature',
    formulaHeader: 'Corporate Token Gate Law (G7)',
    formulaExpr: 'P(<business:> | Consumer) = 0.0000 | P(<business:> | Business) = 0.8522 | Masked Risk = 2.87x',
    formulaDesc:
      'Absolute zero-leakage token rule combined with geographic IBAN masking across SEPA vs. US/APAC corridors.',
    evidenceBullets: [
      'Consumer wires contain 0.00% <business:> tokens across all 53,330 Consumer sample rows.',
      'Discontinuous paths (CONTINUITY_QFLAG = N) suffer 2.87x overall median latency surge (155s vs 54s).',
      'Numeric-only legacy account tokens show +50.8% elevated anomaly rate (0.095% vs 0.063% baseline).',
    ],
    economicRationale:
      'Legacy non-IBAN numeric schemas and unmonitored intermediary hops create Swift gpi visibility blind spots.',
    figureUrl: '/output/figures/fig_g7_tokens.png',
    figureCaption: 'Figure G7: Business Token Gating & IBAN Geographic Masking Breakdown',
  },
  {
    slideNum: 13,
    category: 'Feature Group 8 · Fraud & Anomalies',
    title: 'Exact 7,006 Anomaly Census & Deterministic Conditioning',
    speaker: 'Joy (Pillar 1)',
    layoutType: 'feature',
    formulaHeader: 'Deterministic Fraud Priors (G8)',
    formulaExpr: '7,006 Anomalies (0.0701%) | P(C | Romance) = 1.00 | P(B | CEO) = 1.00 | FatFinger = x10^k',
    formulaDesc:
      'Six distinct synthetic injection signatures isolated with zero sampling variance across the 10M-row dataset.',
    evidenceBullets: [
      'Romance Scam (2,476): 100% Consumer-originated, $109.5 median, 1,557.9s mean AML investigation hold.',
      'CEO Scam (945): 100% Business-originated, $20,602 median, $88.4M max, 1,178.9s hold.',
      'Fat-Finger (1,940): 10^k decimal shifts up to $15.66B; Duplicate (679): exact hash replay in 30-450s.',
    ],
    economicRationale:
      'Entity-conditioned Bayesian priors suppress false positives on B2B wires while trapping retail social engineering.',
    figureUrl: '/output/figures/fig_anomaly_comparisons.png',
    figureCaption: 'Figure G8: Fraud Investigation Hold Duration & Log-Scale Ticket Size Distortion',
  },
  {
    slideNum: 14,
    category: 'Causal Closure · Generative Twin Verification',
    title: 'Executable Swift Generative Twin Validation (<10% Error)',
    speaker: 'All Team Members',
    layoutType: 'twin',
    formulaHeader: 'Causal Closure Proof',
    formulaExpr: '10,000 Synthetic Payments vs. 250k Empirical Sample | Median Error: C->C 1.3%, B->C 0.5%, B->B 7.2%',
    formulaDesc:
      'Operationalizes all 8 reconstructed feature laws into a live, seeded synthetic payment generator running directly in-app.',
    evidenceBullets: [
      'Reproduces exact +2.0 Log-Normal tier medians, 63.1% Direct invariance, and +148s FX delays.',
      'Truncating $15.66B fat-finger outliers lowers B->B empirical vs. simulated error below 2%.',
      'Live interactive simulator available in the Generative Twin workspace tab for real-time judge testing.',
    ],
    figureUrl: '/output/figures/fig_twin_validation.png',
    figureCaption: 'Empirical Ground Truth vs. Swift Generative Twin Benchmark',
  },
  {
    slideNum: 15,
    category: 'Conclusion · Strategic Impact & Defense',
    title: 'Strategic Banking Prescriptions & Judge Defense Matrix',
    speaker: 'All Team Members',
    layoutType: 'recommendations',
    formulaHeader: 'Three Actionable Prescriptions for Swift & Financial Institutions',
    formulaExpr: '1. B2B Intraday RTGS Scaling  ·  2. Mandatory gpi UETR Tracking  ·  3. Regional PvP Netting',
    formulaDesc:
      'Directly translates reverse-engineered laws into liquidity efficiency, operational observability, and fraud suppression.',
  },
];

function parseSlidesFromNotes(): SlideInfo[] {
  const notesPath = path.join(REPORTS_DIR, 'oral_presentation_speaker_notes.md');
  const slideFiles = fs.existsSync(SLIDES_PAGES_DIR)
    ? fs.readdirSync(SLIDES_PAGES_DIR).filter((f) => f.endsWith('.png')).sort()
    : [];

  const parsedMap = new Map<number, { script: string; judgeQuestion: string; judgeDefense: string }>();

  if (fs.existsSync(notesPath)) {
    const raw = fs.readFileSync(notesPath, 'utf-8');
    const sections = raw.split(/^## Slide /m).slice(1);
    sections.forEach((sec, idx) => {
      const scriptMatch = sec.match(/\*\*Spoken Script[\s\S]*?>\s*"([\s\S]*?)"/);
      const qMatch = sec.match(/\*\*Judge Question:\*\*\s*\*"([\s\S]*?)"\*/);
      const aMatch = sec.match(/\*\*Authoritative Defense:\*\*\s*\*"([\s\S]*?)"\*/);
      parsedMap.set(idx + 1, {
        script: scriptMatch ? scriptMatch[1].trim() : '',
        judgeQuestion: qMatch ? qMatch[1].trim() : '',
        judgeDefense: aMatch ? aMatch[1].trim() : '',
      });
    });
  }

  return SLIDE_METADATA.map((meta, idx) => {
    const notes = parsedMap.get(meta.slideNum) ?? { script: '', judgeQuestion: '', judgeDefense: '' };
    const file = slideFiles[idx] ?? `slide-${String(meta.slideNum).padStart(2, '0')}.png`;
    return {
      ...meta,
      imageUrl: `/output/slides/pages/${file}`,
      script: notes.script,
      judgeQuestion: notes.judgeQuestion,
      judgeDefense: notes.judgeDefense,
    };
  });
}

export interface FigureInfo {
  filename: string;
  url: string;
  group: string;
  label: string;
}

function classifyFigure(filename: string): { group: string; label: string } {
  const map: Record<string, { group: string; label: string }> = {
    'fig_g1_amount.png': { group: 'Feature Group Figures (G1-G8)', label: 'G1: Amount Distribution & Log-Normal Fit' },
    'fig_g2_temporal.png': { group: 'Feature Group Figures (G1-G8)', label: 'G2: Weekly & Diurnal Temporal Rhythm' },
    'fig_g3_topology.png': { group: 'Feature Group Figures (G1-G8)', label: 'G3: Network Topology & Participant Hops' },
    'fig_g4_latency.png': { group: 'Feature Group Figures (G1-G8)', label: 'G4: Settlement Latency Decomposition' },
    'fig_g5_modality.png': { group: 'Feature Group Figures (G1-G8)', label: 'G5: Routing Modality & Covered Premium' },
    'fig_g6_fx.png': { group: 'Feature Group Figures (G1-G8)', label: 'G6: Foreign Exchange Conversion Hops' },
    'fig_g7_tokens.png': { group: 'Feature Group Figures (G1-G8)', label: 'G7: Token Semantics & IBAN Masking' },
    'fig_g8_anomalies.png': { group: 'Feature Group Figures (G1-G8)', label: 'G8: Anomaly Typologies & Signatures' },
    'fig_entity_amount_distribution.png': { group: 'Report Synthesis Figures', label: 'KDE Log-Normal Amount Ladder (+2.0 Steps)' },
    'fig_duration_waterfall.png': { group: 'Report Synthesis Figures', label: 'Additive Settlement Latency Waterfall' },
    'fig_anomaly_comparisons.png': { group: 'Report Synthesis Figures', label: 'Anomaly Duration & Ticket Distortion' },
    'fig_twin_validation.png': { group: 'Report Synthesis Figures', label: 'Generative Twin Empirical Validation' },
    'colab_yin_t1_currency.png': { group: 'Colab Pillar Evidence', label: 'Pillar 3 (Zhi Yin): Currency Dominance & FX' },
    'colab_yin_t2_entities.png': { group: 'Colab Pillar Evidence', label: 'Pillar 3 (Zhi Yin): Entity Pair Valuation' },
    'colab_yin_t3_settlement.png': { group: 'Colab Pillar Evidence', label: 'Pillar 3 (Zhi Yin): Modality Settlement Mechanics' },
    'colab_evan_t1_topology.png': { group: 'Colab Pillar Evidence', label: 'Pillar 2 (Evan): Corridor Topology & Hubs' },
    'colab_evan_t2_latency.png': { group: 'Colab Pillar Evidence', label: 'Pillar 2 (Evan): Latency Scaling & Distance Rejection' },
    'colab_evan_t3_temporal.png': { group: 'Colab Pillar Evidence', label: 'Pillar 2 (Evan): Diurnal & Weekday Clearing Windows' },
    'colab_joy_t1_modality.png': { group: 'Colab Pillar Evidence', label: 'Pillar 1 (Joy): Macro Modality Ecosystem' },
    'colab_joy_t2_observability.png': { group: 'Colab Pillar Evidence', label: 'Pillar 1 (Joy): Route Observability & Token Integrity' },
    'colab_joy_t3_anomalies.png': { group: 'Colab Pillar Evidence', label: 'Pillar 1 (Joy): Anomaly Census & Conditioning' },
  };
  return map[filename] ?? { group: 'Additional Figures', label: filename };
}

export function loadOverviewPayload(options?: { staticExport?: boolean }) {
  const staticExport = options?.staticExport ?? false;
  const tables = {
    g1Amount: parseCsv(path.join(TABLES_DIR, 'g1_amount_stats.csv')),
    g3Topology: parseCsv(path.join(TABLES_DIR, 'g3_topology_stats.csv')),
    g4Duration: parseCsv(path.join(TABLES_DIR, 'g4_duration_decomposition.csv')),
    g5Modality: parseCsv(path.join(TABLES_DIR, 'g5_modality_stats.csv')),
    g6Fx: parseCsv(path.join(TABLES_DIR, 'g6_fx_stats.csv')),
    g7Tokens: parseCsv(path.join(TABLES_DIR, 'g7_token_stats.csv')),
  };

  const figureFiles = fs.existsSync(FIGURES_DIR)
    ? fs.readdirSync(FIGURES_DIR).filter((f) => f.endsWith('.png')).sort()
    : [];

  const figures: FigureInfo[] = figureFiles.map((filename) => {
    const meta = classifyFigure(filename);
    return {
      filename,
      url: `/output/figures/${filename}`,
      group: meta.group,
      label: meta.label,
    };
  });

  const readReport = (name: string) => {
    const p = path.join(REPORTS_DIR, name);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
  };

  return {
    datasetSummary: {
      totalRecords: 10000000,
      sampleSize: 250000,
      totalTurnOverUsdBillions: 972.04,
      totalAnomalies: 7006,
      anomalyRatePct: 0.0701,
      uniqueCurrencies: 56,
      directSharePct: 63.12,
      indirectSharePct: 32.67,
      coveredSharePct: 4.14,
      continuousPct: 87.6,
      discontinuousPct: 12.4,
    },
    tables,
    anomalyCensus: ANOMALY_CENSUS,
    dashboardPages: DASHBOARD_PAGES,
    slides: parseSlidesFromNotes(),
    figures,
    reports: {
      rulesCatalog: readReport('reconstructed_rules_catalog.md'),
      hypothesisLedger: readReport('hypothesis_ledger.md'),
      dataIssuesLog: readReport('data_issues_log.md'),
    },
    pdfs: {
      dashboardPdf: '/output/dashboards/swift_payments_reconstructed_dashboard.pdf',
      slidesPdf: '/output/slides/swift_presentation_slides.pdf',
      technicalReportPdf: '/output/master_technical_report.pdf',
      revisedDashboardPdf: staticExport
        ? '/output/dashboards/swift_dashboard_m3_revised.pdf'
        : '/api/export/dashboard.pdf',
      revisedSlidesPdf: staticExport
        ? '/output/slides/swift_slides_m3_revised.pdf'
        : '/api/export/slides.pdf',
    },
  };
}
