import type { WeightEntry } from '../types'

interface Props {
  weights: WeightEntry[]
}

export default function WeightChart({ weights }: Props) {
  if (weights.length < 2) return null

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))

  const W = 320
  const H = 140
  const padL = 32
  const padR = 12
  const padT = 12
  const padB = 22

  const values = sorted.map(w => w.weight)
  const minW = Math.floor(Math.min(...values) * 2) / 2 - 0.5
  const maxW = Math.ceil(Math.max(...values) * 2) / 2 + 0.5
  const range = maxW - minW || 1

  const t0 = new Date(sorted[0].date + 'T00:00:00').getTime()
  const tN = new Date(sorted[sorted.length - 1].date + 'T00:00:00').getTime()
  const span = tN - t0 || 1

  function xOf(date: string) {
    const t = new Date(date + 'T00:00:00').getTime()
    return padL + ((t - t0) / span) * (W - padL - padR)
  }
  function yOf(w: number) {
    return padT + ((maxW - w) / range) * (H - padT - padB)
  }

  const movingAvg: { date: string; avg: number }[] = []
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = Math.max(0, i - 6)
    const window = sorted.slice(windowStart, i + 1)
    const avg = window.reduce((s, w) => s + w.weight, 0) / window.length
    movingAvg.push({ date: sorted[i].date, avg })
  }

  const linePath = movingAvg
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.date).toFixed(1)} ${yOf(p.avg).toFixed(1)}`)
    .join(' ')

  const ticks: number[] = []
  for (let v = Math.ceil(minW); v <= Math.floor(maxW); v++) {
    ticks.push(v)
  }

  const latest = sorted[sorted.length - 1]
  const oldest = sorted[0]
  const change = latest.weight - oldest.weight
  const dateLabel = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Weight trend</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {dateLabel(oldest.date)} → {dateLabel(latest.date)}
          {' · '}
          <span style={{ color: change > 0 ? 'var(--yellow)' : change < 0 ? 'var(--green)' : 'var(--text-dim)', fontWeight: 600 }}>
            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
          </span>
        </div>
      </div>

      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {ticks.map(v => (
          <g key={v}>
            <line
              x1={padL}
              y1={yOf(v)}
              x2={W - padR}
              y2={yOf(v)}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="2,3"
            />
            <text
              x={padL - 4}
              y={yOf(v) + 3}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="end"
            >
              {v}
            </text>
          </g>
        ))}

        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />

        {sorted.map(w => (
          <circle
            key={w.date}
            cx={xOf(w.date)}
            cy={yOf(w.weight)}
            r="2"
            fill="var(--text-dim)"
            opacity="0.7"
          />
        ))}

        <circle
          cx={xOf(latest.date)}
          cy={yOf(latest.weight)}
          r="3.5"
          fill="var(--accent)"
        />

        <text
          x={padL}
          y={H - 6}
          fontSize="9"
          fill="var(--text-muted)"
        >
          {dateLabel(oldest.date)}
        </text>
        <text
          x={W - padR}
          y={H - 6}
          fontSize="9"
          fill="var(--text-muted)"
          textAnchor="end"
        >
          {dateLabel(latest.date)}
        </text>
      </svg>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
        Line is 7-day moving average · dots are daily readings
      </div>
    </div>
  )
}
