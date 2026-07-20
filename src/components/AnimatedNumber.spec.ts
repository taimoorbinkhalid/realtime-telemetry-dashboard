// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mountComponent } from '@/test/mount'
import AnimatedNumber from './AnimatedNumber.vue'

describe('AnimatedNumber', () => {
  it('renders the formatted value (snaps on first paint)', () => {
    const wrapper = mountComponent(AnimatedNumber, {
      props: { value: 21.4, formatter: (n: number) => `${n.toFixed(1)}°C` },
    })
    expect(wrapper.text()).toBe('21.4°C')
  })

  it('uses the default integer formatter when none is given', () => {
    const wrapper = mountComponent(AnimatedNumber, { props: { value: 6 } })
    expect(wrapper.text()).toBe('6')
  })
})
