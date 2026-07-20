/**
 * Auth store. Owns the current user and exposes the initial-load `ready`
 * promise the router awaits before evaluating guards. Wraps the auth service so
 * components dispatch intents rather than calling Firebase directly.
 */
import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import { signIn, signInAsDemo, signOut, watchAuth } from '@/services/authService'

interface AuthState {
  user: User | null
  /** True until the first auth-state callback resolves. */
  initializing: boolean
}

let readyResolve: (() => void) | undefined
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve
})

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    initializing: true,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    /** Resolves once the initial auth state is known. */
    ready: () => readyPromise,
  },

  actions: {
    /** Start listening for auth changes. Call once at app startup. */
    init(): void {
      watchAuth((user) => {
        this.user = user
        if (this.initializing) {
          this.initializing = false
          readyResolve?.()
        }
      })
    },

    async login(email: string, password: string): Promise<void> {
      this.user = await signIn(email, password)
    },

    async loginAsDemo(): Promise<void> {
      this.user = await signInAsDemo()
    },

    async logout(): Promise<void> {
      await signOut()
      this.user = null
    },
  },
})
