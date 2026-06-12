import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CreateRoomForm from '../../src/components/CreateRoomForm.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/room/:code', component: { template: '<div/>' } },
  ],
})

describe('CreateRoomForm', () => {
  it('submit button is disabled when inputs are empty', () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is disabled when only one entry is provided', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is enabled when host name and 2+ entries are filled', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('navigates to /room/:code on submit', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')

    const navigationPromise = new Promise(resolve => {
      router.afterEach(() => resolve())
    })

    await wrapper.find('form').trigger('submit')
    await navigationPromise

    expect(router.currentRoute.value.path).toMatch(/^\/room\/[A-Z0-9]{6}$/)
  })

  it('saves session to localStorage on submit', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')

    const navigationPromise = new Promise(resolve => {
      router.afterEach(() => resolve())
    })

    await wrapper.find('form').trigger('submit')
    await navigationPromise

    const code = router.currentRoute.value.params.code
    const stored = JSON.parse(localStorage.getItem(`room:${code}`))
    expect(stored.role).toBe('host')
    expect(stored.entries).toEqual(['Alice', 'Bob'])
  })
})
