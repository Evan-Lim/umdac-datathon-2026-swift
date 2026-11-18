import test from 'node:test';
import assert from 'node:assert/strict';
import { countPdfPages, resolveChromiumExecutable } from './pdfExporter';

test('countPdfPages accurately counts PDF leaf Page objects', () => {
  const sample8 = Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Pages /Count 8 >> endobj\n' +
      Array.from({ length: 8 }, (_, i) => `${i + 2} 0 obj << /Type /Page >> endobj`).join('\n'),
    'latin1'
  );
  assert.equal(countPdfPages(sample8), 8);

  const sample15 = Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Pages /Count 15 >> endobj\n' +
      Array.from({ length: 15 }, (_, i) => `${i + 2} 0 obj << /Type /Page >> endobj`).join('\n'),
    'latin1'
  );
  assert.equal(countPdfPages(sample15), 15);
});

test('resolveChromiumExecutable finds pre-installed headless shell', () => {
  const exe = resolveChromiumExecutable();
  assert.ok(exe, 'Expected headless Chromium executable to exist in container');
});
