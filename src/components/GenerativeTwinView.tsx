import React, { useEffect, useState } from 'react';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { TwinSimulationResult } from '../types';
import { simulateTwin } from '../services/clientApi';

export const GenerativeTwinView: React.FC = () => {
  const [sampleCount, setSampleCount] = useState(5000);
  const [seed, setSeed] = useState(42);
  const [includeAnomalies, setIncludeAnomalies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TwinSimulationResult | null>(null);

  const runSimulation = async (nVal = sampleCount, seedVal = seed, anomVal = includeAnomalies) => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulateTwin(nVal, seedVal, anomVal);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(5000, 42, false);
  }, []);

  const exportCsv = () => {
    if (!result) return;
    const headers = [
      'id',
      'ORDERING_TYPE',
      'BENEFICIARY_TYPE',
      'CURRENCY_CODE',
      'USD_AMOUNT',
      'PARTICIPANT_COUNT',
      'TRANSACTION_TYPE_CODE',
      'CURRENCY_CONVERSION_COUNT',
      'TOTAL_DURATION',
      'CONTINUITY_QFLAG',
      'ANOMALY_TYPE',
    ];
    const lines = [
      headers.join(','),
      ...result.sampleRecords.map((r) =>
        headers.map((h) => String((r as Record<string, unknown>)[h] ?? '')).join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swift_twin_seed_${result.seed}_n${result.n}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxHistCount = result
    ? Math.max(1, ...result.amountHistogram.map((b) => Math.max(b.cc, b.bc_cb, b.bb)))
    : 1;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="m3-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B2545]">Swift Generative Twin Simulator</h2>
            <p className="mt-0.5 text-xs text-[#475569]">
              Closed-form parametric payment synthesizer: Log-Normal{' '}
              <span className="font-mono">+2.0</span> tier ladder, routing invariance, FX delays (
              <span className="font-mono">+148s</span>), and empirical validation.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs font-medium text-[#475569]">
              Batch Size (N)
              <input
                type="number"
                min={100}
                max={25000}
                step={500}
                value={sampleCount}
                onChange={(e) => setSampleCount(Number(e.target.value))}
                className="mt-1 w-28 rounded-[2px] border border-[#C4C9D4] bg-white px-2.5 py-1.5 font-mono text-sm text-[#111827]"
              />
            </label>

            <label className="flex flex-col text-xs font-medium text-[#475569]">
              Random Seed
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="mt-1 w-24 rounded-[2px] border border-[#C4C9D4] bg-white px-2.5 py-1.5 font-mono text-sm text-[#111827]"
              />
            </label>

            <label className="mb-1.5 inline-flex items-center gap-2 text-xs font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={includeAnomalies}
                onChange={(e) => setIncludeAnomalies(e.target.checked)}
                className="h-4 w-4 rounded-[2px] border-[#C4C9D4] text-[#005AC1]"
              />
              Inject Synthetic Anomalies
            </label>

            <button
              onClick={() => runSimulation()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-[2px] bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#005AC1] disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Run Simulation
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-[2px] border border-[#BA1A1A] bg-[#FFDAD6]/40 px-3 py-2 text-xs text-[#BA1A1A]">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {result && (
        <>
          {/* Empirical vs Simulated Validation */}
          <div className="m3-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE2EC] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#146C2E]" />
                <h3 className="text-sm font-bold text-[#0B2545]">
                  Empirical Ground Truth vs. Generative Twin Validation (N ={' '}
                  <span className="font-mono tabular-nums">{result.n.toLocaleString()}</span>)
                </h3>
              </div>
              {result.anomalyCount > 0 && (
                <span className="font-mono text-xs text-[#8A5300]">
                  {result.anomalyCount} synthetic anomalies injected · excluded from normal fit
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono text-[11px] uppercase text-[#475569]">
                    <th className="px-4 py-2.5">Entity Pair</th>
                    <th className="px-4 py-2.5 text-right">Simulated Count</th>
                    <th className="px-4 py-2.5 text-right">Empirical Median (USD)</th>
                    <th className="px-4 py-2.5 text-right">Simulated Median (USD)</th>
                    <th className="px-4 py-2.5 text-right">Error %</th>
                    <th className="px-4 py-2.5 text-right">Log Mean (mu)</th>
                    <th className="px-4 py-2.5 text-right">Log Std (sigma)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                  {result.validation.map((row) => (
                    <tr key={row.pair} className="hover:bg-[#F6F8FB]">
                      <td className="px-4 py-2.5 font-semibold text-[#0B2545]">{row.pair}</td>
                      <td className="px-4 py-2.5 text-right text-[#334155]">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#334155]">
                        ${row.empiricalMedianUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#111827]">
                        ${row.simulatedMedianUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`font-semibold ${
                            row.errorPct <= 10 ? 'text-[#146C2E]' : 'text-[#8A5300]'
                          }`}
                        >
                          {row.errorPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#334155]">
                        {row.simulatedLogMean.toFixed(3)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#334155]">
                        {row.simulatedLogStd.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log-Amount Ladder Visualization + Modality Breakdown */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="m3-surface p-5">
              <h3 className="text-sm font-bold text-[#0B2545]">
                Simulated Log-Amount Ladder Distribution (ln USD_AMOUNT)
              </h3>
              <p className="mt-0.5 mb-4 text-xs text-[#475569]">
                Identical sigma (~2.29) with +2.0 log-mean shifts: C-&gt;C (6.0), B-&gt;C / C-&gt;B (8.0), B-&gt;B (10.0)
              </p>

              <div className="space-y-2">
                {result.amountHistogram.map((b) => (
                  <div key={b.bucketLabel} className="grid grid-cols-12 items-center gap-2 text-xs">
                    <span className="col-span-3 font-mono text-[11px] text-[#475569]">
                      [{b.logMin.toFixed(1)}, {b.logMax.toFixed(1)})
                    </span>
                    <div className="col-span-9 space-y-1">
                      <div className="flex items-center gap-1">
                        <div
                          className="h-2 bg-[#38BDF8]"
                          style={{ width: `${Math.max(2, (b.cc / maxHistCount) * 100)}%` }}
                          title={`C->C: ${b.cc}`}
                        />
                        <div
                          className="h-2 bg-[#005AC1]"
                          style={{ width: `${Math.max(2, (b.bc_cb / maxHistCount) * 100)}%` }}
                          title={`B->C / C->B: ${b.bc_cb}`}
                        />
                        <div
                          className="h-2 bg-[#0B2545]"
                          style={{ width: `${Math.max(2, (b.bb / maxHistCount) * 100)}%` }}
                          title={`B->B: ${b.bb}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#DDE2EC] pt-3 text-xs text-[#475569]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#38BDF8]" /> C-&gt;C (mu=6.0)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#005AC1]" /> B-&gt;C / C-&gt;B (mu=8.0)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#0B2545]" /> B-&gt;B (mu=10.0)
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="m3-surface p-5">
                <h3 className="mb-3 text-sm font-bold text-[#0B2545]">
                  Simulated Routing Modality &amp; Latency
                </h3>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DDE2EC] font-mono uppercase text-[#475569]">
                      <th className="py-2">Modality</th>
                      <th className="py-2 text-right">Share</th>
                      <th className="py-2 text-right">Median USD</th>
                      <th className="py-2 text-right">Median Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                    {result.modalityBreakdown.map((m) => (
                      <tr key={m.modality}>
                        <td className="py-2 font-sans font-semibold text-[#0B2545]">{m.modality}</td>
                        <td className="py-2 text-right">{m.sharePct.toFixed(1)}%</td>
                        <td className="py-2 text-right">${m.medianUsd.toLocaleString()}</td>
                        <td className="py-2 text-right">{m.medianDuration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="m3-surface p-5">
                <h3 className="mb-3 text-sm font-bold text-[#0B2545]">
                  Simulated Currency Distribution (Top 8)
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {result.currencyBreakdown.map((c) => (
                    <div
                      key={c.currency}
                      className="border border-[#DDE2EC] bg-[#F0F4F9] p-2.5 text-center rounded-[2px]"
                    >
                      <div className="font-mono text-xs font-bold text-[#0B2545]">{c.currency}</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-[#005AC1] tabular-nums">
                        {c.sharePct.toFixed(1)}%
                      </div>
                      <div className="font-mono text-[10.5px] text-[#475569]">{c.count} tx</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sample Records Preview */}
          <div className="m3-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B2545]">
                Generated Synthetic Payment Instructions (First 40 Rows)
              </h3>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#C4C9D4] bg-white px-3 py-1.5 text-xs font-medium text-[#0B2545] hover:bg-[#F0F4F9]"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>
            <div className="max-h-80 overflow-auto border border-[#DDE2EC] rounded-[2px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F0F4F9] font-mono text-[10.5px] uppercase text-[#475569]">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Pair</th>
                    <th className="px-3 py-2">CCY</th>
                    <th className="px-3 py-2 text-right">USD Amount</th>
                    <th className="px-3 py-2">Modality</th>
                    <th className="px-3 py-2 text-right">Hops</th>
                    <th className="px-3 py-2 text-right">FX</th>
                    <th className="px-3 py-2 text-right">Duration</th>
                    <th className="px-3 py-2">Cont.</th>
                    <th className="px-3 py-2">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                  {result.sampleRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F6F8FB]">
                      <td className="px-3 py-1.5 text-[#475569]">{r.id}</td>
                      <td className="px-3 py-1.5 font-semibold text-[#0B2545]">{r.ENTITY_PAIR}</td>
                      <td className="px-3 py-1.5">{r.CURRENCY_CODE}</td>
                      <td className="px-3 py-1.5 text-right">
                        ${r.USD_AMOUNT.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-1.5 font-sans">{r.TRANSACTION_TYPE_CODE}</td>
                      <td className="px-3 py-1.5 text-right">{r.PARTICIPANT_COUNT}</td>
                      <td className="px-3 py-1.5 text-right">{r.CURRENCY_CONVERSION_COUNT}</td>
                      <td className="px-3 py-1.5 text-right">{r.TOTAL_DURATION}s</td>
                      <td className="px-3 py-1.5">{r.CONTINUITY_QFLAG}</td>
                      <td className="px-3 py-1.5">
                        {r.ANOMALY_TYPE ? (
                          <span className="font-semibold text-[#BA1A1A]">{r.ANOMALY_TYPE}</span>
                        ) : (
                          <span className="text-[#146C2E]">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
