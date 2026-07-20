import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Alert } from '@/types'

let activeOnData: ((a: Alert[]) => void) | null = null
let resolvedOnData: ((a: Alert[]) => void) | null = null
const unsubActive = vi.fn()
const unsubResolved = vi.fn()

vi.mock('@/services/alertService', () => ({
  subscribeToActiveAlerts: vi.fn((onData: (a: Alert[]) => void) => {
    activeOnData = onData
    return unsubActive
  }),
  subscribeToRecentResolvedAlerts: vi.fn((_max: number, onData: (a: Alert[]) => void) => {
    resolvedOnData = onData
    return unsubResolved
  }),
}))

import { subscribeToActiveAlerts } from '@/services/alertService'
import { useAlertsStore } from './alerts'

function alert(over: Partial<Alert>): Alert {
  return {
    id: 'al-1',
    deviceId: 'dev-1',
    deviceName: 'Sensor A',
    metric: 'temperature',
    severity: 'warning',
    status: 'active',
    value: 30,
    bound: 26,
    message: 'too hot',
    createdAt: 1,
    resolvedAt: null,
    ...over,
  }
}

describe('alerts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    activeOnData = null
    resolvedOnData = null
    unsubActive.mockClear()
    unsubResolved.mockClear()
    vi.mocked(subscribeToActiveAlerts).mockClear()
  })

  it('subscribe() opens both listeners once (idempotent)', () => {
    const store = useAlertsStore()
    store.subscribe()
    store.subscribe()
    expect(subscribeToActiveAlerts).toHaveBeenCalledTimes(1)
  })

  it('tracks active alerts and per-device getters', () => {
    const store = useAlertsStore()
    store.subscribe()
    activeOnData?.([alert({ id: 'a', deviceId: 'dev-1' }), alert({ id: 'b', deviceId: 'dev-2' })])
    expect(store.activeCount).toBe(2)
    expect(store.activeForDevice('dev-1').map((a) => a.id)).toEqual(['a'])
    expect(store.hasActiveForDevice('dev-2')).toBe(true)
    expect(store.hasActiveForDevice('dev-3')).toBe(false)
  })

  it('stores recent resolved alerts separately', () => {
    const store = useAlertsStore()
    store.subscribe()
    resolvedOnData?.([alert({ id: 'r', status: 'resolved', resolvedAt: 5 })])
    expect(store.resolved).toHaveLength(1)
    expect(store.activeCount).toBe(0)
  })

  it('reset() tears down both listeners and clears state', () => {
    const store = useAlertsStore()
    store.subscribe()
    activeOnData?.([alert({})])
    store.reset()
    expect(unsubActive).toHaveBeenCalledTimes(1)
    expect(unsubResolved).toHaveBeenCalledTimes(1)
    expect(store.active).toEqual([])
  })
})
