import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Table, BookOpen } from 'lucide-react';
import { CsvRow, OverviewPayload } from '../types';

interface RulesAndAuditViewProps {
  tables: OverviewPayload['tables'];
  reports: OverviewPayload['reports'];
}

const CONFIRMED_HYPOTHESES = [
  {
    id: 'HYP-01',
    group: 'Valuation (G1)',
    hypothesis: 'Amount generation is conditioned on counterparty institutional tier.',
    rule: 'ln(USD_AMOUNT) ~ N(mu, sigma=2.29) with exact +2.0 discrete shifts: C->C=6.0, B->C/C->B=8.0, B->B=10.0.',
  },
  {
    id: 'HYP-02',
    group: 'Topology (G3)',
    hypothesis: 'Direct routing occurs iff no correspondent intermediaries are needed.',
    rule: 'Direct settlement strictly requires PARTICIPANT_COUNT = 2. N >= 3 exclusively produces Indirect (88%) or Covered (12%).',
  },
  {
    id: 'HYP-03',
    group: 'Modality (G5)',
    hypothesis: 'Covered payments require higher transaction values to justify liquidity coverage.',
    rule: 'Covered transactions exhibit +24.8% higher median value ($4,516 vs $3,618, p < 1e-15) and never occur on direct routes.',
  },
  {
    id: 'HYP-04',
    group: 'Anomalies (G8)',
    hypothesis: 'Fraud types obey strict entity boundary constraints.',
    rule: 'P(Consumer | Romance Scam) = 1.000; P(Business | CEO Scam) = 1.000. Strict zero-leakage boundaries.',
  },
];

const REJECTED_HYPOTHESES = [
  {
    id: 'HYP-NEG-01',
    hypothesis: 'Settlement duration scales with physical geographic distance between countries.',
    finding:
      'REJECTED (r = 0.018, p = 0.34). US-to-UK direct (5,500 km) settles in 39s, while France-to-Germany 4-hop indirect (800 km) takes 1,046s.',
  },
  {
    id: 'HYP-NEG-02',
    hypothesis: 'The number of FX currency conversions depends on payment size (USD_AMOUNT).',
    finding:
      'REJECTED (F = 0.82, p = 0.58). Median amounts across 0 FX ($3,612), 1 FX ($3,619), and 2 FX ($3,630) are indistinguishable.',
  },
  {
    id: 'HYP-NEG-03',
    hypothesis: 'Covered payments are utilized by retail consumers for high-value remittances.',
    finding:
      'REJECTED. Covered payments (MT202 COV) are virtually absent in C2C corridors; strictly an institutional wholesale tool.',
  },
  {
    id: 'HYP-NEG-04',
    hypothesis: "Discontinuous paths (CONTINUITY_QFLAG == 'N') exhibit significantly higher direct latency.",
    finding:
      'REJECTED for direct paths (Median = 39.0s for Y vs 39.0s for N). Continuity flag reflects observability opacity, not physical bottlenecks.',
  },
];

const DATA_ISSUES = [
  {
    id: 'ISS-01',
    title: 'Embedded Multiline Strings in Party Details',
    impact: 'Naive line-by-line CSV parsers fragmented 10M-row alignment.',
    resolution: 'Parsed via DuckDB RFC 4180 multiline quote engine with explicit schema enforcement (0 row loss).',
  },
  {
    id: 'ISS-02',
    title: 'Header Row Synthetic Disclaimer Artefact',
    impact: 'Column 1 DISCLAIMER carried notice text on row 1, null elsewhere.',
    resolution: 'Excluded DISCLAIMER column during Parquet extraction to optimize memory footprint.',
  },
  {
    id: 'ISS-03',
    title: "Discontinuous Path Placeholder ('...' in BIC8_PATH)",
    impact: '12.4% of paths have unobservable intermediary hops.',
    resolution: "Retained CONTINUITY_QFLAG ('Y'/'N') as an explicit observability & routing stratification feature.",
  },
  {
    id: 'ISS-04',
    title: 'Extreme Amount Outliers ($15.6B Typographical Errors)',
    impact: '10^k decimal shift errors skew parametric mean/std fits.',
    resolution: 'Isolated under FAT_FINGER_MISTAKE; used median & log-transform fits on normal records.',
  },
  {
    id: 'ISS-05',
    title: 'Zero / Sub-second Total Durations',
    impact: 'Instantaneous direct settlements cause ln(0) singularities.',
    resolution: 'Formulated duration models using log(1 + TOTAL_DURATION) and piecewise mixture distributions.',
  },
];

