import React from 'react';

export const CausalDagSvg: React.FC = () => {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 960 320"
        className="w-full min-w-[680px] select-none"
        role="img"
        aria-label="Reverse-Engineered Swift Causal Directed Acyclic Graph"
      >
        <defs>
          <marker
            id="dag-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#005AC1" />
          </marker>
          <marker
            id="dag-arrow-dark"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
          <marker
            id="dag-arrow-alert"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#BA1A1A" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect x="0" y="0" width="960" height="320" fill="#F0F4F9" rx="2" />

        {/* Connectors */}
        <line x1="244" y1="68" x2="340" y2="68" stroke="#005AC1" strokeWidth="1.8" markerEnd="url(#dag-arrow)" />
        <line x1="244" y1="78" x2="340" y2="235" stroke="#BA1A1A" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#dag-arrow-alert)" />
        <line x1="244" y1="160" x2="340" y2="160" stroke="#005AC1" strokeWidth="1.8" markerEnd="url(#dag-arrow)" />
        <line x1="560" y1="160" x2="680" y2="160" stroke="#005AC1" strokeWidth="1.8" markerEnd="url(#dag-arrow)" />
        <line x1="244" y1="248" x2="340" y2="175" stroke="#475569" strokeWidth="1.5" markerEnd="url(#dag-arrow-dark)" />
        <line x1="560" y1="72" x2="680" y2="145" stroke="#475569" strokeWidth="1.5" markerEnd="url(#dag-arrow-dark)" />
        <line x1="560" y1="248" x2="680" y2="248" stroke="#BA1A1A" strokeWidth="1.5" markerEnd="url(#dag-arrow-alert)" />

        {/* Column 1: Root Exogenous Nodes */}
        <g transform="translate(20, 32)">
          <rect width="224" height="72" fill="#FFFFFF" stroke="#0B2545" strokeWidth="1.5" rx="2" />
          <rect width="224" height="18" fill="#0B2545" />
          <text x="10" y="12.5" fill="#D8E2FF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            ROOT 01 · ENTITY TIER
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Ordering / Beneficiary
          </text>
          <text x="10" y="56" fill="#475569" fontSize="9.5" fontFamily="JetBrains Mono">
            B-&gt;C 56% · B-&gt;B 23% · C-&gt;C 15%
          </text>
        </g>

        <g transform="translate(20, 124)">
          <rect width="224" height="72" fill="#FFFFFF" stroke="#006874" strokeWidth="1.5" rx="2" />
          <rect width="224" height="18" fill="#006874" />
          <text x="10" y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            ROOT 02 · CORRIDOR RMA
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Bilateral Links &amp; Hubs
          </text>
          <text x="10" y="56" fill="#475569" fontSize="9.5" fontFamily="JetBrains Mono">
            Direct 63.1% · Hubs 81.4%
          </text>
        </g>

        <g transform="translate(20, 216)">
          <rect width="224" height="72" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" rx="2" />
          <rect width="224" height="18" fill="#475569" />
          <text x="10" y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            ROOT 03 · CURRENCY PAIR
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            56 ISO Currencies &amp; FX
          </text>
          <text x="10" y="56" fill="#475569" fontSize="9.5" fontFamily="JetBrains Mono">
            EUR 32.1% · USD 17.2% · F=0.82
          </text>
        </g>

        {/* Column 2: Structural Mechanisms */}
        <g transform="translate(344, 32)">
          <rect width="216" height="72" fill="#FFFFFF" stroke="#005AC1" strokeWidth="1.5" rx="2" />
          <rect width="216" height="18" fill="#005AC1" />
          <text x="10" y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            G1 + G7 · VALUATION &amp; TOKENS
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Log-Normal +2.0 Ladder
          </text>
          <text x="10" y="56" fill="#475569" fontSize="10" fontFamily="JetBrains Mono">
            mu=6,8,10 (7.39x) · BizGate=0% C
          </text>
        </g>

        <g transform="translate(344, 124)">
          <rect width="216" height="72" fill="#FFFFFF" stroke="#005AC1" strokeWidth="1.5" rx="2" />
          <rect width="216" height="18" fill="#005AC1" />
          <text x="10" y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            G3 + G5 + G6 · ROUTING
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Hops, Modality &amp; FX Steps
          </text>
          <text x="10" y="56" fill="#475569" fontSize="10" fontFamily="JetBrains Mono">
            Direct&lt;=&gt;2 · Cov +24.8% · FX&gt;=2
          </text>
        </g>

        <g transform="translate(344, 216)">
          <rect width="216" height="72" fill="#FFFFFF" stroke="#BA1A1A" strokeWidth="1.5" rx="2" />
          <rect width="216" height="18" fill="#BA1A1A" />
          <text x="10" y="12.5" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            G8 · ANOMALY INJECTION
          </text>
          <text x="10" y="38" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Deterministic Prior Gating
          </text>
          <text x="10" y="56" fill="#475569" fontSize="10" fontFamily="JetBrains Mono">
            7,006 tx · Romance=C · CEO=B
          </text>
        </g>

        {/* Column 3: Observable Outcomes */}
        <g transform="translate(684, 124)">
          <rect width="254" height="72" fill="#0B2545" stroke="#0B2545" strokeWidth="1.5" rx="2" />
          <text x="12" y="20" fill="#93C5FD" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            G4 · OBSERVABLE LATENCY
          </text>
          <text x="12" y="40" fill="#FFFFFF" fontSize="12" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Additive Settlement Duration
          </text>
          <text x="12" y="58" fill="#E2E8F0" fontSize="10" fontFamily="JetBrains Mono">
            39s + b_hop(N-2) + 148s*(FX&gt;=2)
          </text>
        </g>

        <g transform="translate(684, 216)">
          <rect width="254" height="72" fill="#FFF1F2" stroke="#BA1A1A" strokeWidth="1.5" rx="2" />
          <text x="12" y="20" fill="#BA1A1A" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            OPERATIONAL &amp; FRAUD EFFECTS
          </text>
          <text x="12" y="40" fill="#111827" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            AML Holds &amp; 10^k Outliers
          </text>
          <text x="12" y="58" fill="#7F1D1D" fontSize="10" fontFamily="JetBrains Mono">
            +788s hold · $15.66B Fat-Finger
          </text>
        </g>

        {/* Falsified Link Callout */}
        <g transform="translate(684, 32)">
          <rect width="254" height="72" fill="#FFFFFF" stroke="#94A3B8" strokeDasharray="4 3" strokeWidth="1.2" rx="2" />
          <text x="12" y="20" fill="#64748B" fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono">
            FALSIFIED HYPOTHESIS (NEG-01)
          </text>
          <text x="12" y="40" fill="#334155" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans">
            Physical Distance = 0 Causal Effect
          </text>
          <text x="12" y="58" fill="#64748B" fontSize="10" fontFamily="JetBrains Mono">
            Great-Circle km vs Duration: r=0.018
          </text>
        </g>
      </svg>
    </div>
  );
};
