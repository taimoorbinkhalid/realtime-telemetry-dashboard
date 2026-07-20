import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

let favoritesOnData: ((ids: string[]) => void) | null = null
const unsub = vi.fn()

vi.mock('@/services/userService', () => ({
  subscribeToFavorites: vi.fn((_uid: string, onData: (ids: string[]) => void) => {
    favoritesOnData = onData
    return unsub
  }),
  subscribeToAcknowledgedAlerts: vi.fn(() => unsub),
  subscribeToPreferences: vi.fn(() => unsub),
  addFavorite: vi.fn(() => Promise.resolve()),
  removeFavorite: vi.fn(() => Promise.resolve()),
  acknowledgeAlert: vi.fn(() => Promise.resolve()),
  savePreferences: vi.fn(() => Promise.resolve()),
}))

import { addFavorite, removeFavorite, subscribeToFavorites } from '@/services/userService'
import { useUserStore } from './user'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    favoritesOnData = null
    unsub.mockClear()
    vi.clearAllMocks()
  })

  it('subscribe(uid) opens listeners and is idempotent per uid', () => {
    const store = useUserStore()
    store.subscribe('u1')
    store.subscribe('u1')
    expect(subscribeToFavorites).toHaveBeenCalledTimes(1)
    expect(store.uid).toBe('u1')
  })

  it('tracks favorites and isFavorite getter', () => {
    const store = useUserStore()
    store.subscribe('u1')
    favoritesOnData?.(['dev-1', 'dev-2'])
    expect(store.isFavorite('dev-1')).toBe(true)
    expect(store.isFavorite('dev-9')).toBe(false)
  })

  it('toggleFavorite adds when absent and removes when present', async () => {
    const store = useUserStore()
    store.subscribe('u1')
    favoritesOnData?.([])
    await store.toggleFavorite('dev-1')
    expect(addFavorite).toHaveBeenCalledWith('u1', 'dev-1')

    favoritesOnData?.(['dev-1'])
    await store.toggleFavorite('dev-1')
    expect(removeFavorite).toHaveBeenCalledWith('u1', 'dev-1')
  })

  it('reset() clears state and tears down listeners', () => {
    const store = useUserStore()
    store.subscribe('u1')
    favoritesOnData?.(['dev-1'])
    store.reset()
    expect(store.uid).toBeNull()
    expect(store.favorites).toEqual([])
    expect(unsub).toHaveBeenCalled()
  })

  it('defaults preferences until loaded', () => {
    const store = useUserStore()
    expect(store.preferences.defaultTimeRange).toBe('6h')
    expect(store.preferences.favoritesOnly).toBe(false)
  })
})
