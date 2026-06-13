<template>
  <div class="page-room">
    <div class="room-main">
      <h2 class="room-heading">
        Room: <span class="room-code-chip">{{ code }}</span>
        <span v-if="isHost" class="host-badge">Host</span>
      </h2>

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
          :disabled="hasSpun || isSpinning || wheelSegments.length === 0"
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
const hostEntries = computed(() => host?.entries.value ?? [])
const hostLog = computed(() => host?.log.value ?? [])
const myResult = ref(null)

const spinButtonLabel = computed(() => {
  if (hasSpun.value) return 'Sudah Spin ✓'
  if (isSpinning.value) return 'Spinning...'
  if (wheelSegments.value.length === 0) return 'Menunggu...'
  return 'Spin!'
})

watchEffect(() => {
  if (participant?.myResult.value) {
    myResult.value = participant.myResult.value
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
</script>
