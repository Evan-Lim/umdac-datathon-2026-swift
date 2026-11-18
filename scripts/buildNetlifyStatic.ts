import fs from 'node:fs';
import path from 'node:path';
import { build as viteBuild } from 'vite';
import { loadOverviewPayload } from '../src/server/swiftData';
import { countPdfPages } from '../src/server/pdfExporter';

const ROOT_DIR = process.cwd();
const NETLIFY_DIR = path.join(ROOT_DIR, 'netlify-static');

function copyDirRecursive(srcDir: string, destDir: string) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function assertExistsInStatic(relUrl: string) {
  const cleanRel = relUrl.replace(/^\/+/, '');
  const fullPath = path.join(NETLIFY_DIR, cleanRel);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing static asset in netlify-static/: ${relUrl}`);
  }
}

async function main() {
  const revDashSrc = path.join(ROOT_DIR, 'output', 'dashboards', 'swift_dashboard_m3_revised.pdf');
  const revSlidesSrc = path.join(ROOT_DIR, 'output', 'slides', 'swift_slides_m3_revised.pdf');

  if (!fs.existsSync(revDashSrc)) {
    throw new Error(`Missing ${revDashSrc}. Generate it via /api/export/dashboard.pdf first.`);
  }
  if (!fs.existsSync(revSlidesSrc)) {
    throw new Error(`Missing ${revSlidesSrc}. Generate it via /api/export/slides.pdf first.`);
  }

  const dashPages = countPdfPages(fs.readFileSync(revDashSrc));
  const slidePages = countPdfPages(fs.readFileSync(revSlidesSrc));
  if (dashPages !== 8) {
    throw new Error(`Expected 8 pages in ${revDashSrc}, found ${dashPages}.`);
  }
  if (slidePages !== 15) {
    throw new Error(`Expected 15 pages in ${revSlidesSrc}, found ${slidePages}.`);
  }

  process.env.VITE_STATIC_BUILD = 'true';

  await viteBuild({
    define: {
      'import.meta.env.VITE_STATIC_BUILD': JSON.stringify('true'),
    },
    build: {
      outDir: NETLIFY_DIR,
      emptyOutDir: true,
    },
  });

  // Generate static overview JSON payload
  const overview = loadOverviewPayload({ staticExport: true });
  const dataDir = path.join(NETLIFY_DIR, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'overview.json'), JSON.stringify(overview, null, 2), 'utf-8');

  // Copy deliverable outputs and reports
  copyDirRecursive(path.join(ROOT_DIR, 'output'), path.join(NETLIFY_DIR, 'output'));
  copyDirRecursive(path.join(ROOT_DIR, 'reports'), path.join(NETLIFY_DIR, 'reports'));

  // Netlify SPA & PDF/API fallback routing rules
  const redirects = [
    '/api/overview              /data/overview.json                                200',
    '/api/export/dashboard.pdf  /output/dashboards/swift_dashboard_m3_revised.pdf  200',
    '/api/export/slides.pdf     /output/slides/swift_slides_m3_revised.pdf        200',
    '/*                         /index.html                                        200',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(NETLIFY_DIR, '_redirects'), redirects, 'utf-8');

  const headers = [
    '/output/dashboards/swift_dashboard_m3_revised.pdf',
    '  Content-Type: application/pdf',
    '  Content-Disposition: attachment; filename="swift_payments_m3_dashboard_8pages.pdf"',
    '',
    '/output/slides/swift_slides_m3_revised.pdf',
    '  Content-Type: application/pdf',
    '  Content-Disposition: attachment; filename="swift_presentation_m3_slides_15pages.pdf"',
    '',
    '/data/overview.json',
    '  Content-Type: application/json; charset=utf-8',
    '  Cache-Control: public, max-age=300',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(NETLIFY_DIR, '_headers'), headers, 'utf-8');

  // Verify every referenced asset exists in netlify-static
  assertExistsInStatic('/index.html');
  assertExistsInStatic('/data/overview.json');
  assertExistsInStatic('/_redirects');
  assertExistsInStatic('/_headers');

  for (const p of overview.dashboardPages) {
    assertExistsInStatic(p.imageUrl);
    assertExistsInStatic(p.figureUrl);
  }
  for (const s of overview.slides) {
    assertExistsInStatic(s.imageUrl);
    if (s.figureUrl) assertExistsInStatic(s.figureUrl);
  }
  for (const f of overview.figures) {
    assertExistsInStatic(f.url);
  }
  for (const pdfUrl of Object.values(overview.pdfs)) {
    assertExistsInStatic(pdfUrl);
  }

  console.log(
    `Built static Netlify bundle at ${NETLIFY_DIR} (8-page dashboard PDF & 15-page slides PDF verified, ${overview.figures.length} figures bundled).`
  );
}

main().catch((err) => {
  console.error('Failed to build netlify-static bundle:', err);
  process.exit(1);
});
