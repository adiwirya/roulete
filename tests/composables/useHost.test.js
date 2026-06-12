import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = {
  send: mockSend,
  on: (...args) => { mockOn(...args); return mockChannel },
  subscribe: (...args) => { mockSubscribe(...args); return mockChannel },
}
const mockRemoveChannel = vi.fn()

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

import { useHost } from '../../src/composables/useHost'

describe('useHost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initEntries creates entries with id, label, and color', () => {
    const { entries, initEntries } = useHost('TEST')
    initEntries(['Alice', 'Bob', 'Charlie'])
    expect(entries.value).toHaveLength(3)
    expect(entries.value[0]).toMatchObject({ label: 'Alice' })
    expect(entries.value[0].id).toBeDefined()
    expect(entries.value[0].color).toBeDefined()
  })

  it('initEntries trims whitespace from labels', () => {
    const { entries, initEntries } = useHost('TEST')
    initEntries(['  Alice  ', ' Bob'])
    expect(entries.value[0].label).toBe('Alice')
    expect(entries.value[1].label).toBe('Bob')
  })

  it('subscribe calls supabase.channel with the room code', async () => {
    const { subscribe } = useHost('ROOM1')
    const { supabase } = await import('../../src/lib/supabase')
    subscribe()
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM1')
  })

  it('subscribe registers listeners for join and spin_request events', () => {
    const { subscribe } = useHost('ROOM1')
    subscribe()
    expect(mockOn).toHaveBeenCalledWith('broadcast', { event: 'join' }, expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('broadcast', { event: 'spin_request' }, expect.any(Function))
  })
})
