import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useParticipant(roomCode, participantId, name) {
  const segments = ref([])
  const myResult = ref(null)
  const hasSpun = ref(false)
  const isSpinning = ref(false)

  let mainChannel = null
  let privateChannel = null

  function spin() {
    if (hasSpun.value || isSpinning.value || segments.value.length === 0) return
    isSpinning.value = true
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
        isSpinning.value = false
      })
      .subscribe()
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    if (privateChannel) supabase.removeChannel(privateChannel)
  }

  return { segments, myResult, hasSpun, isSpinning, spin, subscribe, unsubscribe }
}
