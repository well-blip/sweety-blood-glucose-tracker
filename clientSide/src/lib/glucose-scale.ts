// The six bands used across the app to say how a reading compares with the usual healthy range.
// Based on the international "time in range" targets for people with diabetes (target 70–180 mg/dl),
// with the target split into "Normal" and "Slightly high" so small rises are visible too.
// For information only; it is not medical advice, and a doctor may set different targets.

export type GlucoseLevel = {
  id: 'low' | 'normal' | 'slightly-high' | 'high' | 'very-high' | 'extremely-high'
  label: string
  /** Lowest value in this band (inclusive). */
  min: number
  /** Highest value in this band (inclusive); the last band goes to the top of the allowed range. */
  max: number
  /** Short plain-language meaning, shown under the scale. */
  meaning: string
  /** Strong colour for dots, markers and the scale bar. */
  color: string
  /** Pale background and readable text colour for badges. */
  tint: string
  text: string
}

// Lows are blue on purpose: a low reading is not "even better than normal" and can be dangerous,
// so it gets its own colour instead of sitting at the green end. Above normal, colour runs green → red.
export const GLUCOSE_LEVELS: GlucoseLevel[] = [
  { id: 'low', label: 'Low', min: 40, max: 69, meaning: 'Below 70. Treat a low straight away.', color: '#3b82f6', tint: '#eff6ff', text: '#1d4ed8' },
  { id: 'normal', label: 'Normal', min: 70, max: 140, meaning: 'In the healthy range.', color: '#16a34a', tint: '#f0fdf4', text: '#15803d' },
  { id: 'slightly-high', label: 'Slightly high', min: 141, max: 180, meaning: 'A little above normal; common after meals.', color: '#84cc16', tint: '#f7fee7', text: '#4d7c0f' },
  { id: 'high', label: 'High', min: 181, max: 250, meaning: 'Above the target range.', color: '#eab308', tint: '#fefce8', text: '#a16207' },
  { id: 'very-high', label: 'Very high', min: 251, max: 300, meaning: 'Well above target. Keep an eye on it.', color: '#f97316', tint: '#fff7ed', text: '#c2410c' },
  { id: 'extremely-high', label: 'Extremely high', min: 301, max: 600, meaning: 'Above 300. Talk to your doctor.', color: '#dc2626', tint: '#fef2f2', text: '#b91c1c' },
]

// Picks the band by its lower edge, so averages with decimals land correctly (140.4 is Normal, 69.5 is Low).
export function glucoseLevel(value: number): GlucoseLevel {
  for (let i = GLUCOSE_LEVELS.length - 1; i > 0; i--) {
    if (value >= GLUCOSE_LEVELS[i].min) return GLUCOSE_LEVELS[i]
  }
  return GLUCOSE_LEVELS[0]
}

// The bar shows the six bands at equal width (so every label fits, even on a phone).
// A value's marker sits inside its band, further right the higher it is within that band.
// The last band is drawn up to 350; anything higher sits at the far right end.
const LAST_BAND_DRAWN_TO = 350

/** Where a value sits along the scale bar, from 0 to 100 (%). */
export function scalePosition(value: number): number {
  const index = GLUCOSE_LEVELS.indexOf(glucoseLevel(value))
  const level = GLUCOSE_LEVELS[index]
  const top = index === GLUCOSE_LEVELS.length - 1 ? LAST_BAND_DRAWN_TO : level.max + 1
  const withinBand = Math.min(1, Math.max(0, (value - level.min) / (top - level.min)))
  return ((index + withinBand) / GLUCOSE_LEVELS.length) * 100
}
