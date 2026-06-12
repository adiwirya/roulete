<template>
  <div style="display: flex; gap: 32px; padding: 24px; max-width: 1100px; margin: 0 auto; min-height: 100vh">
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 16px">
      <h2 style="margin: 0">
        Room: <code>{{ code }}</code>
        <span v-if="isHost" style="font-size: 0.8rem; color: #6b7280; margin-left: 8px">(Host)</span>
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
          :disabled="hasSpun || isSpinning || wheelSegments.length === 0"
          style="padding: 14px 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; border-radius: 12px; border: none; background: #3b82f6; color: white"
        >
          {{ spinButtonLabel }}
        </button>
        <p v-if="wheelSegments.length === 0 && !hasSpun" style="color: #9ca3af">
          Menunggu host memulai...
        </p>
      </template>
    </div>

    <div v-if="isHost" style="width: 300px; overflow-y: auto; padding: 8px">
      <HostPanel :code="code" :entries="hostEntries" :log="hostLog" />
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

// Redirect to home with pre-filled code if no session found
if (!stored) {
  router.replace(`/?join=${code}`)
}

const isHost = stored?.role === 'host'

const host = isHost ? useHost(code) : null
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
