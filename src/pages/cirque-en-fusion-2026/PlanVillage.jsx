// Plan schématique du village (d'après le Guide du village) — non à l'échelle.
const Pastille = ({ x, y, n, c, onEnter, actif }) => (
  <g
    className={`cef-plan-pin ${actif === n ? 'is-active' : ''}`}
    onMouseEnter={() => onEnter(n)}
    onFocus={() => onEnter(n)}
    tabIndex={0}
    role="button"
    aria-label={`Repère ${n}`}
  >
    <circle cx={x} cy={y} r="17" fill={c} stroke="#fff" strokeWidth="3" />
    <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{n}</text>
  </g>
);

export default function PlanVillage({ actif, onSelect }) {
  const p = { onEnter: onSelect, actif };
  const zone = (n) => (actif === n ? 'is-hl' : '');
  return (
    <svg viewBox="60 195 805 950" className="cef-plan" role="img" aria-label="Plan schématique du village du festival">
      <rect x="68" y="205" width="788" height="930" rx="14" fill="var(--cef-paper)" stroke="var(--cef-ink)" strokeDasharray="6 6" strokeWidth="2" />
      {/* Grande salle */}
      <rect className={zone(1)} x="98" y="235" width="340" height="225" rx="6" fill="#FCE4EF" stroke="var(--cef-ink)" strokeWidth="3" />
      <text x="268" y="325" textAnchor="middle" className="cef-plan-lbl">LA GRANDE</text>
      <text x="268" y="352" textAnchor="middle" className="cef-plan-lbl">SALLE</text>
      {/* Zone stands */}
      <rect className={zone(7)} x="98" y="478" width="340" height="620" rx="6" fill="#FFF5CC" stroke="#C9A500" strokeDasharray="8 5" strokeWidth="2.5" />
      <text x="318" y="608" textAnchor="middle" className="cef-plan-lbl" fill="#7A6400">ZONE</text>
      <text x="318" y="636" textAnchor="middle" className="cef-plan-lbl" fill="#7A6400">STANDS</text>
      <rect className={zone(8)} x="226" y="443" width="76" height="32" rx="4" fill="#F4C1D8" stroke="var(--cef-ink)" strokeWidth="2.5" />
      <rect className={zone(5)} x="98" y="578" width="97" height="140" rx="6" fill="#ECEAF1" stroke="var(--cef-ink)" strokeDasharray="6 5" strokeWidth="2" />
      <rect className={zone(3)} x="98" y="768" width="157" height="184" rx="6" fill="#FFF0B8" stroke="var(--cef-ink)" strokeWidth="3" />
      <text x="176" y="866" textAnchor="middle" className="cef-plan-lbl cef-plan-sm">RESTO</text>
      <rect className={zone(5)} x="282" y="1033" width="104" height="72" rx="6" fill="#ECEAF1" stroke="var(--cef-ink)" strokeDasharray="6 5" strokeWidth="2" />
      {/* Espace extérieur */}
      <rect x="485" y="235" width="345" height="863" rx="6" fill="#EEF4FD" stroke="var(--cef-ink)" strokeWidth="3" />
      <rect className={zone(6)} x="493" y="247" width="105" height="133" rx="6" fill="#ECEAF1" stroke="var(--cef-ink)" strokeDasharray="6 5" strokeWidth="2" />
      <circle className={zone(2)} cx="671" cy="618" r="152" fill="#F9CFE1" stroke="var(--cef-ink)" strokeWidth="3" />
      <line x1="485" y1="580" x2="830" y2="580" stroke="var(--cef-ink)" strokeWidth="2" />
      <line x1="485" y1="632" x2="830" y2="632" stroke="var(--cef-ink)" strokeWidth="2" />
      <text x="671" y="613" textAnchor="middle" className="cef-plan-lbl cef-plan-sm" fill="#9C1E57" letterSpacing="3">SCÈNE</text>
      <rect className={zone(3)} x="808" y="798" width="22" height="170" rx="5" fill="#FFF0B8" stroke="var(--cef-ink)" strokeWidth="2" />
      <rect className={zone(4)} x="505" y="962" width="145" height="113" rx="6" fill="#DDF2E6" stroke="var(--cef-ink)" strokeWidth="3" />
      <text x="577" y="1026" textAnchor="middle" className="cef-plan-lbl cef-plan-sm">BUVETTE</text>
      <rect className={zone(3)} x="660" y="988" width="170" height="87" rx="6" fill="#FFF0B8" stroke="var(--cef-ink)" strokeWidth="3" />
      <text x="745" y="1037" textAnchor="middle" className="cef-plan-lbl cef-plan-sm">RESTO</text>

      <Pastille x={268} y={397} n={1} c="#E91E78" {...p} />
      <Pastille x={671} y={545} n={2} c="#E91E78" {...p} />
      <Pastille x={176} y={908} n={3} c="#E0A100" {...p} />
      <Pastille x={819} y={883} n={3} c="#E0A100" {...p} />
      <Pastille x={745} y={1068} n={3} c="#E0A100" {...p} />
      <Pastille x={577} y={1058} n={4} c="#1E9E5A" {...p} />
      <Pastille x={146} y={648} n={5} c="#1E78C2" {...p} />
      <Pastille x={334} y={1070} n={5} c="#1E78C2" {...p} />
      <Pastille x={545} y={313} n={6} c="#6B3FA0" {...p} />
      <Pastille x={318} y={676} n={7} c="#B39300" {...p} />
      <Pastille x={264} y={494} n={8} c="#C2185B" {...p} />
    </svg>
  );
}
