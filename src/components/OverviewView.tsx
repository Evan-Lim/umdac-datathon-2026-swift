import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { OverviewPayload } from '../types';
import { CausalDagSvg } from './CausalDagSvg';

interface OverviewViewProps {
  overview: OverviewPayload;
  onNavigate: (tab: 'dashboards' | 'slides' | 'twin' | 'explorer') => void;
}

const RUBRIC_MATRIX = [
  {
    criterion: 'Insight Quality',
    weight: '45%',
    coverage: 'Closed-form MLE laws across G1-G8, 4 confirmed laws, 4 falsified negative hypotheses, confounder controls.',
  },
  {
    criterion: 'Evidence, Method & Data Integrity',
    weight: '23%',
    coverage: 'Full 10M-row ZSTD Parquet ingestion (0 row loss), 7,006 anomaly census, ISS-01..05 audit log.',
  },
  {
    criterion: 'Communication & Visual Clarity',
    weight: '20%',
    coverage: '8-page angular M3 dashboard + 15-slide presentation deck with explicit empirical baselines and spoken defense.',
  },
  {
    criterion: 'Interpretation & Economic Reasoning',
    weight: '12%',
    coverage: 'MT103/MT202 COV liquidity mechanics, Nostro/Vostro RMA routing, RTGS & PvP policy prescriptions.',
  },
];

const TRIPARTITE_PILLARS = [
  {
    code: 'PILLAR 01',
    lead: 'Joy',
    title: 'Observability, Tokens & Fraud Signatures',
    groups: 'Groups 5, 7, 8',
    findings: [
      'Consumer wires emit 0.00% <business:> tokens across 53,330 sample records.',
      'Masked continuity paths (N) surge median latency 2.87x (155s vs 54s); numeric tokens carry +50.8% risk.',
      'All 7,006 anomalies isolated: Romance (100% C), CEO (100% B), Fat-Finger (10^k up to $15.66B).',
    ],
  },
  {
    code: 'PILLAR 02',
    lead: 'Evan Lim',
    title: 'Network Topology, Latency & Temporal Rhythm',
    groups: 'Groups 2, 3, 4',
    findings: [
      'Direct routing is 100.00% invariant with PARTICIPANT_COUNT = 2 (63.12% of volume).',
      'Four hubs (US30, GB20, DEF0, CHZ0) capture 81.4% of multi-hop intermediary flows.',
      'Distance falsified (r=0.018, p=0.34); latency scales strictly by hop count (+61s to +784s) & nocturnal 23:00 UTC batches.',
    ],
  },
  {
    code: 'PILLAR 03',
    lead: 'Lim Zhi Yin',
    title: 'Valuation Ladder, Modality & FX Mechanics',
    groups: 'Groups 1, 5, 6',
    findings: [
      'ln(USD_AMOUNT) follows N(mu, sigma=2.29) with exact +2.0 steps (7.39x multiplier per tier).',
      'B2B captures 72.54% of liquidity ($705.14B) on just 22.71% of message volume.',
      'Covered (MT202 COV) commands +24.8% ticket premium; >=2 FX triangulation adds +148s independent of ticket size.',
    ],
  },
];

