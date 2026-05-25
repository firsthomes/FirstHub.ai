import type { FoodEntry, MacroTotals, Targets, Phase } from '../types'

export function calculateTotals(entries: FoodEntry[]): MacroTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories * entry.quantity,
      protein: acc.protein + entry.protein * entry.quantity,
      carbs: acc.carbs + entry.carbs * entry.quantity,
      fat: acc.fat + entry.fat * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function getTargets(phase: Phase): Targets {
  if (phase === 'lean-bulk') {
    return {
      calories: { min: 2650, max: 2800 },
      protein: { min: 180, max: 210 },
      carbs: { min: 300, max: 370 },
      fat: { min: 50, max: 75 },
    }
  }
  return {
    calories: { min: 2400, max: 2500 },
    protein: { min: 180, max: 210 },
    carbs: { min: 250, max: 300 },
    fat: { min: 50, max: 75 },
  }
}

export function getRemaining(totals: MacroTotals, targets: Targets): MacroTotals {
  const mid = (t: { min: number; max: number }) => Math.round((t.min + t.max) / 2)
  return {
    calories: mid(targets.calories) - totals.calories,
    protein: mid(targets.protein) - totals.protein,
    carbs: mid(targets.carbs) - totals.carbs,
    fat: mid(targets.fat) - totals.fat,
  }
}

export function macroStatus(
  value: number,
  target: { min: number; max: number }
): 'low' | 'on-track' | 'high' | 'over' {
  if (value < target.min * 0.85) return 'low'
  if (value <= target.max * 1.06) return 'on-track'
  if (value <= target.max * 1.15) return 'high'
  return 'over'
}

export function progressPercent(value: number, target: { min: number; max: number }): number {
  const mid = (target.min + target.max) / 2
  return Math.min(Math.round((value / mid) * 100), 100)
}
