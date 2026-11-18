import React, { useEffect, useState } from 'react';
import { Terminal, Search, ShieldAlert, Clock, DollarSign, Play } from 'lucide-react';
import { AnomalyCensusItem } from '../types';
import { queryAmount, queryAnomaly, queryLatency, querySql } from '../services/clientApi';

interface ExplorerViewProps {
  anomalyCensus: AnomalyCensusItem[];
}

type InquiryTab = 'amount' | 'anomaly' | 'latency' | 'sql';

const PRESET_QUERIES = [
  {
    label: 'Currency Volume',
    sql: 'SELECT CURRENCY_CODE, count(*) AS tx_count, median(USD_AMOUNT) AS med_usd FROM payments GROUP BY 1 ORDER BY 2 DESC',
  },
  {
    label: 'Entity Pair Ladder',
    sql: 'SELECT ENTITY_PAIR, count(*) AS tx_count, median(USD_AMOUNT) AS med_usd, avg(TOTAL_DURATION) AS avg_sec FROM payments WHERE ANOMALY_TYPE IS NULL GROUP BY 1 ORDER BY 3 DESC',
  },
  {
    label: 'Modality Breakdown',
    sql: 'SELECT TRANSACTION_TYPE_CODE, count(*) AS tx_count, median(USD_AMOUNT) AS med_usd, median(TOTAL_DURATION) AS med_sec FROM payments GROUP BY 1 ORDER BY 2 DESC',
  },
  {
    label: 'Anomaly Census',
    sql: 'SELECT ANOMALY_TYPE, COUNT, PCT_OF_ANOMALIES, USD_AMOUNT AS med_usd, AVG_DURATION FROM anomalies ORDER BY 2 DESC',
  },
];

