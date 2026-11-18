import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  MessageSquare,
  HelpCircle,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { FigureInfo, OverviewPayload, SlideInfo } from '../types';
import { SlideCanvas } from './SlideCanvas';

interface SlidesAndFiguresViewProps {
  slides: SlideInfo[];
  figures: FigureInfo[];
  pdfs: OverviewPayload['pdfs'];
}

export const SlidesAndFiguresView: React.FC<SlidesAndFiguresViewProps> = ({
  slides,
  figures,
  pdfs,
}) => {
  const [subView, setSubView] = useState<'slides' | 'figures'>('slides');
  const [slideRenderMode, setSlideRenderMode] = useState<'m3_html' | 'legacy_png'>('m3_html');
  const [slideIdx, setSlideIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [figureGroup, setFigureGroup] = useState<string>('ALL');
  const [zoomedFigure, setZoomedFigure] = useState<FigureInfo | null>(null);

  const activeSlide = slides[slideIdx];
  const groups = ['ALL', ...Array.from(new Set(figures.map((f) => f.group)))];
  const filteredFigures =
    figureGroup === 'ALL' ? figures : figures.filter((f) => f.group === figureGroup);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="m3-surface flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubView('slides')}
            className={`rounded-[2px] px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              subView === 'slides'
                ? 'bg-[#0B2545] text-white'
                : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
            }`}
          >
            15-Slide Presentation Deck
          </button>
          <button
            onClick={() => setSubView('figures')}
            className={`inline-flex items-center gap-1.5 rounded-[2px] px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              subView === 'figures'
                ? 'bg-[#0B2545] text-white'
                : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Empirical Figures ({figures.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subView === 'slides' && (
            <div className="inline-flex border border-[#DDE2EC] bg-[#F0F4F9] p-0.5 rounded-[2px]">
              <button
                onClick={() => setSlideRenderMode('m3_html')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[2px] whitespace-nowrap ${
                  slideRenderMode === 'm3_html' ? 'bg-white text-[#0B2545]' : 'text-[#475569]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                M3 HTML Slides
              </button>
              <button
                onClick={() => setSlideRenderMode('legacy_png')}
                className={`px-2.5 py-1 text-xs font-medium rounded-[2px] whitespace-nowrap ${
                  slideRenderMode === 'legacy_png' ? 'bg-white text-[#0B2545]' : 'text-[#475569]'
                }`}
              >
                Original PNG
              </button>
            </div>
          )}

          <a
            href={pdfs.revisedSlidesPdf}
            download="swift_presentation_m3_slides_15pages.pdf"
            className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004494] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Download Revised Slides PDF (15 Pages)
          </a>
          <a
            href={pdfs.technicalReportPdf}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#DDE2EC] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] hover:bg-[#F0F4F9] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Master Report PDF
          </a>
        </div>
      </div>

      {subView === 'slides' && activeSlide && (
        <div className="space-y-4">
          {/* Slide Selector Strip */}
          <div className="m3-surface flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex flex-wrap gap-1">
              {slides.map((s, idx) => (
                <button
                  key={s.slideNum}
                  onClick={() => setSlideIdx(idx)}
                  className={`rounded-[2px] px-2.5 py-1 font-mono text-xs font-semibold transition ${
                    idx === slideIdx
                      ? 'bg-[#0B2545] text-white'
                      : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
                  }`}
                >
                  {String(s.slideNum).padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                disabled={slideIdx === 0}
                aria-label="Previous slide"
                className="rounded-[2px] border border-[#DDE2EC] bg-white p-1.5 text-[#0B2545] hover:bg-[#F0F4F9] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                disabled={slideIdx === slides.length - 1}
                aria-label="Next slide"
                className="rounded-[2px] border border-[#DDE2EC] bg-white p-1.5 text-[#0B2545] hover:bg-[#F0F4F9] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFullscreen(true)}
                aria-label="Fullscreen slide presentation"
                className="inline-flex items-center gap-1 rounded-[2px] border border-[#DDE2EC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0B2545] hover:bg-[#F0F4F9]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Present
              </button>
            </div>
          </div>

          {/* Main Slide + Speaker Notes */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {slideRenderMode === 'm3_html' ? (
                <SlideCanvas slide={activeSlide} totalSlides={slides.length} />
              ) : (
                <div className="m3-surface bg-[#F0F4F9] p-3">
                  <img
                    src={activeSlide.imageUrl}
                    alt={`Original Slide ${activeSlide.slideNum}: ${activeSlide.title}`}
                    referrerPolicy="no-referrer"
                    className="w-full border border-[#C4C9D4]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 lg:col-span-4">
              <div className="m3-surface p-4">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-[#005AC1]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  SPOKEN PRESENTATION SCRIPT (~45S)
                </div>
                <p className="text-xs leading-relaxed text-[#334155]">{activeSlide.script}</p>
              </div>

              {activeSlide.judgeQuestion && (
                <div className="rounded-[4px] border border-[#0B2545] bg-[#0B2545] p-4 text-white">
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-[#93C5FD]">
                    <HelpCircle className="h-3.5 w-3.5" />
                    ANTICIPATED JUDGE Q&amp;A DEFENSE
                  </div>
                  <p className="text-xs font-semibold text-[#FDE68A]">
                    Q: &ldquo;{activeSlide.judgeQuestion}&rdquo;
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">
                    {activeSlide.judgeDefense}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subView === 'figures' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setFigureGroup(g)}
                className={`rounded-[2px] px-3 py-1.5 text-xs font-medium transition ${
                  figureGroup === g
                    ? 'bg-[#0B2545] text-white'
                    : 'border border-[#DDE2EC] bg-white text-[#334155] hover:bg-[#F0F4F9]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFigures.map((fig) => (
              <button
                key={fig.filename}
                type="button"
                onClick={() => setZoomedFigure(fig)}
                className="m3-surface overflow-hidden text-left transition hover:border-[#005AC1]"
              >
                <div className="border-b border-[#DDE2EC] bg-[#F0F4F9] px-3.5 py-2.5">
                  <div className="font-mono text-[10px] font-bold uppercase text-[#005AC1]">
                    {fig.group}
                  </div>
                  <div className="mt-0.5 truncate text-xs font-semibold text-[#0B2545]">
                    {fig.label}
                  </div>
                </div>
                <div className="flex h-52 items-center justify-center bg-white p-3">
                  <img
                    src={fig.url}
                    alt={fig.label}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Presenter Modal */}
      {fullscreen && activeSlide && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#071A33] p-6">
          <div className="mb-3 flex w-full max-w-6xl items-center justify-between text-white">
            <span className="font-mono text-xs text-[#93C5FD]">
              PRESENTER MODE · SLIDE {activeSlide.slideNum} OF {slides.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                disabled={slideIdx === 0}
                className="rounded-[2px] border border-white/25 px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                disabled={slideIdx === slides.length - 1}
                className="rounded-[2px] border border-white/25 px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="inline-flex items-center gap-1 rounded-[2px] bg-[#005AC1] px-3 py-1 text-xs font-semibold"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
          </div>
          <div className="w-full max-w-6xl">
            <SlideCanvas slide={activeSlide} totalSlides={slides.length} />
          </div>
        </div>
      )}

      {/* Figure Zoom Modal */}
      {zoomedFigure && (
        <div
          onClick={() => setZoomedFigure(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="m3-surface max-h-[90vh] max-w-5xl overflow-auto p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-4 border-b border-[#DDE2EC] pb-2">
              <div>
                <div className="font-mono text-xs font-bold text-[#005AC1]">
                  {zoomedFigure.group}
                </div>
                <div className="text-sm font-bold text-[#0B2545]">{zoomedFigure.label}</div>
              </div>
              <button
                onClick={() => setZoomedFigure(null)}
                className="rounded-[2px] border border-[#DDE2EC] bg-[#F0F4F9] px-3 py-1 text-xs font-semibold text-[#0B2545]"
              >
                Close
              </button>
            </div>
            <img
              src={zoomedFigure.url}
              alt={zoomedFigure.label}
              referrerPolicy="no-referrer"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
