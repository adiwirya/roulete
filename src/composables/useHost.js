import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { getColor } from '../utils/colors'

export function useHost(roomCode) {
  const entries = ref([])
  const log = ref([])
  const participants = ref([])
  const isSpinning = ref(false)
  const currentTurnIndex = ref(0)

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

  function broadcastTurnUpdate() {
    const current = participants.value[currentTurnIndex.value]
    mainChannel.send({
      type: 'broadcast',
      event: 'turn_update',
      payload: { currentParticipantId: current?.id ?? null },
    })
  }

  async function handleJoin({ participantId, name }) {
    if (!participants.value.find(p => p.id === participantId)) {
      participants.value.push({ id: participantId, name })
    }
    // Broadcast immediately — don't block on private channel setup
    broadcastWheelUpdate()
    broadcastTurnUpdate()
    // Subscribe private channel in background
    if (!participantChannels.has(participantId)) {
      const ch = supabase.channel(`room:${roomCode}:result:${participantId}`)
      await ch.subscribe()
      participantChannels.set(participantId, ch)
    }
  }

  async function handleSpinRequest({ participantId, name }) {
    if (isSpinning.value || entries.value.length === 0) return

    const currentParticipant = participants.value[currentTurnIndex.value]
    if (!currentParticipant || currentParticipant.id !== participantId) return

    isSpinning.value = true

    try {
      const idx = Math.floor(Math.random() * entries.value.length)
      const picked = entries.value.splice(idx, 1)[0]

      log.value.unshift({ participantId, name, label: picked.label, timestamp: new Date() })

      currentTurnIndex.value++

      mainChannel.send({
        type: 'broadcast',
        event: 'entry_removed',
        payload: {
          segments: entries.value.map(({ id, color }) => ({ id, color })),
        },
      })

      broadcastTurnUpdate()

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
    } finally {
      isSpinning.value = false
    }
  }

  function subscribe() {
    mainChannel = supabase.channel(`room:${roomCode}`)
    mainChannel
      .on('broadcast', { event: 'join' }, ({ payload }) => handleJoin(payload))
      .on('broadcast', { event: 'spin_request' }, ({ payload }) => handleSpinRequest(payload))
      .subscribe()
  }

  function closeSession() {
    if (mainChannel) {
      mainChannel.send({
        type: 'broadcast',
        event: 'session_closed',
        payload: {},
      })
    }
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    participantChannels.forEach(ch => supabase.removeChannel(ch))
    participantChannels.clear()
  }

  return { entries, log, participants, isSpinning, initEntries, subscribe, unsubscribe, closeSession }
}
