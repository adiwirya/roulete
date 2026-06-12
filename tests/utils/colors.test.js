import { describe, it, expect } from 'vitest'
import { getColor, SEGMENT_COLORS } from '../../src/utils/colors'

describe('getColor', () => {
  it('returns a hex color string', () => {
    expect(getColor(0)).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('wraps around when index exceeds palette length', () => {
    expect(getColor(0)).toBe(getColor(SEGMENT_COLORS.length))
  })

  it('returns different colors for adjacent indices', () => {
    expect(getColor(0)).not.toBe(getColor(1))
  })
})
