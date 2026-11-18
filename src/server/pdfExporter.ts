import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CHROMIUM_CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter((p): p is string => Boolean(p));

export function resolveChromiumExecutable(): string | undefined {
  for (const candidate of CHROMIUM_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Counts PDF pages from a raw PDF Buffer by inspecting /Type /Page leaf objects
 * (excluding /Type /Pages parent nodes) or /Count in the root Pages dictionary.
 */
export function countPdfPages(pdfBuffer: Buffer): number {
  const text = pdfBuffer.toString('latin1');
  const leafMatches = text.match(/\/Type\s*\/Page\b(?!s)/g);
  if (leafMatches && leafMatches.length > 0) {
    return leafMatches.length;
  }
  const countMatches = text.match(/\/Count\s+(\d+)/g);
  if (countMatches && countMatches.length > 0) {
    const nums = countMatches.map((m) => Number(m.replace(/\/Count\s+/, '')));
    return Math.max(...nums);
  }
  return 0;
}

export async function renderRouteToPdf(options: {
  url: string;
  outPath: string;
  expectedPages: number;
}): Promise<{ buffer: Buffer; pageCount: number }> {
  const executablePath = resolveChromiumExecutable();
  if (!executablePath) {
    throw new Error('Headless Chromium binary not found for HTML-to-PDF rendering.');
  }

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto(options.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForSelector('[data-print-ready="true"]', { timeout: 20000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
        )
      );
    });

    const pdfBytes = await page.pdf({
      width: '13.3333in',
      height: '7.5in',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
    });

    const buffer = Buffer.from(pdfBytes);
    const pageCount = countPdfPages(buffer);

    if (pageCount !== options.expectedPages) {
      throw new Error(
        `PDF page count mismatch for ${options.url}: expected ${options.expectedPages}, got ${pageCount}`
      );
    }

    fs.mkdirSync(path.dirname(options.outPath), { recursive: true });
    fs.writeFileSync(options.outPath, buffer);

    return { buffer, pageCount };
  } finally {
    await browser.close();
  }
}
