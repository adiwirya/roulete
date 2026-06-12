import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import JoinRoomForm from '../../src/components/JoinRoomForm.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/room/:code', component: { template: '<div/>' } },
  ],
})

describe('JoinRoomForm', () => {
  it('submit button is disabled when inputs are empty', () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('pre-fills room code from initialCode prop', () => {
    const wrapper = mount(JoinRoomForm, {
      props: { initialCode: 'ABC123' },
      global: { plugins: [router] },
    })
    expect(wrapper.find('input[name="roomCode"]').element.value).toBe('ABC123')
  })

  it('navigates to /room/:code on submit', async () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="roomCode"]').setValue('ABC123')
    await wrapper.find('input[name="participantName"]').setValue('Alice')

    const navigationPromise = new Promise(resolve => {
      router.afterEach(() => resolve())
    })

    await wrapper.find('form').trigger('submit')
    await navigationPromise

    expect(router.currentRoute.value.path).toBe('/room/ABC123')
  })

  it('saves participant session to localStorage on submit', async () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="roomCode"]').setValue('XYZ999')
    await wrapper.find('input[name="participantName"]').setValue('Bob')

    const navigationPromise = new Promise(resolve => {
      router.afterEach(() => resolve())
    })

    await wrapper.find('form').trigger('submit')
    await navigationPromise

    const stored = JSON.parse(localStorage.getItem('room:XYZ999'))
    expect(stored.role).toBe('participant')
    expect(stored.participantName).toBe('Bob')
    expect(stored.participantId).toBeDefined()
  })
})
