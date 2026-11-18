import { OverviewPayload, TwinSimulationResult } from '../types';
import { runTwinSimulation } from '../shared/twinEngine';
import {
  exploreAmount,
  exploreAnomaly,
  exploreLatency,
  runCustomSqlQuery,
} from '../shared/explorerEngine';

const IS_STATIC = import.meta.env.VITE_STATIC_BUILD === 'true';

async function tryJsonFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchOverview(): Promise<OverviewPayload> {
  if (!IS_STATIC) {
    const apiData = await tryJsonFetch<OverviewPayload>('/api/overview');
    if (apiData) return apiData;
  }

  const staticRes = await fetch('/data/overview.json');
  if (!staticRes.ok) {
    throw new Error('Failed to load datathon overview payload');
  }
  return (await staticRes.json()) as OverviewPayload;
}

export async function simulateTwin(
  n: number,
  seed: number,
  includeAnomalies: boolean
): Promise<TwinSimulationResult> {
  if (!IS_STATIC) {
    const apiData = await tryJsonFetch<TwinSimulationResult>('/api/twin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ n, seed, includeAnomalies }),
    });
    if (apiData) return apiData;
  }

  return runTwinSimulation(n, seed, includeAnomalies);
}

export async function queryAmount(
  pair?: string,
  currency?: string
): Promise<Array<Record<string, unknown>>> {
  if (!IS_STATIC) {
    const params = new URLSearchParams();
    if (pair) params.set('pair', pair);
    if (currency) params.set('currency', currency);
    const apiData = await tryJsonFetch<{ rows: Array<Record<string, unknown>> }>(
      `/api/explorer/amount?${params.toString()}`
    );
    if (apiData?.rows) return apiData.rows;
  }

  return exploreAmount(pair, currency);
}

export async function queryAnomaly(
  anomalyType?: string
): Promise<Array<Record<string, unknown>>> {
  if (!IS_STATIC) {
    const params = new URLSearchParams();
    if (anomalyType) params.set('anomalyType', anomalyType);
    const apiData = await tryJsonFetch<{ rows: Array<Record<string, unknown>> }>(
      `/api/explorer/anomaly?${params.toString()}`
    );
    if (apiData?.rows) return apiData.rows;
  }

  return exploreAnomaly(anomalyType);
}

export async function queryLatency(hops?: number): Promise<Array<Record<string, unknown>>> {
  if (!IS_STATIC) {
    const params = new URLSearchParams();
    if (hops) params.set('hops', String(hops));
    const apiData = await tryJsonFetch<{ rows: Array<Record<string, unknown>> }>(
      `/api/explorer/latency?${params.toString()}`
    );
    if (apiData?.rows) return apiData.rows;
  }

  return exploreLatency(hops);
}

export async function querySql(sql: string): Promise<{
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  executedSql: string;
}> {
  if (!IS_STATIC) {
    const res = await fetch('/api/explorer/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    }).catch(() => null);

    if (res) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Query error');
        return data;
      }
    }
  }

  return runCustomSqlQuery(sql);
}

export function getDefaultDashboardPdfUrl(): string {
  return IS_STATIC
    ? '/output/dashboards/swift_dashboard_m3_revised.pdf'
    : '/api/export/dashboard.pdf';
}
