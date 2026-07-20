// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/mount'
import AlertsView from './AlertsView.vue'

describe('AlertsView', () => {
  it('shows the empty state when there are no active alerts', () => {
    // A fresh Pinia (from the mount helper) means the alerts store is empty.
    const wrapper = mountComponent(AlertsView)
    expect(wrapper.text()).toContain('No active alerts')
  })
})
