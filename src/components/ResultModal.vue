<template>
  <Transition name="fade">
    <div
      v-if="result"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 100; cursor: pointer"
      @click="$emit('close')"
    >
      <div
        style="background: #fff; border-radius: 20px; padding: 48px 56px; text-align: center; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.4)"
        @click.stop
      >
        <p style="font-size: 1rem; color: #6b7280; margin: 0 0 12px">Hasil kamu:</p>
        <p style="font-size: 2.8rem; font-weight: 800; color: #1f2937; margin: 0 0 24px">
          {{ result }}
        </p>
        <button
          style="padding: 10px 28px; font-size: 0.9rem; cursor: pointer; border-radius: 8px; border: 1px solid #d1d5db"
          @click="$emit('close')"
        >
          Tutup
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ result: { type: [String, null], default: null } })
defineEmits(['close'])
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
