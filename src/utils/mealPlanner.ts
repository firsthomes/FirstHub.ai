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

function scaleSlotToCalories(items: PlanItem[], targetCal: number): PlanItem[] {
  const current = macroSum(items).calories
  if (current === 0 || Math.abs(current - targetCal) < 50) return items
  const factor = targetCal / current
  const clamped = Math.max(0.6, Math.min(1.5, factor))
  return items.map(i => ({ food: i.food, quantity: Math.round(i.quantity * clamped * 10) / 10 }))
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
}

export function generateDayPlan(day: DayLog, phase: Phase, currentHour: number): DayPlan {
  const consumed = calculateTotals(day.entries)
  const targets = getTargets(phase)
  const baseTarget = Math.round((targets.calories.min + targets.calories.max) / 2)
  const burnAdjustment = day.caloriesBurned || 0
  const effectiveTarget = baseTarget + burnAdjustment

  const isTrainingDay = day.training === 'upper' || day.training === 'lower'
  const templates = isTrainingDay ? TEMPLATES_TRAINING : TEMPLATES_REST

  const candidateSlots = templates.filter(t => !isSlotComplete(t, day) && currentHour <= t.endHour + 1)

  let candidateTotal = 0
  const baseSlots: { template: SlotTemplate; items: PlanItem[]; baseCal: number }[] = []
  for (const t of candidateSlots) {
    const items: PlanItem[] = []
    for (const f of t.defaultFoods) {
      const food = lookupFood(f.foodId)
      if (food) items.push({ food, quantity: f.quantity })
    }
    if (items.length === 0) continue
    const baseCal = macroSum(items).calories
    candidateTotal += baseCal
    baseSlots.push({ template: t, items, baseCal })
  }

  const remainingBudget = Math.max(0, effectiveTarget - consumed.calories)
  const globalFactor = candidateTotal > 0 ? Math.max(0.6, Math.min(1.4, remainingBudget / candidateTotal)) : 1

  const remainingSlots: MealSlot[] = baseSlots.map(({ template, items, baseCal }) => {
    const scaledItems = scaleSlotToCalories(items, baseCal * globalFactor)
    return {
      id: template.id,
      name: template.name,
      emoji: template.emoji,
      startHour: template.startHour,
      endHour: template.endHour,
      items: scaledItems,
      macros: macroSum(scaledItems),
    }
  })

  const plannedCalories = remainingSlots.reduce((s, slot) => s + slot.macros.calories, 0)
  const finalProjection = consumed.calories + plannedCalories
  const gapVsTarget = effectiveTarget - finalProjection

  return {
    effectiveTarget,
    baseTarget,
    burnAdjustment,
    consumed,
    remainingSlots,
    plannedCalories,
    finalProjection,
    gapVsTarget,
  }
}
