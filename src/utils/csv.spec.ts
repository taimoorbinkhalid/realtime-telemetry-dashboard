import { describe, it, expect } from 'vitest'
import { toCsv } from './csv'
import type { Device } from '@/types'

const device: Device = {
  id: 'dev-1',
  name: 'Sensor A',
  location: 'Warehouse A',
  status: 'online',
  temperature: 21.4,
  humidity: 48,
  lastReadingAt: 1_700_000_000_000,
}

describe('toCsv', () => {
  it('emits a header row plus one row per device', () => {
    const csv = toCsv([device])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('id,name,location,status,temperature,humidity,lastReading')
    expect(lines[1]).toContain('dev-1,Sensor A,Warehouse A,online,21.4,48,')
  })

  it('quotes cells containing commas or quotes', () => {
    const tricky: Device = { ...device, name: 'A, "B"', location: 'Line\n2' }
    const csv = toCsv([tricky])
    expect(csv).toContain('"A, ""B"""')
    expect(csv).toContain('"Line\n2"')
  })

  it('handles an empty list (header only)', () => {
    expect(toCsv([])).toBe('id,name,location,status,temperature,humidity,lastReading')
  })
})
