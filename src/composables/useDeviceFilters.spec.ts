import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDeviceFilters } from './useDeviceFilters'
import type { Device } from '@/types'

function device(over: Partial<Device>): Device {
  return {
    id: 'x',
    name: 'Device',
    location: 'Somewhere',
    status: 'online',
    temperature: 20,
    humidity: 50,
    lastReadingAt: 0,
    ...over,
  }
}

const list = [
  device({ id: 'a', name: 'Cold Store', location: 'North', status: 'offline', temperature: 4, lastReadingAt: 300 }),
  device({ id: 'b', name: 'Dry Room', location: 'North', status: 'online', temperature: 21, lastReadingAt: 100 }),
  device({ id: 'c', name: 'Server Rack', location: 'Data Room', status: 'warning', temperature: 24, lastReadingAt: 200 }),
]

describe('useDeviceFilters', () => {
  it('filters by search term across name and location', () => {
    const devices = ref(list)
    const f = useDeviceFilters(devices, () => false)
    f.search.value = 'data room'
    expect(f.filtered.value.map((d) => d.id)).toEqual(['c'])
    f.search.value = 'room'
    expect(f.filtered.value.map((d) => d.id).sort()).toEqual(['b', 'c'])
  })

  it('filters by status', () => {
    const f = useDeviceFilters(ref(list), () => false)
    f.statusFilter.value = 'warning'
    expect(f.filtered.value.map((d) => d.id)).toEqual(['c'])
  })

  it('filters by favorites using the injected predicate', () => {
    const f = useDeviceFilters(ref(list), (id) => id === 'b')
    f.favoritesOnly.value = true
    expect(f.filtered.value.map((d) => d.id)).toEqual(['b'])
  })

  it('sorts by name ascending by default and respects direction', () => {
    const f = useDeviceFilters(ref(list), () => false)
    expect(f.filtered.value.map((d) => d.name)).toEqual(['Cold Store', 'Dry Room', 'Server Rack'])
    f.sortDir.value = 'desc'
    expect(f.filtered.value.map((d) => d.name)).toEqual(['Server Rack', 'Dry Room', 'Cold Store'])
  })

  it('sorts by temperature and by last reading', () => {
    const f = useDeviceFilters(ref(list), () => false)
    f.sortKey.value = 'temperature'
    expect(f.filtered.value.map((d) => d.id)).toEqual(['a', 'b', 'c'])
    f.sortKey.value = 'lastReading'
    expect(f.filtered.value.map((d) => d.id)).toEqual(['b', 'c', 'a'])
  })

  it('tracks isFiltered and clears filters', () => {
    const f = useDeviceFilters(ref(list), () => false)
    expect(f.isFiltered.value).toBe(false)
    f.search.value = 'x'
    f.statusFilter.value = 'online'
    expect(f.isFiltered.value).toBe(true)
    f.clear()
    expect(f.isFiltered.value).toBe(false)
    expect(f.search.value).toBe('')
    expect(f.statusFilter.value).toBe('all')
  })
})
