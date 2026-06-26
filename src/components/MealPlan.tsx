import type { DayLog, Phase, FoodEntry } from '../types'
import { generateDayPlan, type MealSlot } from '../utils/mealPlanner'
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
        {plan.gapVsTarget > 100 && (
          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
            ~{Math.round(plan.gapVsTarget)} cal under — bump portions or add a snack.
          </div>
        )}
        {plan.gapVsTarget < -100 && (
          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
            ~{Math.round(Math.abs(plan.gapVsTarget))} cal over — trim a portion or skip the dessert.
          </div>
        )}
        {Math.abs(plan.gapVsTarget) <= 100 && plan.remainingSlots.length > 0 && (
          <div style={{ marginTop: 4, color: 'var(--green)' }}>Locked in. Eat the plan and you nail target.</div>
        )}
      </div>

      {plan.remainingSlots.length === 0 && (
        <div className="empty-state">All meals logged. Nice work mate.</div>
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
