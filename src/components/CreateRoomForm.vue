<template>
  <form @submit.prevent="submit">
    <div>
      <label>Nama Host</label>
      <input name="hostName" v-model="hostName" type="text" placeholder="Nama kamu" />
    </div>
    <div>
      <label>Daftar Entry (satu per baris, minimal 2)</label>
      <textarea name="entries" v-model="entriesText" placeholder="Alice&#10;Bob&#10;Charlie" rows="8" />
    </div>
    <button type="submit" :disabled="!isValid">Buat Room</button>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { generateRoomCode } from '../utils/roomCode'

const router = useRouter()
const hostName = ref('')
const entriesText = ref('')

const validEntries = computed(() =>
  entriesText.value.split('\n').map(e => e.trim()).filter(Boolean)
)

const isValid = computed(() =>
  hostName.value.trim().length > 0 && validEntries.value.length >= 2
)

function submit() {
  if (!isValid.value) return
  const code = generateRoomCode()
  localStorage.setItem(`room:${code}`, JSON.stringify({
    role: 'host',
    hostName: hostName.value.trim(),
    entries: validEntries.value,
  }))
  router.push(`/room/${code}`)
}
</script>
