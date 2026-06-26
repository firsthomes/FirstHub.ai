type Intensity = 'light' | 'medium' | 'success' | 'warning' | 'error'

const PATTERNS: Record<Intensity, number | number[]> = {
  light: 8,
  medium: 14,
  success: [10, 20, 10],
  warning: [12, 60, 12],
  error: [20, 40, 20, 40, 20],
}

export function haptic(intensity: Intensity = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(PATTERNS[intensity])
  } catch {
    /* no-op */
  }
}
