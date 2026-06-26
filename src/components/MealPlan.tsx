import type { DayLog, Phase, FoodEntry } from '../types'
import { generateDayPlan, type MealSlot, type TopUpOption } from '../utils/mealPlanner'
import { saveDay } from '../utils/storage'

interface Props {
  day: DayLog
  phase: Phase
  onUpdate: () => void
}

function formatQty(q: number, foodName: string): string {
  if (q === 1) return ''
  if (q === 0.5) return 'half '
  if (q < 1) return `${q}x `
  if (Number.isInteger(q)) return `${q}x `
  return `${q.toFixed(1)}x ` + (foodName.includes('g') ? '' : '')
}

export default function MealPlan({ day, phase, onUpdate }: Props) {
  const currentHour = new Date().getHours()
  const plan = generateDayPlan(day, phase, currentHour)

  function logSlot(slot: MealSlot) {
    const entries: FoodEntry[] = slot.items.map((item, idx) => ({
      id: crypto.randomUUID(),
      foodId: `plan-${slot.id}-${idx}-${Date.now()}`,
      name: item.food.name,
      calories: item.food.calories,
      protein: item.food.protein,
      carbs: item.food.carbs,
      fat: item.food.fat,
      quantity: item.quantity,
      timestamp: Date.now(),
    }))
    saveDay({ ...day, entries: [...day.entries, ...entries] })
    onUpdate()
  }

  function logTopUp(t: TopUpOption) {
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      foodId: `topup-${Date.now()}`,
      name: t.label,
      calories: t.food.calories * t.quantity,
      protein: t.food.protein * t.quantity,
      carbs: t.food.carbs * t.quantity,
      fat: t.food.fat * t.quantity,
      quantity: 1,
      timestamp: Date.now(),
    }
    saveDay({ ...day, entries: [...day.entries, entry] })
    onUpdate()
  }

  const gapColor =
    plan.gapVsTarget > 200
      ? 'var(--orange)'
      : plan.gapVsTarget < -150
      ? 'var(--orange)'
      : 'var(--green)'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Coach's plan</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Target {plan.effectiveTarget}
          {plan.burnAdjustment > 0 && ` (+${plan.burnAdjustment} burn)`}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-input)',
        borderRadius: 10,
        padding: '10px 12px',
        marginBottom: 12,
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--text-dim)',
      }}>
        <div>
          Eaten <strong style={{ color: 'var(--text)' }}>{Math.round(plan.consumed.calories)}</strong>
          {' · '}
          Plan adds <strong style={{ color: 'var(--text)' }}>{Math.round(plan.plannedCalories)}</strong>
          {' = '}
          <strong style={{ color: gapColor }}>{Math.round(plan.finalProjection)}</strong>
        </div>
        {Math.abs(plan.gapVsTarget) <= 100 && plan.remainingSlots.length > 0 && (
          <div style={{ marginTop: 4, color: 'var(--green)' }}>Locked in — eat the plan and you nail target.</div>
        )}
        {plan.gapVsTarget < -150 && (
          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
            ~{Math.round(Math.abs(plan.gapVsTarget))} cal over after the plan — fine for one day, keep tomorrow tight.
          </div>
        )}
      </div>

      {plan.remainingSlots.length === 0 && (
        <div className="empty-state">All meals logged. Nice work mate.</div>
      )}

      {plan.topUps.length > 0 && (
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 8,
          border: '1px dashed var(--accent-dim)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            💡 Headroom: ~{Math.round(plan.gapVsTarget)} cal
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
            After the meals below you've got room for one of these (or have dessert):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {plan.topUps.map((t, i) => (
              <button
                key={i}
                onClick={() => logTopUp(t)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '6px 12px',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + {t.label} ({t.cal})
              </button>
            ))}
          </div>
        </div>
      )}

      {plan.remainingSlots.map(slot => (
        <div
          key={slot.id}
          style={{
            background: 'var(--bg-input)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {slot.emoji} {slot.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
              {Math.round(slot.macros.calories)} cal
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
            {slot.items.map((item, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {formatQty(item.quantity, item.food.name)}{item.food.name}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {Math.round(slot.macros.protein)}P · {Math.round(slot.macros.carbs)}C · {Math.round(slot.macros.fat)}F
            </div>
            <button
              onClick={() => logSlot(slot)}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Log it
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
