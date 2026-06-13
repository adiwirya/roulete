<template>
  <div>
    <p class="share-label">Room Code</p>
    <p class="share-code">{{ code }}</p>
    <p class="share-url">{{ roomUrl }}</p>
    <canvas ref="qrCanvas" style="margin-top: 8px; border-radius: 8px;" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({ code: { type: String, required: true } })
const qrCanvas = ref(null)
const roomUrl = computed(() => `${window.location.origin}/room/${props.code}`)

onMounted(async () => {
  await QRCode.toCanvas(qrCanvas.value, roomUrl.value, {
    width: 180,
    margin: 1,
    color: { dark: '#1e1b4b', light: '#ffffff' },
  })
})
</script>
