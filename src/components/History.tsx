import type { DayLog } from '../types'
import { calculateTotals } from '../utils/calculator'
import { getAllDays } from '../utils/storage'

export default function History() {
  const days = getAllDays()

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().slice(0, 10)) return 'Today'
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'

    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function renderDay(day: DayLog) {
    const totals = calculateTotals(day.entries)
    if (day.entries.length === 0 && !day.training && !day.weight) return null

    return (
      <div key={day.date} className="history-day">
        <div className="history-day-header">
          <span className="history-date">{formatDate(day.date)}</span>
          <span className="history-cal">{Math.round(totals.calories)} cal</span>
        </div>
        <div className="history-macros">
          {Math.round(totals.protein)}P · {Math.round(totals.carbs)}C · {Math.round(totals.fat)}F
          {day.weight && ` · ${day.weight.toFixed(1)} kg`}
        </div>
        <div className="history-tags">
          {day.training && (
            <span className="history-tag">{day.training}</span>
          )}
          {day.activity.map(a => (
            <span key={a} className="history-tag">{a}</span>
          ))}
          {day.feeling && (
            <span className="history-tag">{day.feeling}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {days.length === 0 && (
        <div className="empty-state">
          No history yet. Start logging food to see your days here.
        </div>
      )}
      {days.map(renderDay)}
    </div>
  )
}
