import React from 'react';
import { SlideInfo } from '../types';
import { CausalDagSvg } from './CausalDagSvg';

interface SlideCanvasProps {
  slide: SlideInfo;
  totalSlides: number;
  forPrint?: boolean;
}

const CONFIRMED_ROWS = [
  ['HYP-01 (G1)', 'Entity Tier Valuation', 'ln(USD) ~ N(mu, 2.29), +2.0 steps (7.39x)'],
  ['HYP-02 (G3)', 'Direct Hop Invariance', 'Direct <=> PARTICIPANT_COUNT = 2 (100%)'],
  ['HYP-03 (G5)', 'Covered Value Premium', '+24.8% higher median ($4,516 vs $3,618)'],
  ['HYP-04 (G8)', 'Fraud Entity Priors', 'P(C|Romance)=1.00, P(B|CEO)=1.00'],
];

const REJECTED_ROWS = [
  ['HYP-NEG-01', 'Geographic Distance Latency', 'REJECTED: r=0.018 (p=0.34). Distance has 0 effect.'],
  ['HYP-NEG-02', 'Ticket Size Drives FX Count', 'REJECTED: ANOVA F=0.82 (p=0.58). Purely corridor-based.'],
  ['HYP-NEG-03', 'Retail Covered Remittances', 'REJECTED: MT202 COV is strictly wholesale, 0% C2C.'],
  ['HYP-NEG-04', 'Discontinuity Slows Direct', 'REJECTED: Direct N equals Direct Y at 39.0s median.'],
];

