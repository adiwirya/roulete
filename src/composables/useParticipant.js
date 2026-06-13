import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useParticipant(roomCode, participantId, name) {
  const segments = ref([])
  const myResult = ref(null)
  const hasSpun = ref(!!localStorage.getItem(`room:${roomCode}:spun:${participantId}`))
  const isSpinning = ref(false)
  const sessionClosed = ref(false)
  const myTurn = ref(false)

  let mainChannel = null
  let privateChannel = null

  function spin() {
    if (hasSpun.value || isSpinning.value || segments.value.length === 0 || !myTurn.value) return
    isSpinning.value = true
    setTimeout(() => { isSpinning.value = false }, 10_000)
    mainChannel.send({
      type: 'broadcast',
      event: 'spin_request',
      payload: { participantId, name },
    })
  }

  function subscribe() {
    mainChannel = supabase.channel(`room:${roomCode}`)
    mainChannel
      .on('broadcast', { event: 'wheel_update' }, ({ payload }) => {
        segments.value = payload.segments
      })
      .on('broadcast', { event: 'entry_removed' }, ({ payload }) => {
        segments.value = payload.segments
        isSpinning.value = false
      })
      .on('broadcast', { event: 'turn_update' }, ({ payload }) => {
        myTurn.value = payload.currentParticipantId === participantId
      })
      .on('broadcast', { event: 'session_closed' }, () => {
        sessionClosed.value = true
      })
      .subscribe(() => {
        mainChannel.send({
          type: 'broadcast',
          event: 'join',
          payload: { participantId, name },
        })
      })

    privateChannel = supabase.channel(`room:${roomCode}:result:${participantId}`)
    privateChannel
      .on('broadcast', { event: 'spin_result' }, ({ payload }) => {
        myResult.value = payload.label
        hasSpun.value = true
        myTurn.value = false
        localStorage.setItem(`room:${roomCode}:spun:${participantId}`, '1')
        isSpinning.value = false
      })
      .subscribe()
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    if (privateChannel) supabase.removeChannel(privateChannel)
  }

  return { segments, myResult, hasSpun, isSpinning, sessionClosed, myTurn, spin, subscribe, unsubscribe }
}
