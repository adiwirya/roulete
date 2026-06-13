<template>
  <div class="page-center">
    <h1 class="app-brand">Spinwheel</h1>
    <div class="cards-row">
      <div class="glass card-col">
        <h2 class="section-title">Buat Room Baru</h2>
        <CreateRoomForm />
      </div>
      <div class="divider-v"></div>
      <div class="glass card-col">
        <h2 class="section-title">Join Room</h2>
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
