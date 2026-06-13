<template>
  <div>
    <h3 class="list-title">Log Hasil</h3>
    <p v-if="log.length === 0" class="empty-hint">Belum ada yang spin.</p>
    <ul class="log-list">
      <li v-for="entry in log" :key="`${entry.participantId}-${entry.timestamp}`" class="log-item">
        <span class="log-name">{{ entry.name }}</span>
        <span class="log-arrow">→</span>
        <span class="log-result">{{ entry.label }}</span>
        <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ log: { type: Array, required: true } })

function formatTime(date) {
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>
