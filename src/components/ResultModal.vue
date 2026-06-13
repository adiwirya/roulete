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
defineProps({ result: { type: [String, null], default: null } })
defineEmits(['close'])
</script>
