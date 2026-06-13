<template>
  <form @submit.prevent="submit">
    <div class="form-group">
      <label class="form-label">Nama Host</label>
      <input name="hostName" v-model="hostName" type="text" class="form-input" placeholder="Nama kamu" />
    </div>
    <div class="form-group">
      <label class="form-label">Daftar Entry (satu per baris, minimal 2)</label>
      <textarea name="entries" v-model="entriesText" class="form-textarea" placeholder="Alice&#10;Bob&#10;Charlie" rows="8" />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="!isValid">Buat Room</button>
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
