/**
 * Client-side search / filter / sort over the device list. Pure reactive logic
 * (no Firestore), so it is unit-testable with plain refs. `isFavorite` is
 * injected so the composable never depends on the user store directly.
 */
import { computed, ref, type Ref } from 'vue'
import type { Device, DeviceStatus } from '@/types'

export type SortKey = 'name' | 'temperature' | 'status' | 'lastReading'
export type SortDir = 'asc' | 'desc'
export type StatusFilter = DeviceStatus | 'all'

// Sort worst-first when sorting by status.
const STATUS_ORDER: Record<DeviceStatus, number> = { offline: 0, warning: 1, online: 2 }

export function useDeviceFilters(devices: Ref<Device[]>, isFavorite: (id: string) => boolean) {
  const search = ref('')
  const statusFilter = ref<StatusFilter>('all')
  const favoritesOnly = ref(false)
  const sortKey = ref<SortKey>('name')
  const sortDir = ref<SortDir>('asc')

  const filtered = computed<Device[]>(() => {
    const term = search.value.trim().toLowerCase()
    const list = devices.value.filter((d) => {
      if (term && !d.name.toLowerCase().includes(term) && !d.location.toLowerCase().includes(term)) {
        return false
      }
      if (statusFilter.value !== 'all' && d.status !== statusFilter.value) return false
      if (favoritesOnly.value && !isFavorite(d.id)) return false
      return true
    })

    const dir = sortDir.value === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey.value) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'temperature':
          cmp = a.temperature - b.temperature
          break
        case 'status':
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
          break
        case 'lastReading':
          cmp = a.lastReadingAt - b.lastReadingAt
          break
      }
      return cmp * dir
    })
  })

  /** Reset every filter to its default (does not touch sort). */
  function clear(): void {
    search.value = ''
    statusFilter.value = 'all'
    favoritesOnly.value = false
  }

  const isFiltered = computed(
    () => search.value !== '' || statusFilter.value !== 'all' || favoritesOnly.value,
  )

  return { search, statusFilter, favoritesOnly, sortKey, sortDir, filtered, isFiltered, clear }
}
