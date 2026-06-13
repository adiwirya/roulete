<template>
  <div>
    <h3 class="list-title">
      Entries Tersisa
      <span class="count-badge">{{ entries.length }}</span>
    </h3>
    <p v-if="entries.length === 0" class="empty-hint">Semua entry sudah dipilih.</p>
    <ul class="entry-list">
      <li v-for="entry in entries" :key="entry.id" class="entry-item">
        <span class="entry-dot" :style="{ background: entry.color }"></span>
        {{ entry.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ entries: { type: Array, required: true } })
</script>
