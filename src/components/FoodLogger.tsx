import { useState } from 'react'
import type { DayLog, FoodEntry } from '../types'
import { FOOD_DATABASE, FOOD_CATEGORIES } from '../data/foods'
import { saveDay } from '../utils/storage'
import { calculateTotals } from '../utils/calculator'

interface Props {
  day: DayLog
  onUpdate: () => void
  onDone: () => void
}

type Category = 'all' | 'protein' | 'carbs' | 'meals' | 'snacks' | 'custom'

export default function FoodLogger({ day, onUpdate, onDone }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [customP, setCustomP] = useState('')
  const [customC, setCustomC] = useState('')
  const [customF, setCustomF] = useState('')
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const totals = calculateTotals(day.entries)

  const filteredFoods = FOOD_DATABASE.filter(food => {
    if (search) {
      return food.name.toLowerCase().includes(search.toLowerCase())
    }
    if (category === 'all') return true
    if (category === 'custom') return false
    const ids = FOOD_CATEGORIES[category] || []
    return ids.includes(food.id)
  })

  function addFood(foodId: string) {
    const food = FOOD_DATABASE.find(f => f.id === foodId)
    if (!food) return
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      foodId: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      quantity: 1,
      timestamp: Date.now(),
    }
    saveDay({ ...day, entries: [...day.entries, entry] })
    onUpdate()
    setJustAdded(food.name)
    setTimeout(() => setJustAdded(null), 1500)
  }

  function addCustomFood() {
    if (!customName || !customCal) return
    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      foodId: 'custom',
      name: customName,
      calories: parseFloat(customCal) || 0,
      protein: parseFloat(customP) || 0,
      carbs: parseFloat(customC) || 0,
      fat: parseFloat(customF) || 0,
      quantity: 1,
      timestamp: Date.now(),
    }
    saveDay({ ...day, entries: [...day.entries, entry] })
    onUpdate()
    const name = customName
    setShowCustom(false)
    setCustomName('')
    setCustomCal('')
    setCustomP('')
    setCustomC('')
    setCustomF('')
    setJustAdded(name)
    setTimeout(() => setJustAdded(null), 1500)
  }

  return (
    <div className="page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: '8px 12px',
        background: 'var(--bg-card)',
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--text)', fontSize: 16 }}>{Math.round(totals.calories)}</strong> cal
          {' · '}{Math.round(totals.protein)}P · {Math.round(totals.carbs)}C · {Math.round(totals.fat)}F
        </div>
        <button
          onClick={onDone}
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>

      {justAdded && (
        <div style={{
          background: 'var(--green-dim)',
          color: 'var(--green)',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          Added: {justAdded}
        </div>
      )}

      <input
        className="search-input"
        placeholder="Search foods..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="category-tabs">
        {([
          ['all', 'All'],
          ['protein', 'Protein'],
          ['carbs', 'Carbs'],
          ['meals', 'Meals'],
          ['snacks', 'Snacks'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`category-tab ${category === key ? 'active' : ''}`}
            onClick={() => { setCategory(key); setSearch(''); }}
          >
            {label}
          </button>
        ))}
        <button
          className={`category-tab ${showCustom ? 'active' : ''}`}
          onClick={() => setShowCustom(true)}
        >
          + Custom
        </button>
      </div>

      {!showCustom && (
        <div className="quick-add-grid">
          {filteredFoods.map(food => (
            <button key={food.id} className="quick-add-btn" onClick={() => addFood(food.id)}>
              <div>{food.name}</div>
              <div className="btn-cal">
                {food.calories} cal · {food.protein}P {food.carbs}C {food.fat}F
              </div>
            </button>
          ))}
        </div>
      )}

      {filteredFoods.length === 0 && !showCustom && (
        <div className="empty-state">
          No foods found. Try a different search or add a custom entry.
        </div>
      )}

      {showCustom && (
        <div className="card">
          <div className="card-title">Custom Food</div>
          <div className="modal-field">
            <label>Name</label>
            <input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g. Chicken wrap"
              autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="modal-field">
              <label>Calories</label>
              <input
                type="number"
                value={customCal}
                onChange={e => setCustomCal(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="modal-field">
              <label>Protein (g)</label>
              <input
                type="number"
                value={customP}
                onChange={e => setCustomP(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="modal-field">
              <label>Carbs (g)</label>
              <input
                type="number"
                value={customC}
                onChange={e => setCustomC(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="modal-field">
              <label>Fat (g)</label>
              <input
                type="number"
                value={customF}
                onChange={e => setCustomF(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-cancel" onClick={() => setShowCustom(false)}>Cancel</button>
            <button className="modal-save" onClick={addCustomFood}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}
