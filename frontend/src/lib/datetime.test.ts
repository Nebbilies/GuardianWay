import {describe, expect, it} from 'vitest'
import {toDatetimeLocalValue, toIsoWithOffset} from './datetime'

describe('datetime helpers', () => {
    it('round-trips a datetime-local value through ISO and back', () => {
        const local = '2026-07-28T08:30'
        const iso = toIsoWithOffset(local)
        // ISO must encode the same wall-clock time...
        expect(iso.startsWith('2026-07-28T08:30')).toBe(true)
        // ...and carry an offset (Z or ±HH:MM).
        expect(iso).toMatch(/(Z|[+-]\d{2}:\d{2})$/)
        expect(toDatetimeLocalValue(iso)).toBe(local)
    })

    it('returns empty string for empty input', () => {
        expect(toIsoWithOffset('')).toBe('')
        expect(toDatetimeLocalValue('')).toBe('')
    })
})
