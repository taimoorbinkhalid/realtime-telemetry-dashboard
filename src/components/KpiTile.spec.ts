// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/mount'
import KpiTile from './KpiTile.vue'

describe('KpiTile', () => {
  it('renders the label and the formatted value', () => {
    const wrapper = mountComponent(KpiTile, {
      props: {
        label: 'Total devices',
        value: 6,
        icon: 'mdi-devices',
      },
    })
    expect(wrapper.text()).toContain('Total devices')
    expect(wrapper.text()).toContain('6')
  })

  it('applies a custom formatter to the value', () => {
    const wrapper = mountComponent(KpiTile, {
      props: {
        label: 'Avg temperature',
        value: 21.4,
        formatter: (n: number) => `${n.toFixed(1)}°C`,
      },
    })
    expect(wrapper.text()).toContain('21.4°C')
  })
})
