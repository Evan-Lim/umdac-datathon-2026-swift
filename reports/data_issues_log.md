# Swift Payments Data Issues & Integrity Audit Log
### Evaluation Rubric 3.1 Compliance Documentation (5% Weight)

**Audit Date:** 2026-11-13  
**Target Dataset:** `swift_umdac_datathon_2026_fictitious_payment_data.csv` (10,000,000 records)  
**Storage Optimization:** Converted to columnar Snappy/ZSTD Parquet (`swift_payments.parquet`, 1.2 GB, 74% compression).

---

## 1. Identified Data Issues & Resolution Decisions

| Issue ID | Problem Description | Impact on Naive Analysis | Resolution / Decision Taken | Sensitivity & Modeling Effect |
|---|---|---|---|---|
| **ISS-01** | **Embedded Multiline Strings** (`\n`) in `ORDERING_DETAILS` and `BENEFICIARY_DETAILS`. | Standard line-by-line CSV parsers split single records into fragmented rows, corrupting 10M-row alignment. | Parsed strictly via DuckDB RFC 4180 multiline quote parsing engine with explicit schema enforcement. | **Zero row loss.** All 10,000,000 records verified intact with exact column alignment. |
| **ISS-02** | **Header Row Synthetic Disclaimer Artefact** | Column 1 `DISCLAIMER` contains synthetic notice text on row 1, null/empty elsewhere. | Excluded `DISCLAIMER` column during Parquet feature extraction. | Cleans memory footprint and simplifies feature matrix without loss of transaction attributes. |
| **ISS-03** | **Discontinuous Path Placeholder** (`...` in `BIC8_PATH`) | 12.4% of paths have unobservable intermediary hops (`CONTINUITY_QFLAG == 'N'`). | Retained `CONTINUITY_QFLAG` as an explicit routing feature; stratified duration analyses by continuity. | Prevents bias in intermediary hop latency models. Discontinuous paths exhibit different variance. |
| **ISS-04** | **Extreme Amount Outliers (Typographical Errors)** | Transaction values reach up to $15.6B due to synthetic decimal shift errors. | Isolated under `ANOMALY_TYPE == 'FAT_FINGER_MISTAKE'` and evaluated against baseline log-normal amounts. | Parametric distribution fitting uses robust median and log-transforms to prevent skew. |
| **ISS-05** | **Zero / Sub-second Total Durations** | Certain direct transfers complete in $\le 1$ second, creating zero-duration log-transform singularities. | Formulated duration models using $\log(1 + \text{TOTAL\_DURATION})$ or piecewise mixture distributions. | Preserves valid instantaneous settlements without numerical error. |

---

## 2. Complete Anomaly Census (Full 10M Transactions)

| Anomaly Typology | Total Records | Share of Full Dataset | Primary Entity Pattern |
|---|---|---|---|
| **NORMAL (Legitimate)** | 9,992,994 | 99.9299% | B2C (56%), B2B (23%), C2C (15%), C2B (6%) |
| **ROMANCE_SCAM** | 2,476 | 0.0248% | Strictly 100% Consumer-originated (73.1% C2C, 26.9% C2B) |
| **FAT_FINGER_MISTAKE** | 1,940 | 0.0194% | Universal (56.6% B2C, 22.9% B2B, 15.3% C2C, 5.2% C2B) |
| **CEO_SCAM** | 945 | 0.0095% | Strictly 100% Business-originated (72.3% B2C, 27.7% B2B) |
| **DUPLICATE_PAYMENT** | 679 | 0.0068% | Repeated identical hashes within $\Delta t < 450$s |
| **ACCOUNT_REPLACEMENT_SCAM** | 649 | 0.0065% | Altered beneficiary identifier on expected vendor corridors |
| **CUSTOMER_RECALL** | 317 | 0.0032% | Post-settlement operational reversal flags |
| **TOTAL ANOMALIES** | **7,006** | **0.0701%** | Isolated in `anomalies_all.parquet` |

---

## 3. Core Descriptive Metrics Summary
- **Unique ISO Currencies:** 56 (Led by EUR: 32.1%, USD: 17.2%, GBP: 8.8%, CHF: 7.9%)
- **Path Continuity:** Continuous (`Y`): 87.6% | Discontinuous (`N`): 12.4%
- **Transaction Types:** Direct: 63.1% | Indirect: 32.7% | Covered: 4.1%