const renderCsvTable = (rows: CsvRow[]) => {
  if (!rows || rows.length === 0) {
    return <p className="text-xs text-[#475569]">No table rows found.</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="max-h-96 overflow-auto border border-[#DDE2EC] rounded-[2px]">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-[#F0F4F9] font-mono uppercase text-[#475569]">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[#F6F8FB]">
              {cols.map((c) => (
                <td key={c} className="px-3 py-1.5 text-[#111827]">
                  {String(r[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const RulesAndAuditView: React.FC<RulesAndAuditViewProps> = ({ tables, reports }) => {
  const [selectedTable, setSelectedTable] = useState<keyof OverviewPayload['tables']>('g1Amount');
  const [showRawMd, setShowRawMd] = useState<'rules' | 'hypotheses' | 'issues' | null>(null);

  const tableLabels: Array<{ key: keyof OverviewPayload['tables']; label: string }> = [
    { key: 'g1Amount', label: 'G1: Amount Stats' },
    { key: 'g3Topology', label: 'G3: Topology & Hops' },
    { key: 'g4Duration', label: 'G4: Latency Decomposition' },
    { key: 'g5Modality', label: 'G5: Modality Stats' },
    { key: 'g6Fx', label: 'G6: FX Conversions' },
    { key: 'g7Tokens', label: 'G7: Token Gating' },
  ];

  return (
    <div className="space-y-5">
      {/* Hypothesis Ledger */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="m3-surface p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-[#DDE2EC] pb-2.5">
            <CheckCircle className="h-4 w-4 text-[#146C2E]" />
            <h3 className="text-sm font-bold text-[#0B2545]">
              Confirmed Generative Laws (HYP-01 to HYP-04)
            </h3>
          </div>
          <div className="divide-y divide-[#DDE2EC]">
            {CONFIRMED_HYPOTHESES.map((h) => (
              <div key={h.id} className="py-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="font-mono text-[#005AC1]">
                    {h.id} · {h.group}
                  </span>
                  <span className="font-mono text-[#146C2E]">CONFIRMED</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[#111827]">{h.hypothesis}</p>
                <p className="mt-1 font-mono text-[11px] text-[#475569]">{h.rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="m3-surface p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-[#DDE2EC] pb-2.5">
            <XCircle className="h-4 w-4 text-[#BA1A1A]" />
            <h3 className="text-sm font-bold text-[#0B2545]">
              Tested &amp; Rejected Hypotheses (Negative Results)
            </h3>
          </div>
          <div className="divide-y divide-[#DDE2EC]">
            {REJECTED_HYPOTHESES.map((h) => (
              <div key={h.id} className="py-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="font-mono text-[#0B2545]">{h.id}</span>
                  <span className="font-mono text-[#BA1A1A]">REJECTED</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[#111827]">{h.hypothesis}</p>
                <p className="mt-1 text-xs text-[#475569]">{h.finding}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empirical CSV Tables Explorer */}
      <div className="m3-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-[#005AC1]" />
            <h3 className="text-sm font-bold text-[#0B2545]">
              Empirical Output Tables (<code>output/tables/*.csv</code>)
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tableLabels.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedTable(t.key)}
                className={`rounded-[2px] px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTable === t.key
                    ? 'bg-[#0B2545] text-white'
                    : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {renderCsvTable(tables[selectedTable])}
      </div>

      {/* Data Issues Audit */}
      <div className="m3-surface p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-[#DDE2EC] pb-2.5">
          <AlertCircle className="h-4 w-4 text-[#8A5300]" />
          <h3 className="text-sm font-bold text-[#0B2545]">
            Data Issues &amp; Integrity Audit Log (ISS-01 to ISS-05)
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DATA_ISSUES.map((iss) => (
            <div
              key={iss.id}
              className="rounded-[2px] border border-[#DDE2EC] bg-[#F0F4F9] p-3.5"
            >
              <div className="font-mono text-xs font-bold text-[#0B2545]">
                {iss.id} · {iss.title}
              </div>
              <p className="mt-1.5 text-xs text-[#475569]">
                <span className="font-semibold text-[#111827]">Impact:</span> {iss.impact}
              </p>
              <p className="mt-1 text-xs text-[#475569]">
                <span className="font-semibold text-[#111827]">Resolution:</span> {iss.resolution}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Markdown Documentation Drawer */}
      <div className="m3-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#005AC1]" />
            <h3 className="text-sm font-bold text-[#0B2545]">
              Source Markdown Documentation (<code>reports/*.md</code>)
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'rules', label: 'reconstructed_rules_catalog.md' },
              { id: 'hypotheses', label: 'hypothesis_ledger.md' },
              { id: 'issues', label: 'data_issues_log.md' },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() =>
                  setShowRawMd((cur) =>
                    cur === doc.id ? null : (doc.id as 'rules' | 'hypotheses' | 'issues')
                  )
                }
                className={`rounded-[2px] border px-3 py-1.5 font-mono text-xs transition ${
                  showRawMd === doc.id
                    ? 'border-[#0B2545] bg-[#0B2545] text-white'
                    : 'border-[#C4C9D4] bg-white text-[#334155] hover:bg-[#F0F4F9]'
                }`}
              >
                {doc.label}
              </button>
            ))}
          </div>
        </div>

        {showRawMd && (
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-[2px] bg-[#0B2545] p-4 font-mono text-xs leading-relaxed text-slate-200">
            {showRawMd === 'rules'
              ? reports.rulesCatalog
              : showRawMd === 'hypotheses'
              ? reports.hypothesisLedger
              : reports.dataIssuesLog}
          </pre>
        )}
      </div>
    </div>
  );
};
