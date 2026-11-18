export interface CsvRow {
  [key: string]: string | number;
}

export interface AnomalyCensusItem {
  anomalyType: string;
  count: number;
  pctOfDataset: number;
  pctOfAnomalies: number;
  medianUsd: number;
  meanUsd: number;
  maxUsd: number;
  medianDurationSec: number;
  meanDurationSec: number;
  entityPattern: string;
  signatureRule: string;
}

export interface DashboardPageConfig {
  pageNum: number;
  featureGroup: string;
  title: string;
  pillar: string;
  cellRef: string;
  formulaExpr: string;
  baselineComparison: string;
  ruleLines: [string, string];
  kpis: Array<{ value: string; label: string; sub: string }>;
  imageUrl: string;
  figureUrl: string;
  footerLines: [string, string];
}

export interface SlideInfo {
  slideNum: number;
  category: string;
  title: string;
  speaker: string;
  layoutType:
    | 'title'
    | 'architecture'
    | 'methodology'
    | 'hypotheses'
    | 'data_audit'
    | 'feature'
    | 'twin'
    | 'recommendations';
  formulaHeader?: string;
  formulaExpr?: string;
  formulaDesc?: string;
  evidenceBullets?: string[];
  economicRationale?: string;
  figureUrl?: string;
  figureCaption?: string;
  imageUrl: string;
  script: string;
  judgeQuestion: string;
  judgeDefense: string;
}

export interface FigureInfo {
  filename: string;
  url: string;
  group: string;
  label: string;
}

export interface OverviewPayload {
  datasetSummary: {
    totalRecords: number;
    sampleSize: number;
    totalTurnOverUsdBillions: number;
    totalAnomalies: number;
    anomalyRatePct: number;
    uniqueCurrencies: number;
    directSharePct: number;
    indirectSharePct: number;
    coveredSharePct: number;
    continuousPct: number;
    discontinuousPct: number;
  };
  tables: {
    g1Amount: CsvRow[];
    g3Topology: CsvRow[];
    g4Duration: CsvRow[];
    g5Modality: CsvRow[];
    g6Fx: CsvRow[];
    g7Tokens: CsvRow[];
  };
  anomalyCensus: AnomalyCensusItem[];
  dashboardPages: DashboardPageConfig[];
  slides: SlideInfo[];
  figures: FigureInfo[];
  reports: {
    rulesCatalog: string;
    hypothesisLedger: string;
    dataIssuesLog: string;
  };
  pdfs: {
    dashboardPdf: string;
    slidesPdf: string;
    technicalReportPdf: string;
    revisedDashboardPdf: string;
    revisedSlidesPdf: string;
  };
}

export interface TwinSimulationResult {
  seed: number;
  n: number;
  includeAnomalies: boolean;
  validation: Array<{
    pair: string;
    count: number;
    empiricalMedianUsd: number;
    simulatedMedianUsd: number;
    errorPct: number;
    simulatedMeanUsd: number;
    simulatedLogMean: number;
    simulatedLogStd: number;
  }>;
  modalityBreakdown: Array<{
    modality: 'Direct' | 'Indirect' | 'Covered';
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
  sampleRecords: Array<{
    id: number;
    ORDERING_TYPE: string;
    BENEFICIARY_TYPE: string;
    ENTITY_PAIR: string;
    CURRENCY_CODE: string;
    USD_AMOUNT: number;
    PARTICIPANT_COUNT: number;
    TRANSACTION_TYPE_CODE: string;
    CURRENCY_CONVERSION_COUNT: number;
    TOTAL_DURATION: number;
    CONTINUITY_QFLAG: string;
    ANOMALY_TYPE: string | null;
    EPOCH_SECONDS: number;
  }>;
}
