import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '../../src/utils/roomCode'

describe('generateRoomCode', () => {
  it('generates a 6-character string by default', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('generates a string of specified length', () => {
    expect(generateRoomCode(8)).toHaveLength(8)
  })

  it('only uses uppercase letters and digits (no ambiguous chars like 0, O, 1, I)', () => {
    const code = generateRoomCode(200)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/)
  })

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(95)
  })
})
