<template>
  <div>
    <h3 style="margin: 0 0 8px">Log Hasil</h3>
    <p v-if="log.length === 0" style="color: #9ca3af; font-style: italic">
      Belum ada yang spin.
    </p>
    <ul style="list-style: none; padding: 0; margin: 0">
      <li v-for="(entry, i) in log" :key="`${entry.participantId}-${entry.timestamp}`" style="margin-bottom: 6px">
        <strong>{{ entry.name }}</strong>
        <span style="margin: 0 6px">→</span>
        {{ entry.label }}
        <span style="color: #9ca3af; font-size: 0.75rem; margin-left: 8px">
          {{ formatTime(entry.timestamp) }}
        </span>
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
