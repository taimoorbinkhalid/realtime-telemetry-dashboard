import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Device } from '@/types'

// Capture the callbacks the store passes into the service so tests can drive
// the "live" subscription by hand, and hand back a spyable unsubscribe fn.
let capturedOnData: ((devices: Device[]) => void) | null = null
let capturedOnError: ((error: Error) => void) | null = null
const unsubscribeSpy = vi.fn()

vi.mock('@/services/deviceService', () => ({
  subscribeToDevices: vi.fn(
    (onData: (d: Device[]) => void, onError: (e: Error) => void) => {
      capturedOnData = onData
      capturedOnError = onError
      return unsubscribeSpy
    },
  ),
}))

import { subscribeToDevices } from '@/services/deviceService'
import { useDevicesStore } from './devices'

const sampleDevice: Device = {
  id: 'dev-1',
  name: 'Sensor A',
  location: 'Warehouse A',
  status: 'online',
  temperature: 21.4,
  humidity: 48,
  lastReadingAt: 1_700_000_000_000,
}

describe('devices store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    capturedOnData = null
    capturedOnError = null
    unsubscribeSpy.mockClear()
    vi.mocked(subscribeToDevices).mockClear()
  })

  it('starts empty and not loading', () => {
    const store = useDevicesStore()
    expect(store.devices).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('subscribe() opens a subscription and flips loading on', () => {
    const store = useDevicesStore()
    store.subscribe()
    expect(subscribeToDevices).toHaveBeenCalledTimes(1)
    expect(store.loading).toBe(true)
  })

  it('populates devices and clears loading when data arrives', () => {
    const store = useDevicesStore()
    store.subscribe()
    capturedOnData?.([sampleDevice])
    expect(store.devices).toEqual([sampleDevice])
    expect(store.loading).toBe(false)
  })

  it('is idempotent — a second subscribe() does not open another listener', () => {
    const store = useDevicesStore()
    store.subscribe()
    store.subscribe()
    expect(subscribeToDevices).toHaveBeenCalledTimes(1)
  })

  it('records an error and clears loading on failure', () => {
    const store = useDevicesStore()
    store.subscribe()
    capturedOnError?.(new Error('permission-denied'))
    expect(store.error).toBe('permission-denied')
    expect(store.loading).toBe(false)
  })

  it('getById returns the matching device or undefined', () => {
    const store = useDevicesStore()
    store.subscribe()
    capturedOnData?.([sampleDevice])
    expect(store.getById('dev-1')).toEqual(sampleDevice)
    expect(store.getById('missing')).toBeUndefined()
  })

  it('reset() tears down the listener and clears state', () => {
    const store = useDevicesStore()
    store.subscribe()
    capturedOnData?.([sampleDevice])
    store.reset()
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
    expect(store.devices).toEqual([])
    expect(store.error).toBeNull()
    // After reset it can subscribe again.
    store.subscribe()
    expect(subscribeToDevices).toHaveBeenCalledTimes(2)
  })
})
