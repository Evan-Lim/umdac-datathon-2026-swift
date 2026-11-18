import test from 'node:test';
import assert from 'node:assert/strict';
import { runTwinSimulation } from './twinEngine';
import { exploreAmount, exploreAnomaly, exploreLatency, runCustomSqlQuery } from './explorerEngine';
import { loadOverviewPayload } from './swiftData';

test('SwiftGenerativeTwin reproduces log-normal +2.0 ladder parameters accurately', () => {
  const sim = runTwinSimulation(20000, 42, false);
  assert.equal(sim.n, 20000);
  assert.equal(sim.validation.length, 4);
  for (const row of sim.validation) {
    assert.ok(row.errorPct < 15, `Expected errorPct < 15 for ${row.pair}, got ${row.errorPct}%`);
    assert.ok(row.simulatedLogStd > 2.1 && row.simulatedLogStd < 2.5);
  }
  const direct = sim.modalityBreakdown.find((m) => m.modality === 'Direct');
  assert.ok(direct && direct.sharePct > 60 && direct.sharePct < 67);
});

test('Interactive explorer queries return deterministic empirical and simulated tables', () => {
  const amtRows = exploreAmount('BB', 'USD');
  assert.ok(amtRows.length > 0);
  assert.equal(amtRows[0].entity_pair, 'B -> B');
  assert.equal(amtRows[0].CURRENCY_CODE, 'USD');

  const anomRows = exploreAnomaly();
  assert.equal(anomRows.length, 6);
  const totalAnom = anomRows.reduce((acc, r) => acc + Number(r.count), 0);
  assert.equal(totalAnom, 7006);

  const latencyRows = exploreLatency(2);
  assert.ok(latencyRows.length > 0);
  assert.equal(latencyRows[0].hops, 2);

  const sqlRes = runCustomSqlQuery('SELECT CURRENCY_CODE, count(*) FROM payments GROUP BY 1');
  assert.ok(sqlRes.rows.length === 8);
});

test('Overview payload loads exactly 8 dashboard pages and 15 presentation slides', () => {
  const overview = loadOverviewPayload();
  assert.equal(overview.dashboardPages.length, 8);
  assert.equal(overview.slides.length, 15);
  assert.equal(overview.anomalyCensus.length, 6);
  assert.equal(overview.pdfs.revisedDashboardPdf, '/api/export/dashboard.pdf');
  assert.equal(overview.pdfs.revisedSlidesPdf, '/api/export/slides.pdf');

  const staticOverview = loadOverviewPayload({ staticExport: true });
  assert.equal(
    staticOverview.pdfs.revisedDashboardPdf,
    '/output/dashboards/swift_dashboard_m3_revised.pdf'
  );
  assert.equal(
    staticOverview.pdfs.revisedSlidesPdf,
    '/output/slides/swift_slides_m3_revised.pdf'
  );
});
