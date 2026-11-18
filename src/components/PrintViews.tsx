import React, { useEffect, useState } from 'react';
import { OverviewPayload } from '../types';
import { DashboardSheet } from './DashboardSheet';
import { SlideCanvas } from './SlideCanvas';
import { fetchOverview } from '../services/clientApi';

interface PrintViewProps {
  mode: 'dashboard' | 'slides';
}

export const PrintView: React.FC<PrintViewProps> = ({ mode }) => {
  const [overview, setOverview] = useState<OverviewPayload | null>(null);

  useEffect(() => {
    fetchOverview().then((data) => setOverview(data));
  }, []);

  if (!overview) {
    return <div className="p-8 font-mono text-xs">Preparing print pages...</div>;
  }

  return (
    <div data-print-ready="true" className="bg-white">
      {mode === 'dashboard'
        ? overview.dashboardPages.map((page) => (
            <DashboardSheet
              key={page.pageNum}
              page={page}
              totalPages={overview.dashboardPages.length}
              forPrint
            />
          ))
        : overview.slides.map((slide) => (
            <SlideCanvas
              key={slide.slideNum}
              slide={slide}
              totalSlides={overview.slides.length}
              forPrint
            />
          ))}
    </div>
  );
};
