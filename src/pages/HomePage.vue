<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px">
    <div style="display: flex; gap: 64px; flex-wrap: wrap; justify-content: center; max-width: 800px; width: 100%">
      <div style="flex: 1; min-width: 280px">
        <h2 style="margin: 0 0 16px">Buat Room Baru</h2>
        <CreateRoomForm />
      </div>
      <div style="width: 1px; background: #e5e7eb; flex-shrink: 0"></div>
      <div style="flex: 1; min-width: 280px">
        <h2 style="margin: 0 0 16px">Join Room</h2>
        <JoinRoomForm :initialCode="joinCode" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CreateRoomForm from '../components/CreateRoomForm.vue'
import JoinRoomForm from '../components/JoinRoomForm.vue'

const route = useRoute()
const joinCode = computed(() => (route.query.join ?? '').toUpperCase())
</script>
