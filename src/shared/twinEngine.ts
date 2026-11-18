export type EntityType = 'B' | 'C';
export type ModalityType = 'Direct' | 'Indirect' | 'Covered';

export interface SimulatedPayment {
  id: number;
  ORDERING_TYPE: EntityType;
  BENEFICIARY_TYPE: EntityType;
  ENTITY_PAIR: string;
  CURRENCY_CODE: string;
  USD_AMOUNT: number;
  PARTICIPANT_COUNT: number;
  TRANSACTION_TYPE_CODE: ModalityType;
  CURRENCY_CONVERSION_COUNT: number;
  TOTAL_DURATION: number;
  CONTINUITY_QFLAG: 'Y' | 'N';
  ANOMALY_TYPE: string | null;
  EPOCH_SECONDS: number;
}

export interface PairValidationRow {
  pair: string;
  count: number;
  empiricalMedianUsd: number;
  simulatedMedianUsd: number;
  errorPct: number;
  simulatedMeanUsd: number;
  simulatedLogMean: number;
  simulatedLogStd: number;
}

export interface TwinSimulationResult {
  seed: number;
  n: number;
  includeAnomalies: boolean;
  validation: PairValidationRow[];
  modalityBreakdown: Array<{
    modality: ModalityType;
    count: number;
    sharePct: number;
    medianUsd: number;
    medianDuration: number;
  }>;
  currencyBreakdown: Array<{
    currency: string;
    count: number;
    sharePct: number;
    totalUsd: number;
  }>;
  amountHistogram: Array<{
    bucketLabel: string;
    logMin: number;
    logMax: number;
    cc: number;
    bc_cb: number;
    bb: number;
  }>;
  anomalyCount: number;
  sampleRecords: SimulatedPayment[];
}

const AMOUNT_PARAMS: Record<string, { mu: number; sigma: number }> = {
  'C->C': { mu: 6.055, sigma: 2.296 },
  'B->C': { mu: 7.992, sigma: 2.290 },
  'C->B': { mu: 8.041, sigma: 2.294 },
  'B->B': { mu: 9.994, sigma: 2.285 },
};

const PAIR_CHOICES: Array<{ ord: EntityType; ben: EntityType; key: string; prob: number }> = [
  { ord: 'B', ben: 'C', key: 'B->C', prob: 0.561 },
  { ord: 'B', ben: 'B', key: 'B->B', prob: 0.225 },
  { ord: 'C', ben: 'C', key: 'C->C', prob: 0.151 },
  { ord: 'C', ben: 'B', key: 'C->B', prob: 0.063 },
];

const CURRENCY_WEIGHTS: Array<{ code: string; weight: number }> = [
  { code: 'EUR', weight: 0.321 },
  { code: 'USD', weight: 0.172 },
  { code: 'GBP', weight: 0.088 },
  { code: 'CHF', weight: 0.079 },
  { code: 'SGD', weight: 0.037 },
  { code: 'CNY', weight: 0.033 },
  { code: 'HKD', weight: 0.020 },
  { code: 'JPY', weight: 0.018 },
];

