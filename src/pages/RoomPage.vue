<template>
  <div class="page-room">
    <div class="room-main">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center">
        <h2 class="room-heading">
          Room: <span class="room-code-chip">{{ code }}</span>
          <span v-if="isHost" class="host-badge">Host</span>
        </h2>
        <button v-if="isHost" @click="handleCloseSession" class="btn btn-danger">Tutup Session</button>
        <button v-else @click="handleLeave" class="btn btn-ghost">Tinggalkan</button>
      </div>

      <SpinWheel
        :segments="wheelSegments"
        :showLabels="isHost"
        :spinning="isSpinning"
        :size="400"
        @spin="onSpin"
      />

      <template v-if="!isHost">
        <button
          @click="onSpin"
          class="btn btn-spin"
          :disabled="hasSpun || isSpinning || wheelSegments.length === 0 || !myTurn"
        >
          {{ spinButtonLabel }}
        </button>
        <p v-if="wheelSegments.length === 0 && !hasSpun" class="wait-text">
          Menunggu host memulai...
        </p>
      </template>
    </div>

    <div v-if="isHost" class="room-sidebar">
      <div class="glass" style="padding: 24px">
        <HostPanel :code="code" :entries="hostEntries" :log="hostLog" />
      </div>
    </div>

    <ResultModal :result="myResult" @close="myResult = null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SpinWheel from '../components/SpinWheel.vue'
import HostPanel from '../components/HostPanel.vue'
import ResultModal from '../components/ResultModal.vue'
import { useHost } from '../composables/useHost'
import { useParticipant } from '../composables/useParticipant'

const route = useRoute()
const router = useRouter()
const code = route.params.code

const stored = JSON.parse(localStorage.getItem(`room:${code}`) || 'null')

if (!stored) {
  router.replace(`/?join=${code}`)
}

const isHost = stored?.role === 'host'

const host = isHost ? useHost(code) : null
if (isHost && host) host.initEntries(stored.entries)

const participant = stored?.role === 'participant'
  ? useParticipant(code, stored.participantId, stored.participantName)
  : null

const wheelSegments = computed(() => {
  if (isHost && host) {
    return host.entries.value.map(({ id, color, label }) => ({ id, color, label }))
  }
  return participant?.segments.value ?? []
})

const isSpinning = computed(() =>
  isHost ? (host?.isSpinning.value ?? false) : (participant?.isSpinning.value ?? false)
)
const hasSpun = computed(() => participant?.hasSpun.value ?? false)
const myTurn = computed(() => participant?.myTurn.value ?? false)
const hostEntries = computed(() => host?.entries.value ?? [])
const hostLog = computed(() => host?.log.value ?? [])
const myResult = ref(null)

const spinButtonLabel = computed(() => {
  if (hasSpun.value) return 'Sudah Spin ✓'
  if (isSpinning.value) return 'Spinning...'
  if (wheelSegments.value.length === 0) return 'Menunggu...'
  if (!myTurn.value) return 'Tunggu giliran...'
  return 'Spin!'
})

watchEffect(() => {
  if (participant?.myResult.value) {
    myResult.value = participant.myResult.value
  }
})

watchEffect(() => {
  if (participant?.sessionClosed.value) {
    participant.unsubscribe()
    localStorage.removeItem(`room:${code}`)
    router.replace('/')
  }
})

onMounted(() => {
  if (isHost) host?.subscribe()
  else participant?.subscribe()
})

onUnmounted(() => {
  if (isHost) host?.unsubscribe()
  else participant?.unsubscribe()
})

function onSpin() {
  if (!isHost) participant?.spin()
}

function handleCloseSession() {
  if (!confirm('Tutup session? Semua peserta akan dikembalikan ke halaman utama.')) return
  host.closeSession()
  host.unsubscribe()
  localStorage.removeItem(`room:${code}`)
  router.replace('/')
}

function handleLeave() {
  participant?.unsubscribe()
  localStorage.removeItem(`room:${code}`)
  router.replace('/')
}
</script>
