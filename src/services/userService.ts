/**
 * Per-user data-access layer: favorites, alert acknowledgements, and
 * preferences, all stored under `/users/{uid}/…`. These are the only client
 * WRITES in the app; Firestore owner-scoped rules ensure a user can only touch
 * their own documents. Timestamps are epoch-ms numbers, matching the rest of
 * the app (never Firestore Timestamp).
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import type { UserPreferences } from '@/types'

const USERS = 'users'
const FAVORITES = 'favorites'
const ACKS = 'acknowledgedAlerts'
const SETTINGS = 'settings'
const PREFERENCES_DOC = 'preferences'

/** Extract document ids from a query snapshot. */
function idsOf(snapshot: QuerySnapshot<DocumentData>): string[] {
  return snapshot.docs.map((d) => d.id)
}

/** Live-subscribe to the user's favorited device ids. */
export function subscribeToFavorites(
  uid: string,
  onData: (deviceIds: string[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, USERS, uid, FAVORITES),
    (snap) => onData(idsOf(snap)),
    (error) => onError(error),
  )
}

/** Live-subscribe to the ids of alerts the user has acknowledged. */
export function subscribeToAcknowledgedAlerts(
  uid: string,
  onData: (alertIds: string[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, USERS, uid, ACKS),
    (snap) => onData(idsOf(snap)),
    (error) => onError(error),
  )
}

/** Live-subscribe to the user's preferences (null until first saved). */
export function subscribeToPreferences(
  uid: string,
  onData: (prefs: Partial<UserPreferences> | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, USERS, uid, SETTINGS, PREFERENCES_DOC),
    (snap) => onData(snap.exists() ? (snap.data() as Partial<UserPreferences>) : null),
    (error) => onError(error),
  )
}

export function addFavorite(uid: string, deviceId: string): Promise<void> {
  return setDoc(doc(db, USERS, uid, FAVORITES, deviceId), { createdAt: Date.now() })
}

export function removeFavorite(uid: string, deviceId: string): Promise<void> {
  return deleteDoc(doc(db, USERS, uid, FAVORITES, deviceId))
}

export function acknowledgeAlert(uid: string, alertId: string): Promise<void> {
  return setDoc(doc(db, USERS, uid, ACKS, alertId), { createdAt: Date.now() })
}

export function savePreferences(uid: string, prefs: Partial<UserPreferences>): Promise<void> {
  return setDoc(doc(db, USERS, uid, SETTINGS, PREFERENCES_DOC), prefs, { merge: true })
}
