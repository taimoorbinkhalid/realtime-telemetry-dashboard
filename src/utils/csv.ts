/**
 * CSV helpers. `toCsv` is a pure function (tested); `downloadCsv` triggers a
 * browser download and is not unit-tested.
 */
import type { Device } from '@/types'

/** Escape a single CSV cell (quote when it contains a comma, quote, or newline). */
function escapeCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize devices to CSV text (with a header row). */
export function toCsv(devices: Device[]): string {
  const header = ['id', 'name', 'location', 'status', 'temperature', 'humidity', 'lastReading']
  const rows = devices.map((d) => [
    d.id,
    d.name,
    d.location,
    d.status,
    d.temperature,
    d.humidity,
    d.lastReadingAt ? new Date(d.lastReadingAt).toISOString() : '',
  ])
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

/** Trigger a browser download of the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
