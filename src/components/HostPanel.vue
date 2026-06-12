<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <SharePanel :code="code" />
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0" />
    <EntryList :entries="entries" />
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0" />
    <SpinLog :log="log" />
  </div>
</template>

<script setup>
import SharePanel from './SharePanel.vue'
import EntryList from './EntryList.vue'
import SpinLog from './SpinLog.vue'

defineProps({
  code: { type: String, required: true },
  entries: { type: Array, required: true },
  log: { type: Array, required: true },
})
</script>
