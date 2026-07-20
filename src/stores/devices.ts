/**
 * Devices store. Holds the live device list and manages the single Firestore
 * subscription behind it, so multiple components can read the same reactive
 * state without each opening its own listener.
 */
import { defineStore } from 'pinia'
import type { Device } from '@/types'
import { subscribeToDevices } from '@/services/deviceService'

interface DevicesState {
  devices: Device[]
  loading: boolean
  error: string | null
  /** Active Firestore unsubscribe handle, or null when not subscribed. */
  unsubscribe: (() => void) | null
}

export const useDevicesStore = defineStore('devices', {
  state: (): DevicesState => ({
    devices: [],
    loading: false,
    error: null,
    unsubscribe: null,
  }),

  getters: {
    getById: (state) => {
      return (id: string): Device | undefined => state.devices.find((d) => d.id === id)
    },
  },

  actions: {
    /** Open the live devices subscription (idempotent). */
    subscribe(): void {
      if (this.unsubscribe) return
      this.loading = true
      this.error = null
      this.unsubscribe = subscribeToDevices(
        (devices) => {
          this.devices = devices
          this.loading = false
        },
        (error) => {
          this.error = error.message
          this.loading = false
        },
      )
    },

    /** Tear down the subscription (call on sign-out). */
    reset(): void {
      this.unsubscribe?.()
      this.unsubscribe = null
      this.devices = []
      this.loading = false
      this.error = null
    },
  },
})
