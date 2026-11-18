import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { loadOverviewPayload } from './src/server/swiftData';
import { runTwinSimulation } from './src/server/twinEngine';
import {
  exploreAmount,
  exploreAnomaly,
  exploreLatency,
  runCustomSqlQuery,
} from './src/server/explorerEngine';
import { countPdfPages, renderRouteToPdf } from './src/server/pdfExporter';

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ROOT_DIR = process.cwd();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Serve generated outputs (figures, dashboards, slides, PDFs, tables) & reports
  app.use('/output', express.static(path.join(ROOT_DIR, 'output')));
  app.use('/reports', express.static(path.join(ROOT_DIR, 'reports')));

  // API: Overview & empirical deliverables
  app.get('/api/overview', (_req, res) => {
    try {
      const payload = loadOverviewPayload();
      res.json(payload);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // API: Export HTML-revised 8-Page Dashboard PDF
  app.get('/api/export/dashboard.pdf', async (req, res) => {
    try {
      const outPath = path.join(ROOT_DIR, 'output', 'dashboards', 'swift_dashboard_m3_revised.pdf');
      const forceFresh = req.query.fresh === '1';

      if (!forceFresh && fs.existsSync(outPath)) {
        const buf = fs.readFileSync(outPath);
        if (countPdfPages(buf) === 8) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            'attachment; filename="swift_payments_m3_dashboard_8pages.pdf"'
          );
          return res.send(buf);
        }
      }

      const { buffer } = await renderRouteToPdf({
        url: `http://127.0.0.1:${PORT}/print/dashboard`,
        outPath,
        expectedPages: 8,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="swift_payments_m3_dashboard_8pages.pdf"'
      );
      return res.send(buffer);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // API: Export HTML-revised 15-Slide Presentation PDF
  app.get('/api/export/slides.pdf', async (req, res) => {
    try {
      const outPath = path.join(ROOT_DIR, 'output', 'slides', 'swift_slides_m3_revised.pdf');
      const forceFresh = req.query.fresh === '1';

      if (!forceFresh && fs.existsSync(outPath)) {
        const buf = fs.readFileSync(outPath);
        if (countPdfPages(buf) === 15) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            'attachment; filename="swift_presentation_m3_slides_15pages.pdf"'
          );
          return res.send(buf);
        }
      }

      const { buffer } = await renderRouteToPdf({
        url: `http://127.0.0.1:${PORT}/print/slides`,
        outPath,
        expectedPages: 15,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="swift_presentation_m3_slides_15pages.pdf"'
      );
      return res.send(buffer);
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // API: Swift Generative Twin simulator
  app.post('/api/twin/simulate', (req, res) => {
    try {
      const n = Number(req.body?.n ?? 5000);
      const seed = Number(req.body?.seed ?? 42);
      const includeAnomalies = Boolean(req.body?.includeAnomalies ?? false);
      const result = runTwinSimulation(n, seed, includeAnomalies);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  // API: Interactive Explorer (port of interactive_explorer.py)
  app.get('/api/explorer/amount', (req, res) => {
    try {
      const pair = typeof req.query.pair === 'string' ? req.query.pair : undefined;
      const currency = typeof req.query.currency === 'string' ? req.query.currency : undefined;
      res.json({ rows: exploreAmount(pair, currency) });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/explorer/anomaly', (req, res) => {
    try {
      const anomalyType =
        typeof req.query.anomalyType === 'string' ? req.query.anomalyType : undefined;
      res.json({ rows: exploreAnomaly(anomalyType) });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.get('/api/explorer/latency', (req, res) => {
    try {
      const hops = req.query.hops ? Number(req.query.hops) : undefined;
      res.json({ rows: exploreLatency(hops) });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  app.post('/api/explorer/query', (req, res) => {
    try {
      const sql = String(req.body?.sql ?? '');
      if (!sql.trim()) {
        return res.status(400).json({ error: 'SQL query cannot be empty.' });
      }
      const result = runCustomSqlQuery(sql);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Swift Datathon Platform listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
