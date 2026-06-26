export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
}

export interface FoodEntry {
  id: string
  foodId: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: number
  timestamp: number
}

export interface DayLog {
  date: string
  entries: FoodEntry[]
  training: TrainingType | null
  activity: ActivityType[]
  weight: number | null
  feeling: Feeling | null
  notes: string
  caloriesBurned?: number | null
}

export type TrainingType =
  | 'upper'
  | 'lower'
  | 'rest'

export type ActivityType =
  | 'walk'
  | 'run'
  | 'motocross'
  | 'golf'
  | 'active-rest'

export type Feeling =
  | 'flat'
  | 'full'
  | 'hungry'
  | 'puffy'
  | 'good'

export type Phase = 'maintenance' | 'lean-bulk'

export interface Targets {
  calories: { min: number; max: number }
  protein: { min: number; max: number }
  carbs: { min: number; max: number }
  fat: { min: number; max: number }
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WeightEntry {
  date: string
  weight: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'coach'
  text: string
  timestamp: number
}

export interface UserSettings {
  phase: Phase
  height: number
  targetWeight: number
  apiKey: string
}
