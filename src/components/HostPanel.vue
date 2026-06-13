<template>
  <div style="display: flex; flex-direction: column; gap: 20px">
    <SharePanel :code="code" />
    <hr class="divider-h" />
    <EntryList :entries="entries" />
    <hr class="divider-h" />
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
