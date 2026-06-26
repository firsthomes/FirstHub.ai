import { FOOD_DATABASE } from '../data/foods'
import type { DayLog, Phase, FoodItem, MacroTotals } from '../types'
import { calculateTotals, getTargets } from './calculator'

export interface PlanItem {
  food: FoodItem
  quantity: number
}

export interface MealSlot {
  id: string
  name: string
  emoji: string
  startHour: number
  endHour: number
  items: PlanItem[]
  macros: MacroTotals
}

interface SlotTemplate {
  id: string
  name: string
  emoji: string
  startHour: number
  endHour: number
  inferKeywords: string[]
  defaultFoods: { foodId: string; quantity: number }[]
}

const TEMPLATES_TRAINING: SlotTemplate[] = [
  {
    id: 'morning',
    name: 'Morning snack',
    emoji: '☕',
    startHour: 6,
    endHour: 10,
    inferKeywords: ['yopro', 'cluster', 'granola'],
    defaultFoods: [
      { foodId: 'yopro', quantity: 1 },
      { foodId: 'protein-clusters-70g', quantity: 1.15 },
      { foodId: 'honey-tbsp', quantity: 1 },
    ],
  },
  {
    id: 'pre-gym',
    name: 'Pre-gym',
    emoji: '⚡',
    startHour: 9,
    endHour: 13,
    inferKeywords: ['bagel', 'lcm'],
    defaultFoods: [
      { foodId: 'bagel', quantity: 0.5 },
      { foodId: 'banana', quantity: 1 },
      { foodId: 'lcm-bar', quantity: 1 },
    ],
  },
  {
    id: 'post-gym',
    name: 'Post-gym',
    emoji: '🏋',
    startHour: 10,
    endHour: 14,
    inferKeywords: ['evolve', 'reload', 'recovery'],
    defaultFoods: [
      { foodId: 'evolve-reload', quantity: 1 },
    ],
  },
  {
    id: 'lunch',
    name: 'Lunch',
    emoji: '🍱',
    startHour: 11,
    endHour: 15,
    inferKeywords: ['mmc', 'muscle chef', 'wrap', 'bowl', 'teriyaki', 'vodka', 'marry me'],
    defaultFoods: [
      { foodId: 'mmc-vodka-penne', quantity: 1 },
    ],
  },
  {
    id: 'dinner',
    name: 'Dinner',
    emoji: '🍽',
    startHour: 17,
    endHour: 21,
    inferKeywords: ['mince', 'chicken breast', 'steak', 'dinner'],
    defaultFoods: [
      { foodId: 'lean-mince-250g', quantity: 1 },
      { foodId: 'rice-175g', quantity: 1 },
      { foodId: 'avocado-quarter', quantity: 1 },
    ],
  },
]

const TEMPLATES_REST: SlotTemplate[] = [
  TEMPLATES_TRAINING[0],
  {
    id: 'mid-morning',
    name: 'Mid-morning',
    emoji: '🥨',
    startHour: 9,
    endHour: 12,
    inferKeywords: ['bagel', 'wrap'],
    defaultFoods: [{ foodId: 'bagel', quantity: 1 }, { foodId: 'banana', quantity: 1 }],
  },
  TEMPLATES_TRAINING[3],
  {
    id: 'afternoon',
    name: 'Afternoon snack',
    emoji: '🍌',
    startHour: 14,
    endHour: 17,
    inferKeywords: ['cappuccino', 'biscuit'],
    defaultFoods: [{ foodId: 'banana', quantity: 1 }, { foodId: 'cappuccino-small', quantity: 1 }],
  },
  TEMPLATES_TRAINING[4],
]

function isSlotComplete(template: SlotTemplate, day: DayLog): boolean {
  return day.entries.some(e => {
    const name = e.name.toLowerCase()
    return template.inferKeywords.some(k => name.includes(k))
  })
}

function lookupFood(id: string): FoodItem | null {
  return FOOD_DATABASE.find(f => f.id === id) || null
}

function macroSum(items: PlanItem[]): MacroTotals {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.food.calories * i.quantity,
      protein: acc.protein + i.food.protein * i.quantity,
      carbs: acc.carbs + i.food.carbs * i.quantity,
      fat: acc.fat + i.food.fat * i.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export interface TopUpOption {
  label: string
  cal: number
  food: FoodItem
  quantity: number
}

export interface DayPlan {
  effectiveTarget: number
  baseTarget: number
  burnAdjustment: number
  consumed: MacroTotals
  remainingSlots: MealSlot[]
  plannedCalories: number
  finalProjection: number
  gapVsTarget: number
  topUps: TopUpOption[]
}

function buildTopUps(gap: number): TopUpOption[] {
  if (gap < 100) return []
  const options: TopUpOption[] = []
  const honey = lookupFood('honey-tbsp')
  const avo = lookupFood('avocado-quarter')
  const banana = lookupFood('banana')
  const bagel = lookupFood('bagel')
  const clusters = lookupFood('protein-clusters-70g')

  if (gap < 200) {
    if (honey) options.push({ label: '1 tbsp honey', cal: 65, food: honey, quantity: 1 })
    if (avo) options.push({ label: '1/4 avocado', cal: 80, food: avo, quantity: 1 })
    if (banana) options.push({ label: '1 banana', cal: 105, food: banana, quantity: 1 })
  } else if (gap < 400) {
    if (avo) options.push({ label: '1/2 avocado + honey', cal: 225, food: avo, quantity: 2 })
    if (banana) options.push({ label: '2 bananas + honey', cal: 275, food: banana, quantity: 2 })
    if (bagel) options.push({ label: 'Bagel + honey', cal: 315, food: bagel, quantity: 1 })
  } else {
    if (bagel) options.push({ label: 'Bagel + banana + honey', cal: 420, food: bagel, quantity: 1 })
    if (clusters) options.push({ label: 'Bowl of clusters', cal: 360, food: clusters, quantity: 1.15 })
  }
  return options
}

export function generateDayPlan(day: DayLog, phase: Phase, currentHour: number): DayPlan {
  const consumed = calculateTotals(day.entries)
  const targets = getTargets(phase)
  const baseTarget = Math.round((targets.calories.min + targets.calories.max) / 2)
  const burnAdjustment = day.caloriesBurned || 0
  const effectiveTarget = baseTarget + burnAdjustment

  const isTrainingDay = day.training === 'upper' || day.training === 'lower'
  const templates = isTrainingDay ? TEMPLATES_TRAINING : TEMPLATES_REST

  const remainingSlots: MealSlot[] = []
  for (const t of templates) {
    if (isSlotComplete(t, day)) continue
    if (currentHour > t.endHour + 1) continue
    const items: PlanItem[] = []
    for (const f of t.defaultFoods) {
      const food = lookupFood(f.foodId)
      if (food) items.push({ food, quantity: f.quantity })
    }
    if (items.length === 0) continue
    remainingSlots.push({
      id: t.id,
      name: t.name,
      emoji: t.emoji,
      startHour: t.startHour,
      endHour: t.endHour,
      items,
      macros: macroSum(items),
    })
  }

  const plannedCalories = remainingSlots.reduce((s, slot) => s + slot.macros.calories, 0)
  const finalProjection = consumed.calories + plannedCalories
  const gapVsTarget = effectiveTarget - finalProjection
  const topUps = gapVsTarget > 100 ? buildTopUps(gapVsTarget) : []

  return {
    effectiveTarget,
    baseTarget,
    burnAdjustment,
    consumed,
    remainingSlots,
    plannedCalories,
    finalProjection,
    gapVsTarget,
    topUps,
  }
}
