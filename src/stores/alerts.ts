/**
 * Alerts store. Holds the live active-alert list (and recent resolved alerts)
 * behind a single shared subscription each, so device cards, the notification
 * bell, and the alerts view all read the same reactive state without opening
 * their own listeners.
 */
import { defineStore } from 'pinia'
import type { Alert } from '@/types'
import { subscribeToActiveAlerts, subscribeToRecentResolvedAlerts } from '@/services/alertService'

const RESOLVED_LIMIT = 25

interface AlertsState {
  active: Alert[]
  resolved: Alert[]
  loading: boolean
  error: string | null
  unsubActive: (() => void) | null
  unsubResolved: (() => void) | null
}

export const useAlertsStore = defineStore('alerts', {
  state: (): AlertsState => ({
    active: [],
    resolved: [],
    loading: false,
    error: null,
    unsubActive: null,
    unsubResolved: null,
  }),

  getters: {
    activeCount: (state): number => state.active.length,
    /** Active alerts for a given device. */
    activeForDevice: (state) => {
      return (deviceId: string): Alert[] => state.active.filter((a) => a.deviceId === deviceId)
    },
    /** Whether a device has any active alert (drives card indicators). */
    hasActiveForDevice(): (deviceId: string) => boolean {
      return (deviceId: string) => this.activeForDevice(deviceId).length > 0
    },
  },

  actions: {
    /** Open the live alert subscriptions (idempotent). */
    subscribe(): void {
      if (this.unsubActive) return
      this.loading = true
      this.error = null
      this.unsubActive = subscribeToActiveAlerts(
        (alerts) => {
          this.active = alerts
          this.loading = false
        },
        (error) => {
          this.error = error.message
          this.loading = false
        },
      )
      this.unsubResolved = subscribeToRecentResolvedAlerts(
        RESOLVED_LIMIT,
        (alerts) => (this.resolved = alerts),
        (error) => (this.error = error.message),
      )
    },

    /** Tear down subscriptions (call on sign-out). */
    reset(): void {
      this.unsubActive?.()
      this.unsubResolved?.()
      this.unsubActive = null
      this.unsubResolved = null
      this.active = []
      this.resolved = []
      this.loading = false
      this.error = null
    },
  },
})
