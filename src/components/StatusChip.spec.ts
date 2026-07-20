// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/mount'
import StatusChip from './StatusChip.vue'

describe('StatusChip', () => {
  it('renders the localized label for each status', () => {
    expect(mountComponent(StatusChip, { props: { status: 'online' } }).text()).toContain('Online')
    expect(mountComponent(StatusChip, { props: { status: 'warning' } }).text()).toContain('Warning')
    expect(mountComponent(StatusChip, { props: { status: 'offline' } }).text()).toContain('Offline')
  })
})
