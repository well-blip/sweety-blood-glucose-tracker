import './check-and-log.css'

// Decorative looping scene for the login page: someone checks their blood sugar with a meter
// and writes the reading into today's log. Pure SVG + CSS keyframes (see check-and-log.css).
export function CheckAndLog() {
  return (
    <svg viewBox="0 0 480 300" className="cal mx-auto w-full max-w-lg overflow-hidden" aria-hidden="true">
      <defs>
        {/* The written "112" is revealed left-to-right through this growing clip, like ink */}
        <clipPath id="cal-ink-clip">
          <rect className="cal-ink" x="398" y="168" width="44" height="24" />
        </clipPath>
        {/* Everything sits inside a rounded frame, so the finger slides in from its top edge */}
        <clipPath id="cal-frame">
          <rect x="1" y="1" width="478" height="298" rx="24" />
        </clipPath>
      </defs>

      <rect x="1" y="1" width="478" height="298" rx="24" className="fill-zinc-900/40 stroke-zinc-800" strokeWidth="1.5" />
      <g clipPath="url(#cal-frame)">

      {/* ---------- glucose meter ---------- */}
      <g>
        {/* test strip (its tip turns red once the drop soaks in) */}
        <rect x="100" y="48" width="30" height="50" rx="4" className="fill-zinc-300" />
        <rect x="100" y="48" width="30" height="12" rx="4" className="cal-strip-tip fill-rose-500" />
        <rect x="108" y="66" width="14" height="22" rx="2" className="fill-zinc-400/60" />

        {/* body */}
        <rect x="40" y="92" width="150" height="190" rx="28" className="fill-zinc-800 stroke-zinc-700" strokeWidth="1.5" />
        {/* screen */}
        <rect x="58" y="114" width="114" height="78" rx="12" className="fill-zinc-950 stroke-zinc-700" />
        <text x="115" y="160" textAnchor="middle" className="cal-dots fill-zinc-300 font-mono text-[26px] tracking-[6px]">
          ···
        </text>
        <g className="cal-value">
          <text x="115" y="164" textAnchor="middle" className="fill-zinc-50 font-mono text-[34px] font-semibold">
            112
          </text>
          <text x="115" y="182" textAnchor="middle" className="fill-zinc-400 text-[11px]">
            mg/dl
          </text>
        </g>
        {/* buttons */}
        <circle cx="115" cy="232" r="16" className="fill-zinc-700" />
        <circle cx="72" cy="232" r="7" className="fill-zinc-700/70" />
        <circle cx="158" cy="232" r="7" className="fill-zinc-700/70" />
      </g>

      {/* ---------- finger + drop of blood ---------- */}
      <g className="cal-finger">
        <rect x="97" y="-30" width="36" height="76" rx="18" fill="#e8b796" />
        <rect x="104" y="-24" width="22" height="18" rx="8" fill="#f3d2bd" />
        <path d="M103 14h24" stroke="#d29c79" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <path className="cal-drop" d="M115 42s-5 6-5 9.5a5 5 0 0 0 10 0c0-3.5-5-9.5-5-9.5Z" fill="#f43f5e" />

      {/* ---------- today's log ---------- */}
      <g>
        <rect x="236" y="56" width="216" height="226" rx="20" className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
        <text x="258" y="90" className="fill-zinc-50 text-[16px] font-semibold">
          Today
        </text>
        <text x="430" y="90" textAnchor="end" className="fill-zinc-500 text-[11px]">
          mg/dl
        </text>

        {[
          { y: 128, label: 'Morning (fasting)', value: '95' },
          { y: 160, label: 'After breakfast', value: '138' },
          { y: 192, label: 'After lunch', value: null },
          { y: 224, label: 'After dinner', value: null },
        ].map((row) => (
          <g key={row.label}>
            <line x1="258" x2="430" y1={row.y + 10} y2={row.y + 10} className="stroke-zinc-800" />
            <text x="258" y={row.y} className="fill-zinc-400 text-[12.5px]">
              {row.label}
            </text>
            {row.value && (
              <text x="430" y={row.y} textAnchor="end" className="fill-zinc-200 font-mono text-[14px]">
                {row.value}
              </text>
            )}
          </g>
        ))}
        <text x="430" y="224" textAnchor="end" className="fill-zinc-600 font-mono text-[14px]">
          –
        </text>

        {/* the row being filled in */}
        <rect className="cal-row-highlight fill-rose-500/10" x="248" y="174" width="194" height="26" rx="6" />
        <g clipPath="url(#cal-ink-clip)">
          <text x="430" y="192" textAnchor="end" className="fill-rose-300 font-mono text-[16px] font-semibold">
            112
          </text>
        </g>
        <path
          className="cal-tick stroke-rose-400"
          d="M262 252l6 6 12-13"
          pathLength={1}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="290" y="257" className="cal-row-highlight fill-zinc-400 text-[12px]">
          Saved to your readings
        </text>
      </g>

      {/* ---------- pen ---------- */}
      <g className="cal-pen">
        <g transform="translate(396 150) rotate(35)">
          <rect x="0" y="0" width="8" height="40" rx="3" className="fill-zinc-200" />
          <rect x="0" y="0" width="8" height="9" rx="3" className="fill-rose-400" />
          <path d="M0 40h8l-4 9Z" className="fill-zinc-400" />
        </g>
      </g>
      </g>
    </svg>
  )
}
