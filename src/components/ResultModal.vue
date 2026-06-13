<template>
  <Transition name="fade">
    <div v-if="result" class="modal-overlay" @click="$emit('close')">
      <div class="modal-card" @click.stop>
        <p class="modal-sublabel">Hasil kamu</p>
        <p class="modal-result">{{ result }}</p>
        <button class="btn btn-close" @click="$emit('close')">Tutup</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { watch } from 'vue'
import confetti from 'canvas-confetti'
import { playFanfare } from '../utils/sounds'

const props = defineProps({ result: { type: [String, null], default: null } })
defineEmits(['close'])

const COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a78bfa', '#f8fafc']

watch(() => props.result, (val) => {
  if (!val) return
  playFanfare()
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.58 }, colors: COLORS })
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: COLORS })
  }, 180)
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: COLORS })
  }, 350)
})
</script>
