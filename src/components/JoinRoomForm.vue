<template>
  <form @submit.prevent="submit">
    <div class="form-group">
      <label class="form-label">Room Code</label>
      <input
        name="roomCode"
        v-model="roomCode"
        type="text"
        class="form-input"
        placeholder="ABC123"
        maxlength="8"
        style="text-transform: uppercase; letter-spacing: 0.15em; font-family: 'Courier New', monospace; font-size: 1.05rem;"
      />
    </div>
    <div class="form-group">
      <label class="form-label">Nama Kamu</label>
      <input name="participantName" v-model="participantName" type="text" class="form-input" placeholder="Namamu" />
    </div>
    <button type="submit" class="btn btn-primary" :disabled="!isValid">Join Room</button>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ initialCode: { type: String, default: '' } })
const router = useRouter()
const roomCode = ref(props.initialCode.toUpperCase())
const participantName = ref('')

const isValid = computed(() =>
  roomCode.value.trim().length > 0 && participantName.value.trim().length > 0
)

function submit() {
  if (!isValid.value) return
  const code = roomCode.value.trim().toUpperCase()
  localStorage.setItem(`room:${code}`, JSON.stringify({
    role: 'participant',
    participantId: crypto.randomUUID(),
    participantName: participantName.value.trim(),
  }))
  router.push(`/room/${code}`)
}
</script>
