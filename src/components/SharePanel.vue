<template>
  <div>
    <p style="margin: 0; color: #6b7280; font-size: 0.875rem">Room Code</p>
    <p style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.25em; margin: 4px 0">
      {{ code }}
    </p>
    <p style="font-size: 0.75rem; color: #9ca3af; word-break: break-all">{{ roomUrl }}</p>
    <canvas ref="qrCanvas" style="margin-top: 8px" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({ code: { type: String, required: true } })
const qrCanvas = ref(null)
const roomUrl = computed(() => `${window.location.origin}/room/${props.code}`)

onMounted(async () => {
  await QRCode.toCanvas(qrCanvas.value, roomUrl.value, { width: 180, margin: 1 })
})
</script>