const AUDIT_ROWS = [
  ['ISS-01', 'Embedded Multiline CSV Strings', 'DuckDB RFC 4180 quote parsing -> 0 row loss (10M intact)'],
  ['ISS-02', 'Row-1 Synthetic Disclaimer Text', 'Excluded DISCLAIMER column during ZSTD Parquet export'],
  ['ISS-03', "Discontinuous '...' Path Tokens", 'Retained CONTINUITY_QFLAG (12.4% N) as explicit feature'],
  ['ISS-04', '$15.66B Fat-Finger Outliers', 'Isolated FAT_FINGER_MISTAKE; used median & log fits'],
  ['ISS-05', 'Zero-Second Settlements', 'Modeled via log(1 + DURATION) avoiding ln(0) singularity'],
];

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  totalSlides,
  forPrint = false,
}) => {
  const frameClass = forPrint
    ? 'print-sheet h-[720px] w-[1280px] overflow-hidden'
    : 'w-full min-h-[480px] border border-[#C4C9D4] rounded-[4px] overflow-hidden';

  // Slide 1: Executive Title Slide
  if (slide.layoutType === 'title') {
    return (
      <article
        className={`flex flex-col justify-between bg-[#0B2545] text-white ${frameClass}`}
        style={forPrint ? { width: 1280, height: 720 } : undefined}
      >
        <div className="flex items-center justify-between border-b border-white/15 px-8 py-4">
          <span className="font-mono text-xs font-semibold tracking-widest text-[#93C5FD]">
            UMDAC DATATHON 2026 · SWIFT PRELIMINARY ROUND SUBMISSION
          </span>
          <span className="font-mono text-xs text-slate-300">
            SLIDE 01 / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>

        <div className="grid grid-cols-12 items-center gap-6 px-8 py-6 flex-1">
          <div className="col-span-8">
            <div className="inline-block bg-[#005AC1] px-3 py-1 font-mono text-[10.5px] font-bold tracking-wider text-white rounded-[2px]">
              CAUSAL REVERSE-ENGINEERING &amp; GENERATIVE TWIN
            </div>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-white">
              {slide.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
              {slide.formulaDesc}
            </p>
            <div className="mt-4 space-y-1.5 border-t border-white/15 pt-4 text-xs text-slate-200">
              {slide.evidenceBullets?.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-[#93C5FD]">0{i + 1}.</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-4 grid grid-cols-1 gap-2.5">
            <div className="border border-white/20 bg-white/5 p-3.5 rounded-[2px]">
              <div className="font-mono text-[10px] text-[#93C5FD]">DATASET CENSUS</div>
              <div className="mt-0.5 font-mono text-xl font-bold tabular-nums">10,000,000 TX</div>
              <div className="text-[11px] text-slate-300">4.72 GB CSV · 21 Attributes</div>
            </div>
            <div className="border border-white/20 bg-white/5 p-3.5 rounded-[2px]">
              <div className="font-mono text-[10px] text-[#93C5FD]">SETTLED TURNOVER</div>
              <div className="mt-0.5 font-mono text-xl font-bold tabular-nums">$972.04 Billion</div>
              <div className="text-[11px] text-slate-300">56 ISO Currencies · 7,006 Anomalies</div>
            </div>
            <div className="border border-white/20 bg-white/5 p-3.5 rounded-[2px]">
              <div className="font-mono text-[10px] text-[#93C5FD]">TEAM ROSTER</div>
              <div className="mt-0.5 text-xs font-semibold text-white">{slide.speaker}</div>
              <div className="text-[11px] text-slate-300">Tripartite DuckDB + Parquet Architecture</div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-white/15 bg-[#071A33] px-8 py-3 text-xs text-slate-300">
          <span>Deliverable 2 · Executive Presentation Deck</span>
          <span className="font-mono">Swift Network Architecture · Closed-Form Parametric Inference</span>
        </footer>
      </article>
    );
  }

  return (
    <article
      className={`flex flex-col justify-between bg-[#F6F8FB] text-[#111827] ${frameClass}`}
      style={forPrint ? { width: 1280, height: 720 } : undefined}
    >
      {/* Top Angular M3 Header */}
      <header className="flex items-center justify-between bg-[#0B2545] px-7 py-3 text-white">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold tracking-wider text-[#93C5FD]">
            {slide.category.toUpperCase()}
          </div>
          <h2 className="mt-0.5 truncate font-display text-lg font-bold tracking-tight text-white">
            {slide.title}
          </h2>
        </div>

        <div className="shrink-0 text-right font-mono">
          <div className="bg-[#005AC1] px-3 py-1 text-[11px] font-bold text-white rounded-[2px]">
            SLIDE {String(slide.slideNum).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </div>
          <div className="mt-1 text-[10px] text-slate-300">{slide.speaker}</div>
        </div>
      </header>

      {/* Slide Content Body */}
      <div className="flex flex-1 flex-col justify-between gap-3 px-7 py-4 overflow-hidden min-h-0">
        {slide.layoutType === 'architecture' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  code: 'PILLAR 01 · JOY',
                  title: 'Observability, Tokens & Anomalies',
                  items: [
                    'Group 5: Modality & Continuity Observability',
                    'Group 7: Corporate Token Gate (0.00% Consumer)',
                    'Group 8: Full 7,006 Anomaly Census & Signatures',
                  ],
                },
                {
                  code: 'PILLAR 02 · EVAN LIM',
                  title: 'Corridor Topology, Latency & Rhythm',
                  items: [
                    'Group 2: Weekday (88.8%) & 23:00 UTC Batches',
                    'Group 3: Direct <=> 2 Hops (100% Invariance)',
                    'Group 4: Additive Hop Latency & Distance Rejection',
                  ],
                },
                {
                  code: 'PILLAR 03 · LIM ZHI YIN',
                  title: 'Valuation Ladder, Modality & FX',
                  items: [
                    'Group 1: +2.0 Log-Normal Ladder (7.39x/tier)',
                    'Group 5: Covered MT202 COV (+24.8% Ticket)',
                    'Group 6: EUR+USD 59.5% Value & +148s FX Delay',
                  ],
                },
              ].map((p) => (
                <div key={p.code} className="bg-white border border-[#DDE2EC] rounded-[2px] p-4">
                  <div className="font-mono text-[10px] font-bold text-[#005AC1]">{p.code}</div>
                  <h3 className="mt-1 text-sm font-bold text-[#0B2545]">{p.title}</h3>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-[#334155]">
                    {p.items.map((it) => (
                      <li key={it}>· {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#DDE2EC] rounded-[2px] p-3 flex-1 flex flex-col justify-center min-h-0">
              <div className="mb-1.5 font-mono text-[10px] font-bold text-[#0B2545]">
                RECONSTRUCTED CAUSAL DIRECTED ACYCLIC GRAPH (DAG)
              </div>
              <CausalDagSvg />
            </div>
          </>
        )}

        {slide.layoutType === 'methodology' && (
          <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
            <div className="col-span-5 flex flex-col justify-between gap-3">
              <div className="bg-[#0B2545] text-white p-4 rounded-[2px]">
                <div className="font-mono text-[10px] text-[#93C5FD]">VECTORIZED INFRASTRUCTURE</div>
                <div className="mt-1 font-mono text-sm font-bold">{slide.formulaExpr}</div>
                <p className="mt-2 text-xs text-slate-200">{slide.formulaDesc}</p>
              </div>
              <div className="bg-white border border-[#DDE2EC] p-4 rounded-[2px] flex-1">
                <div className="font-mono text-[10px] font-bold text-[#005AC1]">
                  4-STAGE ANALYTICAL PIPELINE
                </div>
                <div className="mt-3 space-y-2.5 text-xs text-[#111827]">
                  {slide.evidenceBullets?.map((b, i) => (
                    <div key={i} className="border-b border-[#DDE2EC] pb-2 last:border-b-0">
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-7 bg-white border border-[#DDE2EC] p-4 rounded-[2px] flex flex-col justify-between">
              <div className="font-mono text-[10px] font-bold text-[#0B2545]">
                RUBRIC 3.3 COMPLIANCE: JUSTIFIED SIMPLICITY OVER BLACK-BOX ML
              </div>
              <div className="grid grid-cols-2 gap-3 my-auto">
                {[
                  ['0.38s', 'DuckDB ZSTD Query Time', 'Streaming 10M rows in CPU cache without RAM spill'],
                  ['100.0%', 'Anomaly Isolation Coverage', 'Zero downsampling on all 7,006 rare fraud rows'],
                  ['Closed-Form', 'MLE & Non-Parametric Tests', 'Log-Normal MLE, Mann-Whitney U, ANOVA F-tests'],
                  ['0 Row Loss', 'RFC 4180 Quote Engine', 'Preserved multiline ORDERING_DETAILS cleanly'],
                ].map(([val, lbl, sub]) => (
                  <div key={lbl} className="bg-[#F0F4F9] border border-[#DDE2EC] p-3.5 rounded-[2px]">
                    <div className="font-mono text-xl font-bold text-[#0B2545]">{val}</div>
                    <div className="mt-1 text-xs font-bold text-[#005AC1]">{lbl}</div>
                    <div className="mt-1 text-[11px] text-[#475569]">{sub}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#111827] px-3 py-2 text-[11px] text-slate-200 rounded-[2px]">
                Every statistical claim traces directly to reproducible DuckDB SQL queries and CSV outputs.
              </div>
            </div>
          </div>
        )}

        {slide.layoutType === 'hypotheses' && (
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="bg-white border border-[#DDE2EC] rounded-[2px] p-4 flex flex-col">
              <div className="border-b border-[#DDE2EC] pb-2 font-mono text-xs font-bold text-[#146C2E]">
                CONFIRMED GENERATIVE LAWS (HYP-01 TO HYP-04)
              </div>
              <div className="mt-2 divide-y divide-[#DDE2EC] flex-1">
                {CONFIRMED_ROWS.map(([id, title, rule]) => (
                  <div key={id} className="py-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#0B2545]">{id} · {title}</span>
                      <span className="font-mono text-[#146C2E]">CONFIRMED</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#334155]">{rule}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#DDE2EC] rounded-[2px] p-4 flex flex-col">
              <div className="border-b border-[#DDE2EC] pb-2 font-mono text-xs font-bold text-[#BA1A1A]">
                TESTED &amp; FALSIFIED NEGATIVE RESULTS (HYP-NEG-01 TO 04)
              </div>
              <div className="mt-2 divide-y divide-[#DDE2EC] flex-1">
                {REJECTED_ROWS.map(([id, title, finding]) => (
                  <div key={id} className="py-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#0B2545]">{id} · {title}</span>
                      <span className="font-mono text-[#BA1A1A]">REJECTED</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#334155]">{finding}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {slide.layoutType === 'data_audit' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="bg-white border border-[#DDE2EC] rounded-[2px] p-4 flex-1">
              <div className="mb-2 flex items-center justify-between border-b border-[#DDE2EC] pb-2">
                <span className="font-mono text-xs font-bold text-[#0B2545]">
                  DATA INTEGRITY AUDIT &amp; SENSITIVITY RESOLUTIONS (ISS-01 TO ISS-05)
                </span>
                <span className="font-mono text-xs text-[#146C2E]">10,000,000 / 10,000,000 INTACT</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono text-[10px] uppercase text-[#475569]">
                    <th className="px-3 py-2">Issue ID</th>
                    <th className="px-3 py-2">Structural Challenge</th>
                    <th className="px-3 py-2">Resolution &amp; Sensitivity Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC]">
                  {AUDIT_ROWS.map(([id, prob, res]) => (
                    <tr key={id}>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#005AC1]">{id}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#0B2545]">{prob}</td>
                      <td className="px-3 py-2.5 text-[#334155]">{res}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-[#DDE2EC] p-3 rounded-[2px]">
                <div className="font-mono text-[10px] text-[#475569]">STORAGE COMPRESSION</div>
                <div className="font-mono text-base font-bold text-[#0B2545]">4.72 GB -&gt; 1.2 GB ZSTD</div>
              </div>
              <div className="bg-white border border-[#DDE2EC] p-3 rounded-[2px]">
                <div className="font-mono text-[10px] text-[#475569]">CONTINUITY STRATIFICATION</div>
                <div className="font-mono text-base font-bold text-[#0B2545]">87.6% Y · 12.4% N</div>
              </div>
              <div className="bg-white border border-[#DDE2EC] p-3 rounded-[2px]">
                <div className="font-mono text-[10px] text-[#475569]">EXACT ANOMALY CENSUS</div>
                <div className="font-mono text-base font-bold text-[#BA1A1A]">7,006 Records (0.0701%)</div>
              </div>
            </div>
          </div>
        )}

        {(slide.layoutType === 'feature' || slide.layoutType === 'twin') && (
          <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Structural Spec Column */}
            <div className="col-span-5 flex flex-col justify-between gap-2.5 min-h-0">
              <div className="bg-[#0B2545] p-3.5 text-white rounded-[2px]">
                <div className="font-mono text-[10px] font-bold tracking-wider text-[#93C5FD]">
                  {slide.formulaHeader?.toUpperCase()}
                </div>
                <div className="mt-1 font-mono text-xs font-semibold leading-snug text-white">
                  {slide.formulaExpr}
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-slate-200">{slide.formulaDesc}</p>
              </div>

              <div className="bg-white border border-[#DDE2EC] p-3.5 rounded-[2px] flex-1">
                <div className="font-mono text-[10px] font-bold tracking-wider text-[#005AC1]">
                  EMPIRICAL NETWORK EVIDENCE
                </div>
                <ul className="mt-2 space-y-2 text-[11.5px] leading-snug text-[#111827]">
                  {slide.evidenceBullets?.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono font-bold text-[#005AC1]">0{i + 1}.</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#F0F4F9] border border-[#DDE2EC] p-3 rounded-[2px]">
                <div className="font-mono text-[10px] font-bold tracking-wider text-[#006874]">
                  BANKING &amp; ECONOMIC RATIONALE
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[#334155]">
                  {slide.economicRationale ||
                    'Provides causal closure verifying that reconstructed equations reproduce ground-truth network behavior.'}
                </p>
              </div>
            </div>

            {/* Right Visual Frame */}
            <div className="col-span-7 bg-white border border-[#DDE2EC] rounded-[2px] p-3.5 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between border-b border-[#DDE2EC] pb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#0B2545]">
                  {slide.figureCaption?.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-[#475569]">UMDAC 2026 Empirical Chart</span>
              </div>
              <div className="flex flex-1 items-center justify-center pt-2 min-h-0 overflow-hidden">
                {slide.figureUrl && (
                  <img
                    src={slide.figureUrl}
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="max-h-[470px] w-auto max-w-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {slide.layoutType === 'recommendations' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="grid grid-cols-3 gap-4">
              {[
                [
                  '01 · RTGS LIQUIDITY',
                  'Scale Intraday Credit to B2B Hours',
                  '72.54% of settled turnover concentrates in B2B invoices peaking at 23:00-01:00 UTC. Allocate LSM collateral buffers around wholesale batches.',
                ],
                [
                  '02 · OBSERVABILITY & AML',
                  'Mandate UETR on Numeric Corridors',
                  'Enforce Swift gpi tracking to eliminate the 2.87x blind-spot latency penalty and deploy LEI Bayesian priors (100% Romance/CEO gating).',
                ],
                [
                  '03 · NETWORK ARCHITECTURE',
                  'Regional PvP Netting & Direct RMAs',
                  'Four Western hubs clear 81.4% of indirect flows while Covered MT202 COV averages 383s. Multilateral PvP engines remove dual-message lag.',
                ],
              ].map(([tag, head, body]) => (
                <div key={tag} className="bg-white border border-[#DDE2EC] p-4 rounded-[2px]">
                  <div className="font-mono text-[10px] font-bold text-[#005AC1]">{tag}</div>
                  <h3 className="mt-1 text-sm font-bold text-[#0B2545]">{head}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#334155]">{body}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#DDE2EC] p-4 rounded-[2px] flex-1">
              <div className="mb-2 font-mono text-[10px] font-bold text-[#0B2545]">
                SYNTHETIC ARTIFACTS VS. REAL-WORLD BANKING REALITY (RUBRIC 4.2 HONESTY AUDIT)
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono text-[10px] uppercase text-[#475569]">
                    <th className="px-3 py-1.5">Dimension</th>
                    <th className="px-3 py-1.5">Synthetic Generator Behavior</th>
                    <th className="px-3 py-1.5">Real-World Interbank Counterpart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC]">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-[#0B2545]">Amount Ladder</td>
                    <td className="px-3 py-2 font-mono">Discrete +2.0 log-mean steps (7.39x)</td>
                    <td className="px-3 py-2">Continuous overlapping retail/SME/corporate distributions</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-[#0B2545]">Fraud Conditioning</td>
                    <td className="px-3 py-2 font-mono">Strict P=1.000 entity boundaries</td>
                    <td className="px-3 py-2">Probabilistic mule networks with mixed shell entities</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-[#0B2545]">Latency Drivers</td>
                    <td className="px-3 py-2 font-mono">Hop count + 148s FX step + Exp(150)</td>
                    <td className="px-3 py-2">Time-zone clearing cutoffs, nostro funding &amp; sanctions queues</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-[#DDE2EC] bg-white px-7 py-2 text-[11px] text-[#475569]">
        <span>Swift Payment Network Reverse-Engineering · UMDAC Datathon 2026</span>
        <span className="font-mono">
          Slide {slide.slideNum} of {totalSlides} · Empirical Deliverable 2
        </span>
      </footer>
    </article>
  );
};
