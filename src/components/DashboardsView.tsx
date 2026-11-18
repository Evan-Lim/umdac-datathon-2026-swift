import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Layers } from 'lucide-react';
import { DashboardPageConfig } from '../types';
import { DashboardSheet } from './DashboardSheet';

interface DashboardsViewProps {
  pages: DashboardPageConfig[];
  revisedDashboardPdfUrl: string;
  legacyDashboardPdfUrl: string;
}

export const DashboardsView: React.FC<DashboardsViewProps> = ({
  pages,
  revisedDashboardPdfUrl,
  legacyDashboardPdfUrl,
}) => {
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'m3_html' | 'legacy_png'>('m3_html');

  if (!pages.length) return null;
  const page = pages[selectedPageIdx];

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="m3-surface flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {pages.map((p, idx) => (
            <button
              key={p.pageNum}
              onClick={() => setSelectedPageIdx(idx)}
              className={`rounded-[2px] px-3 py-1.5 font-mono text-xs font-semibold transition whitespace-nowrap ${
                idx === selectedPageIdx
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
              }`}
            >
              P{p.pageNum}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex border border-[#DDE2EC] bg-[#F0F4F9] p-0.5 rounded-[2px]">
            <button
              onClick={() => setViewMode('m3_html')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[2px] transition whitespace-nowrap ${
                viewMode === 'm3_html'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              M3 HTML Dashboard
            </button>
            <button
              onClick={() => setViewMode('legacy_png')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[2px] transition whitespace-nowrap ${
                viewMode === 'legacy_png'
                  ? 'bg-white text-[#0B2545] shadow-xs'
                  : 'text-[#475569] hover:text-[#111827]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Original PNG
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedPageIdx((i) => Math.max(0, i - 1))}
              disabled={selectedPageIdx === 0}
              aria-label="Previous dashboard page"
              className="rounded-[2px] border border-[#DDE2EC] bg-white p-1.5 text-[#0B2545] hover:bg-[#F0F4F9] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedPageIdx((i) => Math.min(pages.length - 1, i + 1))}
              disabled={selectedPageIdx === pages.length - 1}
              aria-label="Next dashboard page"
              className="rounded-[2px] border border-[#DDE2EC] bg-white p-1.5 text-[#0B2545] hover:bg-[#F0F4F9] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <a
            href={revisedDashboardPdfUrl}
            download="swift_payments_m3_dashboard_8pages.pdf"
            className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004494] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Download Revised PDF (8 Pages)
          </a>

          <a
            href={legacyDashboardPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#DDE2EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#F0F4F9] whitespace-nowrap"
          >
            Original PDF
          </a>
        </div>
      </div>

      {/* Main Page View */}
      {viewMode === 'm3_html' ? (
        <DashboardSheet page={page} totalPages={pages.length} />
      ) : (
        <div className="m3-surface bg-[#F0F4F9] p-4">
          <img
            src={page.imageUrl}
            alt={`Original Dashboard Page ${page.pageNum}: ${page.title}`}
            referrerPolicy="no-referrer"
            className="mx-auto w-full max-w-6xl border border-[#C4C9D4]"
          />
        </div>
      )}
    </div>
  );
};