const RECOMMENDATIONS = [
  {
    num: '01',
    target: 'Central Bank RTGS & Liquidity Managers',
    title: 'Schedule Intraday Credit Buffers for B2B Nocturnal Batches',
    detail:
      'Because 72.54% of settled value concentrates in B2B invoices (22.71% volume) and peaks at 23:00-01:00 UTC, intraday LSM collateral buffers must align with wholesale clearing cutoffs rather than message counts.',
  },
  {
    num: '02',
    target: 'Swift gpi & Fraud Compliance Officers',
    title: 'Enforce Mandatory UETR Telemetry & LEI Bayesian Priors',
    detail:
      'Mandate end-to-end tracking on legacy numeric-token corridors (+50.8% error risk, 2.87x blind-spot latency) and deploy entity-conditioned priors (Romance=Consumer, CEO=Business) plus 10^k mantissa traps.',
  },
  {
    num: '03',
    target: 'Correspondent Network Architects',
    title: 'Replace Bilateral Covered Chains with Regional PvP Netting',
    detail:
      'Four hubs handle 81.4% of indirect flows while covered MT103+MT202 COV coordination averages 383s. Establishing direct bilateral RMAs and regional multi-currency PvP netting cuts both hop and FX triangulation delays.',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({ overview, onNavigate }) => {
  const { datasetSummary, pdfs } = overview;

  return (
    <div className="space-y-6">
      {/* Hero Competition Executive Brief */}
      <section className="m3-surface overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="bg-[#0B2545] p-6 text-white lg:col-span-8 lg:p-8">
            <p className="font-mono text-xs font-medium tracking-wider text-[#93C5FD]">
              UMDAC DATATHON 2026 · SWIFT PAYMENT GRAPH REVERSE-ENGINEERING
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Causal Reconstruction of 10,000,000 Cross-Border Payment Instructions
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
              Complete closed-form reconstruction of the synthetic Swift generation engine across all 8
              feature groups: exact +2.0 log-normal valuation ladders, 100% direct-routing hop
              invariance, additive correspondent latency mechanics, and deterministic anomaly gating
              verified by an executable Generative Twin.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('dashboards')}
                className="inline-flex items-center gap-2 rounded-[4px] bg-[#005AC1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004494]"
              >
                Open 8-Page Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigate('slides')}
                className="inline-flex items-center gap-2 rounded-[4px] border border-slate-500 bg-transparent px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Open 15-Slide Deck
              </button>
              <a
                href={pdfs.revisedDashboardPdf}
                download
                className="inline-flex items-center gap-2 rounded-[4px] border border-[#93C5FD]/40 bg-[#1E3A8A]/40 px-3.5 py-2 text-xs font-medium text-[#D8E2FF] transition hover:bg-[#1E3A8A]"
              >
                <Download className="h-3.5 w-3.5" />
                Dashboard PDF (8p)
              </a>
              <a
                href={pdfs.revisedSlidesPdf}
                download
                className="inline-flex items-center gap-2 rounded-[4px] border border-[#93C5FD]/40 bg-[#1E3A8A]/40 px-3.5 py-2 text-xs font-medium text-[#D8E2FF] transition hover:bg-[#1E3A8A]"
              >
                <Download className="h-3.5 w-3.5" />
                Slides PDF (15p)
              </a>
            </div>
          </div>

          {/* Right Competition Metrics Column */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#DDE2EC] bg-[#F0F4F9] lg:col-span-4">
            <div className="p-5">
              <div className="text-xs font-medium text-[#475569]">Dataset Scale</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0B2545] tabular-nums">
                10,000,000
              </div>
              <div className="mt-1 text-xs text-[#475569]">4.72 GB CSV · 0 row loss</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-medium text-[#475569]">Settled Turnover</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#0B2545] tabular-nums">
                ${datasetSummary.totalTurnOverUsdBillions}B
              </div>
              <div className="mt-1 text-xs text-[#475569]">72.54% B2B liquidity</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-medium text-[#475569]">Anomaly Census</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#BA1A1A] tabular-nums">
                7,006
              </div>
              <div className="mt-1 text-xs text-[#475569]">0.0701% · 6 typologies</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-medium text-[#475569]">Twin Fidelity</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#146C2E] tabular-nums">
                &lt;10% Err
              </div>
              <div className="mt-1 text-xs text-[#475569]">Validated across 4 tiers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Causal Directed Acyclic Graph */}
      <section className="m3-surface p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0B2545]">
              Reconstructed Causal Directed Acyclic Graph (DAG)
            </h3>
            <p className="text-xs text-[#475569]">
              Structural dependency flow from exogenous counterparty, corridor, and currency roots to
              observable settlement outcomes
            </p>
          </div>
          <span className="font-mono text-xs text-[#005AC1]">
            Causal Closure Verified via SwiftGenerativeTwin
          </span>
        </div>
        <CausalDagSvg />
      </section>

      {/* Tripartite Pillar Architecture */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TRIPARTITE_PILLARS.map((pillar) => (
          <div key={pillar.code} className="m3-surface flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between border-b border-[#DDE2EC] pb-2.5 text-xs">
                <span className="font-mono font-bold text-[#005AC1]">{pillar.code}</span>
                <span className="text-[#475569]">
                  {pillar.lead} · {pillar.groups}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0B2545]">{pillar.title}</h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#334155]">
                {pillar.findings.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono font-semibold text-[#005AC1]">0{i + 1}.</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* Competitive Rubric Coverage & Strategic Prescriptions */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="m3-surface p-5 lg:col-span-6">
          <h3 className="text-base font-bold text-[#0B2545]">
            UMDAC Evaluation Rubric Coverage (100% Weight)
          </h3>
          <p className="mt-0.5 text-xs text-[#475569]">
            Direct alignment of technical evidence and deliverables to judging criteria
          </p>
          <div className="mt-4 divide-y divide-[#DDE2EC] border-t border-[#DDE2EC]">
            {RUBRIC_MATRIX.map((row) => (
              <div key={row.criterion} className="py-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#0B2545]">{row.criterion}</span>
                  <span className="font-mono text-[#005AC1]">{row.weight}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#475569]">{row.coverage}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="m3-surface p-5 lg:col-span-6">
          <h3 className="text-base font-bold text-[#0B2545]">
            Strategic Prescriptions for Swift &amp; Financial Institutions
          </h3>
          <p className="mt-0.5 text-xs text-[#475569]">
            Operational recommendations grounded in reverse-engineered network laws
          </p>
          <div className="mt-4 divide-y divide-[#DDE2EC] border-t border-[#DDE2EC]">
            {RECOMMENDATIONS.map((rec) => (
              <div key={rec.num} className="py-3">
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="font-mono font-bold text-[#005AC1]">{rec.num}</span>
                  <span className="font-semibold text-[#0B2545]">{rec.title}</span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-[#006874]">{rec.target}</div>
                <p className="mt-1 text-xs leading-relaxed text-[#475569]">{rec.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
