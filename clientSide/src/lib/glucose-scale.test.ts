import { describe, expect, it } from 'vitest'
import { glucoseLevel, scalePosition } from '@/lib/glucose-scale'

// The edges of each band are where mistakes happen (is 140 Normal or Slightly high?), so test them.
describe('glucoseLevel', () => {
  it.each([
    [40, 'Low'],
    [69, 'Low'],
    [69.5, 'Low'], // an average with decimals below 70 is still low
    [70, 'Normal'],
    [140, 'Normal'],
    [140.4, 'Normal'],
    [141, 'Slightly high'],
    [180, 'Slightly high'],
    [181, 'High'],
    [250, 'High'],
    [251, 'Very high'],
    [300, 'Very high'],
    [301, 'Extremely high'],
    [600, 'Extremely high'],
  ])('%s mg/dl is %s', (value, label) => {
    expect(glucoseLevel(value).label).toBe(label)
  })
})

describe('scalePosition', () => {
  it('starts at 0% and never runs past 100%', () => {
    expect(scalePosition(40)).toBe(0)
    expect(scalePosition(600)).toBe(100)
  })

  it('moves right as the value goes up', () => {
    const positions = [50, 100, 160, 200, 280, 320].map(scalePosition)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })
})
