import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = {
  send: mockSend,
  on: (...args) => { mockOn(...args); return mockChannel },
  subscribe: (...args) => { mockSubscribe(...args); return mockChannel },
}

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

import { useParticipant } from '../../src/composables/useParticipant'

describe('useParticipant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with empty segments, no result, and hasSpun=false', () => {
    const { segments, myResult, hasSpun } = useParticipant('ROOM', 'pid1', 'Alice')
    expect(segments.value).toEqual([])
    expect(myResult.value).toBeNull()
    expect(hasSpun.value).toBe(false)
  })

  it('subscribe opens main channel and private result channel', async () => {
    const { subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    const { supabase } = await import('../../src/lib/supabase')
    subscribe()
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM')
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM:result:pid1')
  })

  it('spin broadcasts spin_request with participantId and name', () => {
    const { segments, myTurn, spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    segments.value = [{ id: '1', color: '#fff' }]
    myTurn.value = true
    spin()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'spin_request',
        payload: { participantId: 'pid1', name: 'Alice' },
      })
    )
  })

  it('spin does nothing when hasSpun is true', () => {
    const { hasSpun, segments, spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    segments.value = [{ id: '1', color: '#fff' }]
    hasSpun.value = true
    spin()
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('spin does nothing when segments is empty', () => {
    const { spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    spin()
    expect(mockSend).not.toHaveBeenCalled()
  })
})