export const ExplorerView: React.FC<ExplorerViewProps> = ({ anomalyCensus }) => {
  const [tab, setTab] = useState<InquiryTab>('amount');

  const [pairFilter, setPairFilter] = useState('');
  const [currFilter, setCurrFilter] = useState('');
  const [amountRows, setAmountRows] = useState<Array<Record<string, unknown>>>([]);

  const [anomFilter, setAnomFilter] = useState('');
  const [anomRows, setAnomRows] = useState<Array<Record<string, unknown>>>([]);

  const [hopsFilter, setHopsFilter] = useState('');
  const [latencyRows, setLatencyRows] = useState<Array<Record<string, unknown>>>([]);
  const [calcHops, setCalcHops] = useState(3);
  const [calcFx, setCalcFx] = useState(2);

  const [sqlText, setSqlText] = useState(PRESET_QUERIES[0].sql);
  const [sqlResult, setSqlResult] = useState<{
    columns: string[];
    rows: Array<Record<string, unknown>>;
    rowCount: number;
  } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const fetchAmount = async () => {
    const rows = await queryAmount(pairFilter || undefined, currFilter || undefined);
    setAmountRows(rows);
  };

  const fetchAnomaly = async () => {
    const rows = await queryAnomaly(anomFilter || undefined);
    setAnomRows(rows);
  };

  const fetchLatency = async () => {
    const rows = await queryLatency(hopsFilter ? Number(hopsFilter) : undefined);
    setLatencyRows(rows);
  };

  const executeSql = async (queryOverride?: string) => {
    setSqlError(null);
    const targetSql = queryOverride ?? sqlText;
    try {
      const data = await querySql(targetSql);
      setSqlResult(data);
    } catch (err) {
      setSqlError((err as Error).message);
      setSqlResult(null);
    }
  };

  useEffect(() => {
    fetchAmount();
    fetchAnomaly();
    fetchLatency();
    executeSql(PRESET_QUERIES[0].sql);
  }, []);

  const hopBaseLatency: Record<number, number> = {
    2: 39,
    3: 100,
    4: 413,
    5: 582,
    6: 823,
  };
  const estimatedMedianLatency =
    (hopBaseLatency[calcHops] ?? 39 + (calcHops - 2) * 195) + (calcFx >= 2 ? 148 : 0);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="m3-surface flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-[#0B2545]">
            Dynamic Payment Explorer &amp; SQL Inquiry Console
          </h2>
          <p className="text-xs text-[#475569]">
            Interactive inquiry engine across entity-tier valuation, 7,006 anomaly signatures,
            multi-hop latency, and live SQL queries
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'amount', label: 'Amount Dynamics', icon: DollarSign },
            { id: 'anomaly', label: 'Anomaly Signatures', icon: ShieldAlert },
            { id: 'latency', label: 'Latency & Hops', icon: Clock },
            { id: 'sql', label: 'SQL Console', icon: Terminal },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as InquiryTab)}
                className={`inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-[#0B2545] text-white'
                    : 'bg-[#F0F4F9] text-[#334155] hover:bg-[#DDE5F0]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Amount */}
      {tab === 'amount' && (
        <div className="m3-surface p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs font-medium text-[#475569]">
              Entity Pair
              <select
                value={pairFilter}
                onChange={(e) => setPairFilter(e.target.value)}
                className="mt-1 rounded-[2px] border border-[#C4C9D4] bg-white px-3 py-1.5 text-sm text-[#111827]"
              >
                <option value="">All Pairs</option>
                <option value="BB">B -&gt; B</option>
                <option value="BC">B -&gt; C</option>
                <option value="CB">C -&gt; B</option>
                <option value="CC">C -&gt; C</option>
              </select>
            </label>

            <label className="flex flex-col text-xs font-medium text-[#475569]">
              Currency Code
              <select
                value={currFilter}
                onChange={(e) => setCurrFilter(e.target.value)}
                className="mt-1 rounded-[2px] border border-[#C4C9D4] bg-white px-3 py-1.5 text-sm text-[#111827]"
              >
                <option value="">All Currencies</option>
                {['EUR', 'USD', 'GBP', 'CHF', 'SGD', 'CNY', 'HKD', 'JPY'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={fetchAmount}
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004494]"
            >
              <Search className="h-3.5 w-3.5" />
              Filter Amount
            </button>
          </div>

          <div className="overflow-x-auto border border-[#DDE2EC] rounded-[2px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono uppercase text-[#475569]">
                  <th className="px-3 py-2">Entity Pair</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2 text-right">Tx Count</th>
                  <th className="px-3 py-2 text-right">Min USD</th>
                  <th className="px-3 py-2 text-right">Median USD</th>
                  <th className="px-3 py-2 text-right">Mean USD</th>
                  <th className="px-3 py-2 text-right">Max USD</th>
                  <th className="px-3 py-2 text-right">Log Mean</th>
                  <th className="px-3 py-2 text-right">Log Std</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                {amountRows.map((r, i) => (
                  <tr key={i} className="hover:bg-[#F6F8FB]">
                    <td className="px-3 py-2 font-semibold text-[#0B2545]">
                      {String(r.entity_pair)}
                    </td>
                    <td className="px-3 py-2">{String(r.CURRENCY_CODE)}</td>
                    <td className="px-3 py-2 text-right">{Number(r.tx_count).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${Number(r.min_usd).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#005AC1]">
                      ${Number(r.median_usd).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">${Number(r.mean_usd).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${Number(r.max_usd).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{Number(r.fitted_log_mean).toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">{Number(r.fitted_log_std).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Anomaly */}
      {tab === 'anomaly' && (
        <div className="space-y-5">
          <div className="m3-surface p-5">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-xs font-medium text-[#475569]">
                Anomaly Typology Filter
                <select
                  value={anomFilter}
                  onChange={(e) => setAnomFilter(e.target.value)}
                  className="mt-1 rounded-[2px] border border-[#C4C9D4] bg-white px-3 py-1.5 text-sm text-[#111827]"
                >
                  <option value="">ALL (7,006 Total Anomalies)</option>
                  {anomalyCensus.map((a) => (
                    <option key={a.anomalyType} value={a.anomalyType}>
                      {a.anomalyType}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={fetchAnomaly}
                className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004494]"
              >
                <Search className="h-3.5 w-3.5" />
                Inspect Anomalies
              </button>
            </div>

            <div className="overflow-x-auto border border-[#DDE2EC] rounded-[2px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono uppercase text-[#475569]">
                    <th className="px-3 py-2">Anomaly Type</th>
                    <th className="px-3 py-2 text-right">Records</th>
                    <th className="px-3 py-2 text-right">Share</th>
                    <th className="px-3 py-2 text-right">Median USD</th>
                    <th className="px-3 py-2 text-right">Mean USD</th>
                    <th className="px-3 py-2 text-right">Max USD</th>
                    <th className="px-3 py-2 text-right">Med Dur (s)</th>
                    <th className="px-3 py-2 text-right">Avg Dur (s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                  {anomRows.map((r) => (
                    <tr key={String(r.ANOMALY_TYPE)} className="hover:bg-[#F6F8FB]">
                      <td className="px-3 py-2 font-semibold text-[#BA1A1A]">
                        {String(r.ANOMALY_TYPE)}
                      </td>
                      <td className="px-3 py-2 text-right">{Number(r.count).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(r.pct_of_anomalies).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right">${Number(r.med_amt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${Number(r.avg_amt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">${Number(r.max_amt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{Number(r.med_dur).toFixed(1)}s</td>
                      <td className="px-3 py-2 text-right">{Number(r.avg_dur).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {anomalyCensus.map((a) => (
              <div key={a.anomalyType} className="m3-surface p-4">
                <div className="flex items-center justify-between border-b border-[#DDE2EC] pb-2">
                  <span className="font-mono text-xs font-bold text-[#BA1A1A]">
                    {a.anomalyType}
                  </span>
                  <span className="font-mono text-xs text-[#475569]">
                    {a.count.toLocaleString()} tx · {a.pctOfAnomalies.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-[#0B2545]">{a.entityPattern}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#475569]">{a.signatureRule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Latency */}
      {tab === 'latency' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="m3-surface p-5 lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-xs font-medium text-[#475569]">
                Participant Hops Filter
                <select
                  value={hopsFilter}
                  onChange={(e) => setHopsFilter(e.target.value)}
                  className="mt-1 rounded-[2px] border border-[#C4C9D4] bg-white px-3 py-1.5 text-sm text-[#111827]"
                >
                  <option value="">All (&lt;= 6 Hops)</option>
                  {[2, 3, 4, 5, 6].map((h) => (
                    <option key={h} value={h}>
                      {h} Hops
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={fetchLatency}
                className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004494]"
              >
                <Search className="h-3.5 w-3.5" />
                Query Latency
              </button>
            </div>

            <div className="overflow-x-auto border border-[#DDE2EC] rounded-[2px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE2EC] bg-[#F0F4F9] font-mono uppercase text-[#475569]">
                    <th className="px-3 py-2">Hops</th>
                    <th className="px-3 py-2">Modality</th>
                    <th className="px-3 py-2 text-right">Count</th>
                    <th className="px-3 py-2 text-right">Min (s)</th>
                    <th className="px-3 py-2 text-right">Median (s)</th>
                    <th className="px-3 py-2 text-right">Mean (s)</th>
                    <th className="px-3 py-2 text-right">P95 (s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                  {latencyRows.map((r, i) => (
                    <tr key={i} className="hover:bg-[#F6F8FB]">
                      <td className="px-3 py-2 font-semibold">{String(r.hops)}</td>
                      <td className="px-3 py-2 font-sans">{String(r.TRANSACTION_TYPE_CODE)}</td>
                      <td className="px-3 py-2 text-right">{Number(r.count).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{Number(r.min_sec).toFixed(1)}s</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#005AC1]">
                        {Number(r.median_sec).toFixed(1)}s
                      </td>
                      <td className="px-3 py-2 text-right">{Number(r.mean_sec).toFixed(1)}s</td>
                      <td className="px-3 py-2 text-right">{Number(r.p95_sec).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Group 4 Additive Latency Calculator */}
          <div className="m3-surface p-5">
            <h3 className="text-sm font-bold text-[#0B2545]">
              Additive Latency Estimator (Group 4 Law)
            </h3>
            <p className="mt-1 text-xs text-[#475569]">
              Predicts median settlement latency from institutional hop count and FX conversion
              steps (geographic distance = 0 effect).
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-[#334155]">
                  <span>Participant Hops (N)</span>
                  <span className="font-mono font-bold">{calcHops} banks</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={calcHops}
                  onChange={(e) => setCalcHops(Number(e.target.value))}
                  className="mt-1 w-full accent-[#005AC1]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-[#334155]">
                  <span>FX Conversions</span>
                  <span className="font-mono font-bold">{calcFx} steps</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  value={calcFx}
                  onChange={(e) => setCalcFx(Number(e.target.value))}
                  className="mt-1 w-full accent-[#005AC1]"
                />
              </div>

              <div className="rounded-[2px] bg-[#0B2545] p-4 text-white">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#93C5FD]">
                  Estimated Median Settlement Latency
                </div>
                <div className="mt-1 font-mono text-3xl font-bold tabular-nums">
                  {estimatedMedianLatency.toFixed(1)}s
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                  <div>Base Direct STP: 39.0s</div>
                  <div>
                    Hop Queue Penalty: +{((hopBaseLatency[calcHops] ?? 39) - 39).toFixed(1)}s
                  </div>
                  <div>FX Triangulation (&ge;2 FX): +{calcFx >= 2 ? 148 : 0}.0s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SQL Query Console */}
      {tab === 'sql' && (
        <div className="m3-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#475569]">
              Tables: <code className="bg-[#F0F4F9] px-1.5 py-0.5">payments</code> ·{' '}
              <code className="bg-[#F0F4F9] px-1.5 py-0.5">sample</code> ·{' '}
              <code className="bg-[#F0F4F9] px-1.5 py-0.5">anomalies</code>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((pq) => (
                <button
                  key={pq.label}
                  onClick={() => {
                    setSqlText(pq.sql);
                    executeSql(pq.sql);
                  }}
                  className="rounded-[2px] border border-[#DDE2EC] bg-[#F0F4F9] px-2.5 py-1 text-xs font-medium text-[#0B2545] hover:bg-[#DDE5F0]"
                >
                  {pq.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            rows={3}
            className="w-full rounded-[2px] border border-[#C4C9D4] bg-[#0B2545] p-3 font-mono text-xs text-[#93C5FD] focus:border-[#005AC1] focus:outline-none"
          />

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => executeSql()}
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#005AC1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004494]"
            >
              <Play className="h-3.5 w-3.5" />
              Run Query
            </button>
            {sqlResult && (
              <span className="font-mono text-xs text-[#475569]">
                Returned {sqlResult.rows.length} of {sqlResult.rowCount} rows
              </span>
            )}
          </div>

          {sqlError && (
            <div className="mt-3 rounded-[2px] border border-[#BA1A1A] bg-[#FFDAD6]/40 px-3 py-2 text-xs text-[#BA1A1A]">
              {sqlError}
            </div>
          )}

          {sqlResult && sqlResult.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto border border-[#DDE2EC] rounded-[2px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F0F4F9] font-mono uppercase text-[#475569]">
                  <tr>
                    {sqlResult.columns.map((col) => (
                      <th key={col} className="px-3 py-2">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2EC] font-mono tabular-nums">
                  {sqlResult.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F8FB]">
                      {sqlResult.columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-[#111827]">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
