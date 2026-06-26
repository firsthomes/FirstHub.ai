import { getDay, saveDay, saveWeight, todayKey } from './storage'

export interface URLImport {
  burn?: number
  weight?: number
}

export function processURLParams(): URLImport | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const result: URLImport = {}
  let touched = false

  const burnRaw = params.get('burn')
  if (burnRaw) {
    const v = parseInt(burnRaw, 10)
    if (!isNaN(v) && v >= 0 && v < 5000) {
      const day = getDay(todayKey())
      saveDay({ ...day, caloriesBurned: v })
      result.burn = v
      touched = true
    }
  }

  const weightRaw = params.get('weight')
  if (weightRaw) {
    const v = parseFloat(weightRaw)
    if (!isNaN(v) && v >= 40 && v <= 200) {
      const today = todayKey()
      saveWeight({ date: today, weight: v })
      const day = getDay(today)
      saveDay({ ...day, weight: v })
      result.weight = v
      touched = true
    }
  }

  if (touched) {
    const url = new URL(window.location.href)
    url.searchParams.delete('burn')
    url.searchParams.delete('weight')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    return result
  }
  return null
}
