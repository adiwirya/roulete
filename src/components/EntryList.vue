<template>
  <div>
    <h3 style="margin: 0 0 8px">Entries Tersisa ({{ entries.length }})</h3>
    <p v-if="entries.length === 0" style="color: #9ca3af; font-style: italic">
      Semua entry sudah dipilih.
    </p>
    <ul style="list-style: none; padding: 0; margin: 0">
      <li
        v-for="entry in entries"
        :key="entry.id"
        :style="{ borderLeft: `4px solid ${entry.color}`, paddingLeft: '10px', marginBottom: '6px' }"
      >
        {{ entry.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ entries: { type: Array, required: true } })
</script>
