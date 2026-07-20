/**
 * Authentication data-access layer. UI never talks to Firebase Auth directly —
 * it goes through these functions, which keeps SDK details out of components
 * and the store.
 */
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

/** Sign in with an email/password pair. Rejects on invalid credentials. */
export function signIn(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(auth, email, password).then((cred) => cred.user)
}

/**
 * One-click demo sign-in using the credentials baked into the environment.
 * Lets prospective clients explore the dashboard without creating an account.
 */
export function signInAsDemo(): Promise<User> {
  const email = import.meta.env.VITE_DEMO_EMAIL
  const password = import.meta.env.VITE_DEMO_PASSWORD
  if (!email || !password) {
    return Promise.reject(
      new Error('Demo login is not configured. Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD.'),
    )
  }
  return signIn(email, password)
}

/** Sign the current user out. */
export function signOut(): Promise<void> {
  return fbSignOut(auth)
}

/**
 * Subscribe to auth-state changes. Returns the unsubscribe function.
 * The callback fires once immediately with the current user (or null).
 */
export function watchAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
