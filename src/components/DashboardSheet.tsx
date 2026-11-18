import React from 'react';
import { DashboardPageConfig } from '../types';

interface DashboardSheetProps {
  page: DashboardPageConfig;
  totalPages: number;
  forPrint?: boolean;
}

/**
 * Pixel-exact 16:9 (1280x720) Material Design 3 Angular Dashboard Page.
 * Rendered identically inside both the interactive DashboardsView and /print/dashboard for 8-page PDF export.
 */
export const DashboardSheet: React.FC<DashboardSheetProps> = ({
  page,
  totalPages,
  forPrint = false,
}) => {
  return (
    <article
      className={`flex flex-col justify-between bg-[#F6F8FB] text-[#111827] ${
        forPrint
          ? 'print-sheet h-[720px] w-[1280px] overflow-hidden'
          : 'w-full border border-[#C4C9D4] rounded-[4px] overflow-hidden'
      }`}
      style={forPrint ? { width: 1280, height: 720 } : undefined}
    >
      {/* 1. Angular M3 Header Bar */}
      <header className="flex items-center justify-between bg-[#0B2545] px-6 py-3 text-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-[#93C5FD]">
            <span>SWIFT PAYMENT NETWORK ARCHITECTURE</span>
            <span aria-hidden="true">·</span>
            <span>{page.featureGroup.toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span>{page.pillar.toUpperCase()}</span>
          </div>
          <h2 className="mt-0.5 truncate font-display text-lg font-bold tracking-tight text-white">
            Page {page.pageNum}: {page.title}
          </h2>
        </div>

        <div className="shrink-0 text-right font-mono">
          <div className="bg-[#005AC1] px-3 py-1 text-[11px] font-bold text-white rounded-[2px]">
            PAGE {String(page.pageNum).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </div>
          <div className="mt-1 text-[10px] text-slate-300">UMDAC Datathon 2026 · Deliverable 1</div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex flex-1 flex-col justify-between gap-3 px-6 py-3.5 overflow-hidden">
        {/* 2. Reconstructed Business Rule + Closed-Form Formula Strip */}
        <section className="grid grid-cols-12 gap-3 bg-white border border-[#DDE2EC] rounded-[2px] p-3">
          <div className="col-span-8 pr-3 border-r border-[#DDE2EC]">
            <div className="font-mono text-[10px] font-bold tracking-wider text-[#005AC1]">
              RECONSTRUCTED BUSINESS RULE &amp; CAUSAL SPECIFICATION
            </div>
            <p className="mt-1 text-xs font-semibold leading-snug text-[#111827]">
              {page.ruleLines[0]}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[#475569]">{page.ruleLines[1]}</p>
          </div>

          <div className="col-span-4 flex flex-col justify-center bg-[#F0F4F9] px-3 py-2 rounded-[2px]">
            <div className="font-mono text-[9.5px] font-bold tracking-wider text-[#006874]">
              MATHEMATICAL LAW &amp; BASELINE
            </div>
            <div className="mt-1 font-mono text-[10.5px] font-semibold leading-snug text-[#0B2545]">
              {page.formulaExpr}
            </div>
            <div className="mt-1 text-[10px] leading-snug text-[#475569]">
              {page.baselineComparison}
            </div>
          </div>
        </section>

        {/* 3. 4-Column Tabular KPI Strip */}
        <section className="grid grid-cols-4 gap-3">
          {page.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white border border-[#DDE2EC] rounded-[2px] px-3.5 py-2.5"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
                {kpi.label}
              </div>
              <div className="mt-0.5 font-mono text-xl font-bold text-[#0B2545] tabular-nums">
                {kpi.value}
              </div>
              <div className="mt-0.5 truncate text-[10.5px] text-[#475569]">{kpi.sub}</div>
            </div>
          ))}
        </section>

        {/* 4. Empirical Visual Evidence Frame */}
        <section className="flex flex-1 flex-col justify-between bg-white border border-[#DDE2EC] rounded-[2px] p-3 min-h-0">
          <div className="flex items-center justify-between border-b border-[#DDE2EC] pb-1.5">
            <span className="font-mono text-[10px] font-bold tracking-wider text-[#0B2545]">
              EMPIRICAL EVIDENCE &amp; BASELINE COMPARISON · {page.cellRef.toUpperCase()}
            </span>
            <span className="font-mono text-[10px] text-[#475569]">
              DuckDB ZSTD Parquet (N = 10,000,000)
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center pt-2 min-h-0 overflow-hidden">
            <img
              src={page.figureUrl}
              alt={page.title}
              referrerPolicy="no-referrer"
              className="max-h-[290px] w-auto max-w-full object-contain"
            />
          </div>
        </section>
      </div>

      {/* 5. Operational Takeaway Footer */}
      <footer className="bg-[#111827] px-6 py-2.5 text-white">
        <div className="flex items-baseline gap-3">
          <span className="shrink-0 font-mono text-[10px] font-bold tracking-wider text-[#93C5FD]">
            OPERATIONAL TAKEAWAY:
          </span>
          <p className="text-[11px] leading-snug text-slate-100">
            {page.footerLines[0]} {page.footerLines[1]}
          </p>
        </div>
      </footer>
    </article>
  );
};
