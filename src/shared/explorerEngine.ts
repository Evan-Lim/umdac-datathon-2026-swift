import { ANOMALY_CENSUS } from './anomalyCensus';
import { generateBatch, median, SimulatedPayment } from './twinEngine';

let cachedSample: SimulatedPayment[] | null = null;

function getExplorerSample(): SimulatedPayment[] {
  if (!cachedSample) {
    cachedSample = generateBatch(25000, 42, true, 0.025);
  }
  return cachedSample;
}

export function exploreAmount(pair?: string, currency?: string) {
  const rows = getExplorerSample().filter((r) => {
    if (r.ANOMALY_TYPE !== null || r.USD_AMOUNT <= 0) return false;
    if (pair) {
      const normalized = pair.toUpperCase().replace(/[^BC]/g, '');
      if (normalized.length >= 2) {
        const ord = normalized[0];
        const ben = normalized[normalized.length - 1];
        if (r.ORDERING_TYPE !== ord || r.BENEFICIARY_TYPE !== ben) return false;
      }
    }
    if (currency && r.CURRENCY_CODE !== currency.toUpperCase()) return false;
    return true;
  });

  const groups = new Map<string, SimulatedPayment[]>();
  for (const r of rows) {
    const key = `${r.ORDERING_TYPE} -> ${r.BENEFICIARY_TYPE}|${r.CURRENCY_CODE}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([key, list]) => {
      const [entity_pair, CURRENCY_CODE] = key.split('|');
      const amts = list.map((x) => x.USD_AMOUNT);
      const logs = amts.map((x) => Math.log(x));
      const meanAmt = amts.reduce((a, b) => a + b, 0) / amts.length;
      const logMean = logs.reduce((a, b) => a + b, 0) / logs.length;
      const stdAmt =
        amts.length > 1
          ? Math.sqrt(amts.reduce((a, b) => a + (b - meanAmt) ** 2, 0) / (amts.length - 1))
          : 0;
      const logStd =
        logs.length > 1
          ? Math.sqrt(logs.reduce((a, b) => a + (b - logMean) ** 2, 0) / (logs.length - 1))
          : 0;

      return {
        entity_pair,
        CURRENCY_CODE,
        tx_count: list.length,
        min_usd: Math.round(Math.min(...amts) * 100) / 100,
        median_usd: Math.round(median(amts) * 100) / 100,
        mean_usd: Math.round(meanAmt * 100) / 100,
        max_usd: Math.round(Math.max(...amts) * 100) / 100,
        std_usd: Math.round(stdAmt * 100) / 100,
        fitted_log_mean: Math.round(logMean * 10000) / 10000,
        fitted_log_std: Math.round(logStd * 10000) / 10000,
      };
    })
    .sort((a, b) => b.tx_count - a.tx_count)
    .slice(0, 15);
}

export function exploreAnomaly(anomalyType?: string) {
  const filtered = anomalyType
    ? ANOMALY_CENSUS.filter((a) => a.anomalyType === anomalyType.toUpperCase())
    : ANOMALY_CENSUS;
  return filtered.map((a) => ({
    ANOMALY_TYPE: a.anomalyType,
    count: a.count,
    pct_of_anomalies: a.pctOfAnomalies,
    med_amt: a.medianUsd,
    avg_amt: a.meanUsd,
    max_amt: a.maxUsd,
    med_dur: a.medianDurationSec,
    avg_dur: a.meanDurationSec,
    entity_pattern: a.entityPattern,
  }));
}

export function exploreLatency(hops?: number) {
  const rows = getExplorerSample().filter((r) =>
    hops ? r.PARTICIPANT_COUNT === hops : r.PARTICIPANT_COUNT <= 6
  );

  const groups = new Map<string, SimulatedPayment[]>();
  for (const r of rows) {
    const key = `${r.PARTICIPANT_COUNT}|${r.TRANSACTION_TYPE_CODE}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  return Array.from(groups.entries())
    .map(([key, list]) => {
      const [hStr, txType] = key.split('|');
      const durs = list.map((x) => x.TOTAL_DURATION).sort((a, b) => a - b);
      const meanDur = durs.reduce((a, b) => a + b, 0) / durs.length;
      const p95Idx = Math.min(durs.length - 1, Math.floor(durs.length * 0.95));

      return {
        hops: Number(hStr),
        TRANSACTION_TYPE_CODE: txType,
        count: list.length,
        min_sec: Math.round(durs[0] * 10) / 10,
        median_sec: Math.round(median(durs) * 10) / 10,
        mean_sec: Math.round(meanDur * 10) / 10,
        p95_sec: Math.round(durs[p95Idx] * 10) / 10,
      };
    })
    .sort((a, b) => a.hops - b.hops || a.TRANSACTION_TYPE_CODE.localeCompare(b.TRANSACTION_TYPE_CODE));
}

function splitTopLevel(expr: string, sep = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "'" && expr[i - 1] !== '\\') inQuotes = !inQuotes;
    if (!inQuotes) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
    }
    if (!inQuotes && depth === 0 && expr.slice(i, i + sep.length) === sep) {
      parts.push(current.trim());
      current = '';
      i += sep.length - 1;
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evalRowExpr(row: Record<string, unknown>, rawExpr: string): unknown {
  const expr = rawExpr.trim();
  if (expr.includes('||')) {
    const pieces = expr.split('||').map((p) => {
      const t = p.trim();
      if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1);
      return String(row[t] ?? '');
    });
    return pieces.join('');
  }
  if (expr.startsWith("'") && expr.endsWith("'")) return expr.slice(1, -1);
  if (!Number.isNaN(Number(expr)) && expr !== '') return Number(expr);
  return row[expr] ?? null;
}

