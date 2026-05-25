import type { DayLog, WeightEntry, UserSettings, ChatMessage } from '../types'

const KEYS = {
  DAYS: 'fc_days',
  WEIGHTS: 'fc_weights',
  SETTINGS: 'fc_settings',
  CHAT: 'fc_chat',
}

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getDay(date: string): DayLog {
  const days = getJSON<Record<string, DayLog>>(KEYS.DAYS, {})
  return days[date] || {
    date,
    entries: [],
    training: null,
    activity: [],
    weight: null,
    feeling: null,
    notes: '',
  }
}

export function saveDay(day: DayLog) {
  const days = getJSON<Record<string, DayLog>>(KEYS.DAYS, {})
  days[day.date] = day
  setJSON(KEYS.DAYS, days)
}

export function getAllDays(): DayLog[] {
  const days = getJSON<Record<string, DayLog>>(KEYS.DAYS, {})
  return Object.values(days).sort((a, b) => b.date.localeCompare(a.date))
}

export function getWeights(): WeightEntry[] {
  return getJSON<WeightEntry[]>(KEYS.WEIGHTS, [])
}

export function saveWeight(entry: WeightEntry) {
  const weights = getWeights()
  const idx = weights.findIndex(w => w.date === entry.date)
  if (idx >= 0) {
    weights[idx] = entry
  } else {
    weights.push(entry)
  }
  weights.sort((a, b) => a.date.localeCompare(b.date))
  setJSON(KEYS.WEIGHTS, weights)
}

export function getSettings(): UserSettings {
  return getJSON<UserSettings>(KEYS.SETTINGS, {
    phase: 'maintenance',
    height: 178,
    targetWeight: 78,
  })
}

export function saveSettings(settings: UserSettings) {
  setJSON(KEYS.SETTINGS, settings)
}

export function getChatMessages(): ChatMessage[] {
  return getJSON<ChatMessage[]>(KEYS.CHAT, [])
}

export function saveChatMessages(messages: ChatMessage[]) {
  setJSON(KEYS.CHAT, messages)
}

export function clearChatMessages() {
  setJSON(KEYS.CHAT, [])
}
