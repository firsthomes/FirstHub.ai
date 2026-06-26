import seedData from '../data/seed.json'
import type { DayLog, WeightEntry } from '../types'

const SEED_KEY = 'fc_seeded'

interface SeedData {
  version: number
  days: Record<string, DayLog>
  weights: WeightEntry[]
}

export function applySeedIfNeeded() {
  const seeded = localStorage.getItem(SEED_KEY)
  if (seeded === String(seedData.version)) return false

  const seed = seedData as SeedData

  const existingDays = JSON.parse(localStorage.getItem('fc_days') || '{}')
  const existingWeights: WeightEntry[] = JSON.parse(localStorage.getItem('fc_weights') || '[]')

  for (const [date, day] of Object.entries(seed.days)) {
    const existing: DayLog | undefined = existingDays[date]
    if (existing) {
      const manualEntries = existing.entries.filter(e => !e.foodId.startsWith('imported-'))
      existingDays[date] = {
        ...existing,
        weight: existing.weight ?? day.weight,
        training: existing.training ?? day.training,
        activity: existing.activity.length > 0 ? existing.activity : day.activity,
        entries: [...day.entries, ...manualEntries],
      }
    } else {
      existingDays[date] = day
    }
  }

  const weightMap = new Map(existingWeights.map(w => [w.date, w]))
  for (const w of seed.weights) {
    if (!weightMap.has(w.date)) weightMap.set(w.date, w)
  }
  const mergedWeights = Array.from(weightMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  localStorage.setItem('fc_days', JSON.stringify(existingDays))
  localStorage.setItem('fc_weights', JSON.stringify(mergedWeights))
  localStorage.setItem(SEED_KEY, String(seed.version))
  return true
}