function matchesWhere(row: Record<string, unknown>, whereSql: string): boolean {
  const clauses = whereSql.split(/\s+AND\s+/i);
  for (const rawClause of clauses) {
    const clause = rawClause.trim();
    if (/IS\s+NULL$/i.test(clause)) {
      const col = clause.replace(/\s+IS\s+NULL$/i, '').trim();
      if (row[col] !== null && row[col] !== undefined) return false;
      continue;
    }
    if (/IS\s+NOT\s+NULL$/i.test(clause)) {
      const col = clause.replace(/\s+IS\s+NOT\s+NULL$/i, '').trim();
      if (row[col] === null || row[col] === undefined) return false;
      continue;
    }
    const opMatch = clause.match(/^(.+?)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
    if (!opMatch) continue;
    const [, colRaw, op, valRaw] = opMatch;
    const left = evalRowExpr(row, colRaw);
    const right = evalRowExpr(row, valRaw);
    if (op === '=') {
      if (String(left) !== String(right)) return false;
    } else if (op === '!=' || op === '<>') {
      if (String(left) === String(right)) return false;
    } else {
      const lNum = Number(left);
      const rNum = Number(right);
      if (Number.isNaN(lNum) || Number.isNaN(rNum)) return false;
      if (op === '>' && !(lNum > rNum)) return false;
      if (op === '>=' && !(lNum >= rNum)) return false;
      if (op === '<' && !(lNum < rNum)) return false;
      if (op === '<=' && !(lNum <= rNum)) return false;
    }
  }
  return true;
}

export function runCustomSqlQuery(sqlInput: string): {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  executedSql: string;
} {
  const cleanSql = sqlInput.trim().replace(/;+$/, '');
  const match = cleanSql.match(
    /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+GROUP\s+BY\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?$/i
  );

  if (!match) {
    throw new Error(
      'Supported SQL syntax: SELECT <cols|aggregates> FROM payments|sample|anomalies [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n]'
    );
  }

  const [, selectPart, tablePart, wherePart, groupByPart, orderByPart, limitPart] = match;
  const tbl = tablePart.toLowerCase();

  let sourceRows: Array<Record<string, unknown>>;
  if (tbl === 'payments' || tbl === 'sample') {
    sourceRows = getExplorerSample().map((r) => ({ ...r }));
  } else if (tbl === 'anomalies') {
    sourceRows = ANOMALY_CENSUS.map((a) => ({
      ANOMALY_TYPE: a.anomalyType,
      COUNT: a.count,
      PCT_OF_ANOMALIES: a.pctOfAnomalies,
      USD_AMOUNT: a.medianUsd,
      AVG_USD_AMOUNT: a.meanUsd,
      MAX_USD_AMOUNT: a.maxUsd,
      TOTAL_DURATION: a.medianDurationSec,
      AVG_DURATION: a.meanDurationSec,
      ENTITY_PATTERN: a.entityPattern,
    }));
  } else {
    throw new Error(`Unknown table '${tablePart}'. Available tables: payments, sample, anomalies.`);
  }

  const filtered = wherePart
    ? sourceRows.filter((r) => matchesWhere(r, wherePart))
    : sourceRows;

  const selectItems = splitTopLevel(selectPart);
  const hasAgg = selectItems.some((item) =>
    /\b(count|avg|mean|median|min|max|sum)\s*\(/i.test(item)
  );

  let resultRows: Array<Record<string, unknown>> = [];

  if (!hasAgg && !groupByPart) {
    if (selectItems.length === 1 && selectItems[0] === '*') {
      resultRows = filtered;
    } else {
      resultRows = filtered.map((r) => {
        const out: Record<string, unknown> = {};
        for (const item of selectItems) {
          const aliasMatch = item.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
          const expr = aliasMatch ? aliasMatch[1].trim() : item;
          const alias = aliasMatch ? aliasMatch[2].trim() : expr;
          out[alias] = evalRowExpr(r, expr);
        }
        return out;
      });
    }
  } else {
    const groupByTokens = groupByPart
      ? splitTopLevel(groupByPart).map((tok) => {
          const idx = Number(tok);
          if (!Number.isNaN(idx) && idx >= 1 && idx <= selectItems.length) {
            const target = selectItems[idx - 1];
            const aliasMatch = target.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
            return aliasMatch ? aliasMatch[1].trim() : target.trim();
          }
          return tok.trim();
        })
      : [];

    const buckets = new Map<string, Array<Record<string, unknown>>>();
    if (groupByTokens.length === 0) {
      buckets.set('__ALL__', filtered);
    } else {
      for (const r of filtered) {
        const key = groupByTokens.map((expr) => String(evalRowExpr(r, expr) ?? '')).join('||__||');
        const list = buckets.get(key) ?? [];
        list.push(r);
        buckets.set(key, list);
      }
    }

    resultRows = Array.from(buckets.values()).map((groupRows) => {
      const out: Record<string, unknown> = {};
      for (const item of selectItems) {
        const aliasMatch = item.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
        const expr = aliasMatch ? aliasMatch[1].trim() : item.trim();
        const alias = aliasMatch ? aliasMatch[2].trim() : expr;

        const aggMatch = expr.match(
          /^(?:round\s*\(\s*)?(count|avg|mean|median|min|max|sum)\s*\(\s*([^)]+)\s*\)(?:\s*,\s*(\d+)\s*\))?$/i
        );
        if (aggMatch) {
          const [, fnRaw, argRaw, roundDigits] = aggMatch;
          const fn = fnRaw.toLowerCase();
          let val: number;
          if (fn === 'count') {
            val = groupRows.length;
          } else {
            const nums = groupRows
              .map((gr) => Number(evalRowExpr(gr, argRaw)))
              .filter((v) => !Number.isNaN(v));
            if (nums.length === 0) val = 0;
            else if (fn === 'sum') val = nums.reduce((a, b) => a + b, 0);
            else if (fn === 'avg' || fn === 'mean')
              val = nums.reduce((a, b) => a + b, 0) / nums.length;
            else if (fn === 'median') val = median(nums);
            else if (fn === 'min') val = Math.min(...nums);
            else val = Math.max(...nums);
          }
          const digits = roundDigits ? Number(roundDigits) : 2;
          out[alias] = fn === 'count' ? val : Math.round(val * 10 ** digits) / 10 ** digits;
        } else {
          out[alias] = groupRows.length > 0 ? evalRowExpr(groupRows[0], expr) : null;
        }
      }
      return out;
    });
  }

  if (orderByPart) {
    const orderCols = splitTopLevel(orderByPart);
    resultRows.sort((a, b) => {
      const keys = Object.keys(a);
      for (const oc of orderCols) {
        const desc = /\s+DESC$/i.test(oc);
        const rawCol = oc.replace(/\s+(ASC|DESC)$/i, '').trim();
        const idx = Number(rawCol);
        const colName =
          !Number.isNaN(idx) && idx >= 1 && idx <= keys.length ? keys[idx - 1] : rawCol;
        const va = a[colName];
        const vb = b[colName];
        if (typeof va === 'number' && typeof vb === 'number') {
          if (va !== vb) return desc ? vb - va : va - vb;
        } else {
          const cmp = String(va ?? '').localeCompare(String(vb ?? ''));
          if (cmp !== 0) return desc ? -cmp : cmp;
        }
      }
      return 0;
    });
  }

  const limit = limitPart ? Math.min(200, Number(limitPart)) : 50;
  const sliced = resultRows.slice(0, limit);
  const columns = sliced.length > 0 ? Object.keys(sliced[0]) : [];

  return {
    columns,
    rows: sliced,
    rowCount: resultRows.length,
    executedSql: cleanSql,
  };
}
