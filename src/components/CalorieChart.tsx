import type { DayLog, Phase } from '../types'
import { calculateTotals, getTargets } from '../utils/calculator'

interface Props {
  days: DayLog[]
  phase: Phase
}

export default function CalorieChart({ days, phase }: Props) {
  const recent = [...days]
    .filter(d => d.entries.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)

  if (recent.length < 2) return null

  const totals = recent.map(d => calculateTotals(d.entries).calories)
  const targets = getTargets(phase)
  const targetMid = Math.round((targets.calories.min + targets.calories.max) / 2)
  const maxVal = Math.max(...totals, targetMid * 1.1)

  const W = 320
  const H = 110
  const padL = 28
  const padR = 8
  const padT = 8
  const padB = 18
  const barWidth = (W - padL - padR) / recent.length

  const yOf = (cal: number) => padT + (1 - cal / maxVal) * (H - padT - padB)

  const avg = Math.round(totals.reduce((s, v) => s + v, 0) / totals.length)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>
          Calories (last {recent.length} days)
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          avg <span style={{ fontWeight: 700, color: 'var(--text)' }}>{avg}</span>
          {' · target '}<span style={{ color: 'var(--accent)' }}>{targetMid}</span>
        </div>
      </div>

      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line
          x1={padL}
          y1={yOf(targets.calories.min)}
          x2={W - padR}
          y2={yOf(targets.calories.min)}
          stroke="var(--accent-dim)"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />
        <line
          x1={padL}
          y1={yOf(targets.calories.max)}
          x2={W - padR}
          y2={yOf(targets.calories.max)}
          stroke="var(--accent-dim)"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />

        {recent.map((d, i) => {
          const cal = totals[i]
          const x = padL + i * barWidth + barWidth * 0.15
          const w = barWidth * 0.7
          const y = yOf(cal)
          const h = H - padB - y
          let color = 'var(--text-muted)'
          if (cal >= targets.calories.min && cal <= targets.calories.max * 1.05) color = 'var(--green)'
          else if (cal < targets.calories.min * 0.85) color = 'var(--text-dim)'
          else if (cal > targets.calories.max * 1.1) color = 'var(--orange)'
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={w}
              height={Math.max(h, 1)}
              rx="2"
              fill={color}
            />
          )
        })}

        <text x={padL - 4} y={yOf(0) + 3} fontSize="9" fill="var(--text-muted)" textAnchor="end">0</text>
        <text x={padL - 4} y={yOf(maxVal) + 6} fontSize="9" fill="var(--text-muted)" textAnchor="end">
          {Math.round(maxVal / 100) * 100}
        </text>
      </svg>
    </div>
  )
}