// Ground-truth medians from output/tables/g1_amount_stats.csv
const EMPIRICAL_MEDIANS: Record<string, number> = {
  'B->B': 22732.37,
  'C->B': 3254.65,
  'B->C': 3122.2,
  'C->C': 454.47,
};

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleNormal(rng: () => number, mu: number, sigma: number): number {
  const u1 = Math.max(1e-12, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mu + sigma * z0;
}

function sampleExponential(rng: () => number, scale: number): number {
  const u = Math.max(1e-12, 1 - rng());
  return -Math.log(u) * scale;
}

function sampleWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((acc, w) => acc + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sq = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(sq);
}

export function generateBatch(
  n = 1000,
  seed = 42,
  includeAnomalies = false,
  anomalyRate = 0.007
): SimulatedPayment[] {
  const rng = createRng(seed);
  const pairWeights = PAIR_CHOICES.map((p) => p.prob);
  const currCodes = CURRENCY_WEIGHTS.map((c) => c.code);
  const currWeights = CURRENCY_WEIGHTS.map((c) => c.weight);

  const baseEpoch = 1735689600; // 2025-01-01T00:00:00Z
  const records: SimulatedPayment[] = [];

  for (let i = 0; i < n; i++) {
    const pair = sampleWeighted(rng, PAIR_CHOICES, pairWeights);
    const curr = sampleWeighted(rng, currCodes, currWeights);

    const p = AMOUNT_PARAMS[pair.key];
    const logAmt = sampleNormal(rng, p.mu, p.sigma);
    let amt = Math.max(0.01, Math.round(Math.exp(logAmt) * 100) / 100);

    const r = rng();
    let txType: ModalityType;
    let hops: number;
    let baseLatency: number;

    if (r < 0.631) {
      txType = 'Direct';
      hops = 2;
      baseLatency = 39.0;
    } else if (r < 0.958) {
      txType = 'Indirect';
      hops = sampleWeighted(rng, [3, 4, 5, 6], [0.55, 0.25, 0.15, 0.05]);
      baseLatency = 100.0 + (hops - 3) * 300.0;
    } else {
      txType = 'Covered';
      hops = sampleWeighted(rng, [3, 4, 5], [0.6, 0.3, 0.1]);
      baseLatency = 280.0 + (hops - 3) * 320.0;
      amt = Math.round(amt * 1.248 * 100) / 100;
    }

    const fxCount =
      txType === 'Direct'
        ? sampleWeighted(rng, [0, 1], [0.16, 0.84])
        : sampleWeighted(rng, [1, 2, 3], [0.2, 0.55, 0.25]);

    const fxDelay = fxCount >= 2 ? 148.0 : 0.0;
    const noise = sampleExponential(rng, 150.0);
    let duration = Math.round((baseLatency + fxDelay + noise) * 10) / 10;
    const continuity: 'Y' | 'N' = rng() < 0.876 ? 'Y' : 'N';
    let anomalyType: string | null = null;

    if (includeAnomalies && rng() < anomalyRate) {
      const aRoll = rng();
      if (pair.ord === 'C' && aRoll < 0.55) {
        anomalyType = 'ROMANCE_SCAM';
        amt = Math.round(Math.exp(sampleNormal(rng, 4.7, 1.4)) * 100) / 100;
        duration = Math.round((duration + 780 + sampleExponential(rng, 220)) * 10) / 10;
      } else if (pair.ord === 'B' && aRoll < 0.45) {
        anomalyType = 'CEO_SCAM';
        amt = Math.round(Math.exp(sampleNormal(rng, 9.93, 1.5)) * 100) / 100;
        duration = Math.round((duration + 420 + sampleExponential(rng, 180)) * 10) / 10;
      } else if (aRoll < 0.78) {
        anomalyType = 'FAT_FINGER_MISTAKE';
        const mult = sampleWeighted(rng, [10, 100, 1000], [0.5, 0.4, 0.1]);
        amt = Math.round(amt * mult * 100) / 100;
      } else if (aRoll < 0.9) {
        anomalyType = 'DUPLICATE_PAYMENT';
      } else if (aRoll < 0.96) {
        anomalyType = 'ACCOUNT_REPLACEMENT_SCAM';
        duration = Math.round((duration + 380) * 10) / 10;
      } else {
        anomalyType = 'CUSTOMER_RECALL';
      }
    }

    const epochOffset = Math.floor(rng() * 30 * 86400);

    records.push({
      id: i + 1,
      ORDERING_TYPE: pair.ord,
      BENEFICIARY_TYPE: pair.ben,
      ENTITY_PAIR: pair.key,
      CURRENCY_CODE: curr,
      USD_AMOUNT: amt,
      PARTICIPANT_COUNT: hops,
      TRANSACTION_TYPE_CODE: txType,
      CURRENCY_CONVERSION_COUNT: fxCount,
      TOTAL_DURATION: duration,
      CONTINUITY_QFLAG: continuity,
      ANOMALY_TYPE: anomalyType,
      EPOCH_SECONDS: baseEpoch + epochOffset,
    });
  }

  return records;
}

export function runTwinSimulation(
  n = 5000,
  seed = 42,
  includeAnomalies = false
): TwinSimulationResult {
  const clampedN = Math.max(100, Math.min(25000, Math.floor(n)));
  const records = generateBatch(clampedN, seed, includeAnomalies, 0.012);

  const normalRecords = records.filter((r) => r.ANOMALY_TYPE === null && r.USD_AMOUNT > 0);
  const pairsOrder = ['B->B', 'C->B', 'B->C', 'C->C'];

  const validation: PairValidationRow[] = pairsOrder.map((pairKey) => {
    const group = normalRecords.filter((r) => r.ENTITY_PAIR === pairKey);
    const amounts = group.map((g) => g.USD_AMOUNT);
    const logs = amounts.map((a) => Math.log(a));
    const simMed = Math.round(median(amounts) * 100) / 100;
    const empMed = EMPIRICAL_MEDIANS[pairKey];
    const errPct = empMed > 0 ? Math.round((Math.abs(simMed - empMed) * 10000) / empMed) / 100 : 0;

    return {
      pair: pairKey,
      count: group.length,
      empiricalMedianUsd: empMed,
      simulatedMedianUsd: simMed,
      errorPct: errPct,
      simulatedMeanUsd: Math.round(mean(amounts) * 100) / 100,
      simulatedLogMean: Math.round(mean(logs) * 10000) / 10000,
      simulatedLogStd: Math.round(stddev(logs) * 10000) / 10000,
    };
  });

  const modalities: ModalityType[] = ['Direct', 'Indirect', 'Covered'];
  const modalityBreakdown = modalities.map((mod) => {
    const group = records.filter((r) => r.TRANSACTION_TYPE_CODE === mod);
    return {
      modality: mod,
      count: group.length,
      sharePct: Math.round((group.length * 10000) / records.length) / 100,
      medianUsd: Math.round(median(group.map((g) => g.USD_AMOUNT)) * 100) / 100,
      medianDuration: Math.round(median(group.map((g) => g.TOTAL_DURATION)) * 10) / 10,
    };
  });

  const currMap = new Map<string, { count: number; totalUsd: number }>();
  for (const r of records) {
    const cur = currMap.get(r.CURRENCY_CODE) ?? { count: 0, totalUsd: 0 };
    cur.count += 1;
    cur.totalUsd += r.USD_AMOUNT;
    currMap.set(r.CURRENCY_CODE, cur);
  }
  const currencyBreakdown = Array.from(currMap.entries())
    .map(([currency, stats]) => ({
      currency,
      count: stats.count,
      sharePct: Math.round((stats.count * 10000) / records.length) / 100,
      totalUsd: Math.round(stats.totalUsd * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count);

  const amountHistogram: TwinSimulationResult['amountHistogram'] = [];
  for (let b = 0; b < 18; b += 1.5) {
    const logMin = b;
    const logMax = b + 1.5;
    let cc = 0;
    let bc_cb = 0;
    let bb = 0;
    for (const r of normalRecords) {
      const l = Math.log(r.USD_AMOUNT);
      if (l >= logMin && l < logMax) {
        if (r.ENTITY_PAIR === 'C->C') cc += 1;
        else if (r.ENTITY_PAIR === 'B->B') bb += 1;
        else bc_cb += 1;
      }
    }
    amountHistogram.push({
      bucketLabel: `${logMin.toFixed(1)}`,
      logMin,
      logMax,
      cc,
      bc_cb,
      bb,
    });
  }

  return {
    seed,
    n: records.length,
    includeAnomalies,
    validation,
    modalityBreakdown,
    currencyBreakdown,
    amountHistogram,
    anomalyCount: records.filter((r) => r.ANOMALY_TYPE !== null).length,
    sampleRecords: records.slice(0, 40),
  };
}
