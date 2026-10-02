/** Stable page-to-pattern mapping so each route keeps its own hero treatment. */
export function heroMotionVariant(key) {
  const route = String(key || "/");
  let hash = 0;
  for (let index = 0; index < route.length; index += 1) hash = (hash * 31 + route.charCodeAt(index)) >>> 0;
  return hash % 4;
}

/** Decorative construction-plan and progress-graph artwork shared by all heroes. */
export default function HeroGraphic({ variant = 0, className = "" }) {
  const motion = ((Number(variant) || 0) % 4 + 4) % 4;
  return (
    <div className={`construction-graphic construction-graphic--${motion} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 760 480" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
        <g className="cg-grid" fill="none">
          <path d="M80 0V480M160 0V480M240 0V480M320 0V480M400 0V480M480 0V480M560 0V480M640 0V480M720 0V480M0 80H760M0 160H760M0 240H760M0 320H760M0 400H760" />
        </g>
        <g className="cg-chart" fill="none">
          <path className="cg-line" d="M42 354L164 314L276 328L390 228L502 248L622 132L720 148" />
          <path className="cg-line cg-line--secondary" d="M42 386L164 360L276 372L390 306L502 318L622 260L720 268" />
          <circle className="cg-node" cx="164" cy="314" r="5" /><circle className="cg-node" cx="390" cy="228" r="5" /><circle className="cg-node" cx="622" cy="132" r="5" />
        </g>
        <g className="cg-bars">
          <rect className="cg-bar" x="112" y="286" width="34" height="112" rx="3" />
          <rect className="cg-bar" x="208" y="238" width="34" height="160" rx="3" />
          <rect className="cg-bar" x="304" y="198" width="34" height="200" rx="3" />
          <rect className="cg-bar" x="400" y="145" width="34" height="253" rx="3" />
          <rect className="cg-bar" x="496" y="102" width="34" height="296" rx="3" />
        </g>
        <g className="cg-blueprint" fill="none">
          <path className="cg-line" d="M360 398V248L444 192L528 248V398M382 398V270H506V398M420 398V330H468V398M344 398H544M390 292H412M476 292H498M382 248H506M444 192V152H478V230" />
          <path className="cg-line cg-line--secondary" d="M340 230H380M340 222V238M380 222V238M548 248V398M540 248H556M540 398H556" />
        </g>
        <path className="cg-scan" d="M24 0V480" />
      </svg>
    </div>
  );
}
