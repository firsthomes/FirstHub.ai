import { useState } from 'react'
import type { DayLog, Phase, WeightEntry, TrainingType, ActivityType, Feeling } from '../types'
import { calculateTotals, getTargets } from '../utils/calculator'
import { saveDay, saveWeight } from '../utils/storage'
import MacroRing from './MacroRing'

interface Props {
  day: DayLog
  phase: Phase
  weights: WeightEntry[]
  onUpdate: () => void
}

export default function Dashboard({ day, phase, weights, onUpdate }: Props) {
  const [weightInput, setWeightInput] = useState(day.weight?.toString() || '')
  const totals = calculateTotals(day.entries)
  const targets = getTargets(phase)
  const calMid = Math.round((targets.calories.min + targets.calories.max) / 2)
  const remaining = calMid - totals.calories

  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null
  const prevWeight = weights.length > 1 ? weights[weights.length - 2] : null

  function toggleTraining(t: TrainingType) {
    const updated = { ...day, training: day.training === t ? null : t }
    saveDay(updated)
    onUpdate()
  }

  function toggleActivity(a: ActivityType) {
    const activities = day.activity.includes(a)
      ? day.activity.filter(x => x !== a)
      : [...day.activity, a]
    saveDay({ ...day, activity: activities })
    onUpdate()
  }

  function setFeeling(f: Feeling) {
    saveDay({ ...day, feeling: day.feeling === f ? null : f })
    onUpdate()
  }

  function logWeight() {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w < 50 || w > 150) return
    saveWeight({ date: day.date, weight: w })
    saveDay({ ...day, weight: w })
    onUpdate()
  }

  function removeEntry(entryId: string) {
    saveDay({ ...day, entries: day.entries.filter(e => e.id !== entryId) })
    onUpdate()
  }

  return (
    <div className="page">
      {/* Calories Summary */}
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
            {Math.round(totals.calories)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            of {calMid} cal {phase === 'lean-bulk' ? '(lean bulk)' : '(maintenance)'}
          </div>
          {remaining > 0 && (
            <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
              {Math.round(remaining)} remaining
            </div>
          )}
          {remaining <= 0 && remaining > -150 && (
            <div style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>
              Target hit
            </div>
          )}
          {remaining <= -150 && (
            <div style={{ fontSize: 14, color: 'var(--orange)', fontWeight: 600, marginTop: 4 }}>
              {Math.round(Math.abs(remaining))} over target
            </div>
          )}
        </div>
        <div className="macro-rings">
          <MacroRing value={totals.protein} target={targets.protein} label="Protein" color="var(--accent)" unit="g" />
          <MacroRing value={totals.carbs} target={targets.carbs} label="Carbs" color="var(--green)" unit="g" />
          <MacroRing value={totals.fat} target={targets.fat} label="Fat" color="var(--yellow)" unit="g" />
        </div>
      </div>

      {/* Training */}
      <div className="card">
        <div className="card-title">Training</div>
        <div className="training-options">
          {(['upper', 'lower', 'rest'] as TrainingType[]).map(t => (
            <button
              key={t}
              className={`training-btn ${day.training === t ? 'active' : ''}`}
              onClick={() => toggleTraining(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="card">
        <div className="card-title">Activity</div>
        <div className="activity-chips">
          {(['walk', 'run', 'motocross', 'golf', 'active-rest'] as ActivityType[]).map(a => (
            <button
              key={a}
              className={`activity-chip ${day.activity.includes(a) ? 'active' : ''}`}
              onClick={() => toggleActivity(a)}
            >
              {a === 'active-rest' ? 'Active Rest' : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feeling */}
      <div className="card">
        <div className="card-title">How you feel</div>
        <div className="feeling-chips">
          {(['good', 'full', 'flat', 'hungry', 'puffy'] as Feeling[]).map(f => (
            <button
              key={f}
              className={`feeling-chip ${day.feeling === f ? 'active' : ''}`}
              onClick={() => setFeeling(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Weight */}
      <div className="card">
        <div className="card-title">Weight</div>
        {latestWeight && (
          <div className="weight-trend">
            <span className="weight-current">{latestWeight.weight.toFixed(1)}</span>
            <span className="weight-unit">kg</span>
            {prevWeight && (
              <span className={`weight-change ${
                latestWeight.weight - prevWeight.weight > 0.1 ? 'up' :
                latestWeight.weight - prevWeight.weight < -0.1 ? 'down' : 'stable'
              }`}>
                {latestWeight.weight - prevWeight.weight > 0 ? '+' : ''}
                {(latestWeight.weight - prevWeight.weight).toFixed(1)} kg
              </span>
            )}
          </div>
        )}
        <div className="weight-input-row">
          <input
            type="number"
            className="weight-input"
            placeholder="77.5"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            step="0.1"
          />
          <span className="weight-unit">kg</span>
          <button className="save-btn" onClick={logWeight}>Log</button>
        </div>
      </div>

      {/* Today's Food */}
      {day.entries.length > 0 && (
        <div className="card">
          <div className="card-title">Today's food</div>
          {day.entries.map(entry => (
            <div key={entry.id} className="food-entry">
              <div className="food-entry-info">
                <div className="food-entry-name">
                  {entry.quantity > 1 ? `${entry.quantity}x ` : ''}{entry.name}
                </div>
                <div className="food-entry-macros">
                  {Math.round(entry.protein * entry.quantity)}P | {Math.round(entry.carbs * entry.quantity)}C | {Math.round(entry.fat * entry.quantity)}F
                </div>
              </div>
              <div className="food-entry-right">
                <span className="food-entry-cal">{Math.round(entry.calories * entry.quantity)}</span>
                <button className="food-entry-remove" onClick={() => removeEntry(entry.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
