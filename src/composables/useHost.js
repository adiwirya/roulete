import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { getColor } from '../utils/colors'

export function useHost(roomCode) {
  const entries = ref([])
  const log = ref([])
  const participants = ref([])
  const isSpinning = ref(false)

  let mainChannel = null
  const participantChannels = new Map()

  function initEntries(labels) {
    entries.value = labels.map((label, i) => ({
      id: crypto.randomUUID(),
      label: label.trim(),
      color: getColor(i),
    }))
  }

  function broadcastWheelUpdate() {
    mainChannel.send({
      type: 'broadcast',
      event: 'wheel_update',
      payload: {
        segments: entries.value.map(({ id, color }) => ({ id, color })),
      },
    })
  }

  async function handleJoin({ participantId, name }) {
    if (!participants.value.find(p => p.id === participantId)) {
      participants.value.push({ id: participantId, name })
    }
    if (!participantChannels.has(participantId)) {
      const ch = supabase.channel(`room:${roomCode}:result:${participantId}`)
      await ch.subscribe()
      participantChannels.set(participantId, ch)
    }
    broadcastWheelUpdate()
  }

  async function handleSpinRequest({ participantId, name }) {
    if (isSpinning.value || entries.value.length === 0) return
    isSpinning.value = true

    const idx = Math.floor(Math.random() * entries.value.length)
    const picked = entries.value.splice(idx, 1)[0]

    log.value.unshift({ participantId, name, label: picked.label, timestamp: new Date() })

    mainChannel.send({
      type: 'broadcast',
      event: 'entry_removed',
      payload: {
        segments: entries.value.map(({ id, color }) => ({ id, color })),
      },
    })

    // If host missed the join event, create private channel on-demand
    if (!participantChannels.has(participantId)) {
      const ch = supabase.channel(`room:${roomCode}:result:${participantId}`)
      await ch.subscribe()
      participantChannels.set(participantId, ch)
    }

    participantChannels.get(participantId).send({
      type: 'broadcast',
      event: 'spin_result',
      payload: { label: picked.label },
    })

    isSpinning.value = false
  }

  function subscribe() {
    mainChannel = supabase.channel(`room:${roomCode}`)
    mainChannel
      .on('broadcast', { event: 'join' }, ({ payload }) => handleJoin(payload))
      .on('broadcast', { event: 'spin_request' }, ({ payload }) => handleSpinRequest(payload))
      .subscribe()
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    participantChannels.forEach(ch => supabase.removeChannel(ch))
    participantChannels.clear()
  }

  return { entries, log, participants, isSpinning, initEntries, subscribe, unsubscribe }
}
