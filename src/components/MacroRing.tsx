interface Props {
  value: number
  target: { min: number; max: number }
  label: string
  color: string
  unit?: string
}

export default function MacroRing({ value, target, label, color, unit = '' }: Props) {
  const mid = (target.min + target.max) / 2
  const pct = Math.min(value / mid, 1)
  const r = 26
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div className="macro-ring">
      <div className="ring-container">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--bg-input)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="ring-label">{Math.round(value)}{unit}</span>
      </div>
      <span className="ring-name">{label}</span>
    </div>
  )
}
