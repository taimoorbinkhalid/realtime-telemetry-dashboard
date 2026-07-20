/**
 * User store: favorites, acknowledged alerts, and preferences for the signed-in
 * user. Owns the per-user subscriptions and exposes write actions that go
 * through userService. Holds the uid so components can dispatch intents without
 * passing it around.
 */
import { defineStore } from 'pinia'
import type { UserPreferences } from '@/types'
import {
  acknowledgeAlert,
  addFavorite,
  removeFavorite,
  savePreferences,
  subscribeToAcknowledgedAlerts,
  subscribeToFavorites,
  subscribeToPreferences,
} from '@/services/userService'

/** Sensible defaults until the user saves their own preferences. */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultTimeRange: '6h',
  favoritesOnly: false,
}

interface UserState {
  uid: string | null
  favorites: string[]
  acknowledgedAlertIds: string[]
  preferences: UserPreferences
  error: string | null
  unsubs: Array<() => void>
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    uid: null,
    favorites: [],
    acknowledgedAlertIds: [],
    preferences: { ...DEFAULT_PREFERENCES },
    error: null,
    unsubs: [],
  }),

  getters: {
    isFavorite: (state) => (deviceId: string) => state.favorites.includes(deviceId),
    isAcknowledged: (state) => (alertId: string) => state.acknowledgedAlertIds.includes(alertId),
  },

  actions: {
    /** Open per-user subscriptions for the given uid (idempotent per uid). */
    subscribe(uid: string): void {
      if (this.uid === uid && this.unsubs.length) return
      this.reset()
      this.uid = uid
      this.unsubs = [
        subscribeToFavorites(
          uid,
          (ids) => (this.favorites = ids),
          (e) => (this.error = e.message),
        ),
        subscribeToAcknowledgedAlerts(
          uid,
          (ids) => (this.acknowledgedAlertIds = ids),
          (e) => (this.error = e.message),
        ),
        subscribeToPreferences(
          uid,
          (prefs) => (this.preferences = { ...DEFAULT_PREFERENCES, ...(prefs ?? {}) }),
          (e) => (this.error = e.message),
        ),
      ]
    },

    reset(): void {
      this.unsubs.forEach((u) => u())
      this.unsubs = []
      this.uid = null
      this.favorites = []
      this.acknowledgedAlertIds = []
      this.preferences = { ...DEFAULT_PREFERENCES }
      this.error = null
    },

    async toggleFavorite(deviceId: string): Promise<void> {
      if (!this.uid) return
      try {
        if (this.isFavorite(deviceId)) {
          await removeFavorite(this.uid, deviceId)
        } else {
          await addFavorite(this.uid, deviceId)
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
      }
    },

    async acknowledge(alertId: string): Promise<void> {
      if (!this.uid) return
      try {
        await acknowledgeAlert(this.uid, alertId)
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
      }
    },

    async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
      if (!this.uid) return
      // Optimistic local update, then persist.
      this.preferences = { ...this.preferences, ...prefs }
      try {
        await savePreferences(this.uid, prefs)
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
      }
    },
  },
})
