import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Database,
  Download,
  FileBarChart2,
  LayoutDashboard,
  Presentation,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { OverviewPayload } from './types';
import { OverviewView } from './components/OverviewView';
import { DashboardsView } from './components/DashboardsView';
import { GenerativeTwinView } from './components/GenerativeTwinView';
import { ExplorerView } from './components/ExplorerView';
import { RulesAndAuditView } from './components/RulesAndAuditView';
import { SlidesAndFiguresView } from './components/SlidesAndFiguresView';
import { PrintView } from './components/PrintViews';
import { fetchOverview, getDefaultDashboardPdfUrl } from './services/clientApi';

type ActiveSection = 'overview' | 'dashboards' | 'slides' | 'twin' | 'explorer' | 'rules';

export function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (pathname === '/print/dashboard') {
    return <PrintView mode="dashboard" />;
  }
  if (pathname === '/print/slides') {
    return <PrintView mode="slides" />;
  }

  const [section, setSection] = useState<ActiveSection>('overview');
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview()
      .then((data: OverviewPayload) => {
        setOverview(data);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, []);

  const navItems: Array<{
    id: ActiveSection;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: LayoutDashboard },
    { id: 'dashboards', label: '8-Page Dashboard', shortLabel: 'Dashboard', icon: FileBarChart2 },
    { id: 'slides', label: '15-Slide Deck', shortLabel: 'Slides', icon: Presentation },
    { id: 'twin', label: 'Generative Twin', shortLabel: 'Twin', icon: Cpu },
    { id: 'explorer', label: 'Data & SQL Explorer', shortLabel: 'Explorer', icon: Database },
    { id: 'rules', label: 'Ledger & Audit', shortLabel: 'Audit', icon: ShieldCheck },
  ];

  const activeItem = navItems.find((n) => n.id === section);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#111827]">
      {/* Strict 3-Zone Angular Material Design 3 Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#DDE2EC] bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:gap-8 sm:px-6 sm:py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setSection('overview')}
            className="font-display text-sm sm:text-base font-bold tracking-tight text-[#0B2545] whitespace-nowrap shrink-0"
          >
            Swift Network Telemetry
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#475569]">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`whitespace-nowrap shrink-0 border-b-2 py-1 transition ${
                  section === item.id
                    ? 'border-[#005AC1] text-[#0B2545]'
                    : 'border-transparent hover:text-[#0B2545]'
                }`}
              >
                {item.shortLabel}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <a
              href={overview?.pdfs.revisedDashboardPdf || getDefaultDashboardPdfUrl()}
              download="swift_payments_m3_dashboard_8pages.pdf"
              aria-label="Export Dashboard PDF"
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#0B2545] px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white transition hover:bg-[#005AC1] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                <span className="hidden sm:inline">Export </span>Dashboard PDF
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* Workspace Shell: Angular M3 Navigation Rail + Main Viewport */}
      <div className="mx-auto flex max-w-[1440px] flex-col md:flex-row">
        {/* Left Navigation Rail (Desktop) / Compact Bar (Mobile) */}
        <aside className="w-full shrink-0 border-b border-[#DDE2EC] bg-[#F0F4F9] md:min-h-[calc(100vh-57px)] md:w-60 md:border-r md:border-b-0">
          <div className="p-3 md:p-4">
            <div className="hidden md:block px-2 pb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Workspace Modules
            </div>
            <div className="flex gap-1 overflow-x-auto md:flex-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-2.5 rounded-[2px] px-3 py-2.5 text-left text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#D8E2FF] text-[#001A41]'
                        : 'text-[#334155] hover:bg-[#E8EEF5] hover:text-[#0B2545]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {overview && (
              <div className="mt-6 hidden border-t border-[#DDE2EC] pt-4 md:block">
                <div className="px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                  Deliverable PDFs
                </div>
                <div className="mt-2 space-y-1.5 px-1">
                  <a
                    href={overview.pdfs.revisedDashboardPdf}
                    download="swift_payments_m3_dashboard_8pages.pdf"
                    className="flex items-center justify-between rounded-[2px] border border-[#DDE2EC] bg-white px-2.5 py-2 text-[11px] font-medium text-[#0B2545] hover:border-[#005AC1]"
                  >
                    <span>M3 Dashboard</span>
                    <span className="font-mono text-[#005AC1]">8p PDF</span>
                  </a>
                  <a
                    href={overview.pdfs.revisedSlidesPdf}
                    download="swift_presentation_m3_slides_15pages.pdf"
                    className="flex items-center justify-between rounded-[2px] border border-[#DDE2EC] bg-white px-2.5 py-2 text-[11px] font-medium text-[#0B2545] hover:border-[#005AC1]"
                  >
                    <span>M3 Slides Deck</span>
                    <span className="font-mono text-[#005AC1]">15p PDF</span>
                  </a>
                  <a
                    href={overview.pdfs.technicalReportPdf}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[2px] border border-[#DDE2EC] bg-white px-2.5 py-2 text-[11px] font-medium text-[#0B2545] hover:border-[#005AC1]"
                  >
                    <span>Master Report</span>
                    <span className="font-mono text-[#475569]">PDF</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE2EC] pb-3">
            <div className="font-mono text-xs text-[#475569]">
              UMDAC Datathon 2026 <span aria-hidden="true">/</span>{' '}
              <span className="font-semibold text-[#0B2545]">{activeItem?.label}</span>
            </div>
            {overview && (
              <div className="font-mono text-xs text-[#475569] tabular-nums">
                10,000,000 Transactions · $972.04B Settled · 7,006 Anomalies
              </div>
            )}
          </div>

          {loading && (
            <div className="m3-surface p-10 text-center font-mono text-xs text-[#475569]">
              Loading empirical tables, reconstructed rules, and deliverables...
            </div>
          )}

          {error && (
            <div className="m3-surface flex items-center gap-2 border-[#BA1A1A] bg-[#FFDAD6]/40 p-4 text-xs text-[#BA1A1A]">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {overview && (
            <>
              {section === 'overview' && (
                <OverviewView overview={overview} onNavigate={(tab) => setSection(tab)} />
              )}
              {section === 'dashboards' && (
                <DashboardsView
                  pages={overview.dashboardPages}
                  revisedDashboardPdfUrl={overview.pdfs.revisedDashboardPdf}
                  legacyDashboardPdfUrl={overview.pdfs.dashboardPdf}
                />
              )}
              {section === 'slides' && (
                <SlidesAndFiguresView
                  slides={overview.slides}
                  figures={overview.figures}
                  pdfs={overview.pdfs}
                />
              )}
              {section === 'twin' && <GenerativeTwinView />}
              {section === 'explorer' && <ExplorerView anomalyCensus={overview.anomalyCensus} />}
              {section === 'rules' && (
                <RulesAndAuditView tables={overview.tables} reports={overview.reports} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
