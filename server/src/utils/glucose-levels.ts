// The six levels shown in the app (same bands as the client's colour scale), used in the PDF report.
// Based on the 70–180 mg/dl "time in range" target, with the target split into Normal and Slightly high.
export const GLUCOSE_LEVELS = [
  { label: 'Low', min: 0, range: 'under 70', color: '#3b82f6' },
  { label: 'Normal', min: 70, range: '70–140', color: '#16a34a' },
  { label: 'Slightly high', min: 141, range: '141–180', color: '#84cc16' },
  { label: 'High', min: 181, range: '181–250', color: '#eab308' },
  { label: 'Very high', min: 251, range: '251–300', color: '#f97316' },
  { label: 'Extremely high', min: 301, range: 'over 300', color: '#dc2626' },
] as const

export type GlucoseLevel = (typeof GLUCOSE_LEVELS)[number]

// Picks the band by its lower edge, so averages with decimals land correctly (140.4 is Normal).
export function glucoseLevel(value: number): GlucoseLevel {
  for (let i = GLUCOSE_LEVELS.length - 1; i > 0; i--) {
    if (value >= GLUCOSE_LEVELS[i].min) return GLUCOSE_LEVELS[i]
  }
  return GLUCOSE_LEVELS[0]
}
