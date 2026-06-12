# Spinwheel App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multiplayer spinwheel web app where a host creates a room with hidden entries, participants each spin once to receive a private result, and the host sees a full log.

**Architecture:** Vue 3 SPA with Vue Router. Host state lives entirely in-memory; real-time sync via Supabase Realtime Broadcast. A private per-participant Supabase channel delivers spin results without exposing entry labels to other users.

**Tech Stack:** Vue 3, Vite, Vue Router 4, @supabase/supabase-js, qrcode, Vitest, @vue/test-utils

---

## File Structure

```
src/
├── main.js
├── App.vue
├── router/index.js
├── lib/supabase.js
├── utils/
│   ├── roomCode.js
│   └── colors.js
├── composables/
│   ├── useHost.js
│   └── useParticipant.js
├── pages/
│   ├── HomePage.vue
│   └── RoomPage.vue
└── components/
    ├── CreateRoomForm.vue
    ├── JoinRoomForm.vue
    ├── SpinWheel.vue
    ├── SharePanel.vue
    ├── EntryList.vue
    ├── SpinLog.vue
    ├── HostPanel.vue
    └── ResultModal.vue
tests/
├── utils/
│   ├── roomCode.test.js
│   └── colors.test.js
├── composables/
│   ├── useHost.test.js
│   └── useParticipant.test.js
└── components/
    ├── CreateRoomForm.test.js
    └── JoinRoomForm.test.js
.env.example
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.vue`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd D:\spinwheel
npm create vite@latest . -- --template vue
```

Accept overwrite when prompted (the directory already has files).

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install vue-router@4 @supabase/supabase-js qrcode
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vue/test-utils jsdom @vitejs/plugin-vue
```

- [ ] **Step 4: Configure Vitest in vite.config.js**

Replace the entire contents of `vite.config.js`:
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: Add test scripts to package.json**

In the `"scripts"` section of `package.json`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Replace App.vue with router outlet**

Replace `src/App.vue`:
```vue
<template>
  <RouterView />
</template>
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite server running at http://localhost:5173 with no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vue 3 + Vite + Vitest project"
```

---

### Task 2: Utility Functions

**Files:**
- Create: `src/utils/roomCode.js`, `src/utils/colors.js`
- Create: `tests/utils/roomCode.test.js`, `tests/utils/colors.test.js`

- [ ] **Step 1: Write failing test for roomCode**

Create `tests/utils/roomCode.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { generateRoomCode } from '../../src/utils/roomCode'

describe('generateRoomCode', () => {
  it('generates a 6-character string by default', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('generates a string of specified length', () => {
    expect(generateRoomCode(8)).toHaveLength(8)
  })

  it('only uses uppercase letters and digits (no ambiguous chars like 0, O, 1, I)', () => {
    const code = generateRoomCode(200)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/)
  })

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(95)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test
```
Expected: FAIL — "Cannot find module '../../src/utils/roomCode'"

- [ ] **Step 3: Implement roomCode.js**

Create `src/utils/roomCode.js`:
```js
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 6) {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}
```

- [ ] **Step 4: Write failing test for colors**

Create `tests/utils/colors.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { getColor, SEGMENT_COLORS } from '../../src/utils/colors'

describe('getColor', () => {
  it('returns a hex color string', () => {
    expect(getColor(0)).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('wraps around when index exceeds palette length', () => {
    expect(getColor(0)).toBe(getColor(SEGMENT_COLORS.length))
  })

  it('returns different colors for adjacent indices', () => {
    expect(getColor(0)).not.toBe(getColor(1))
  })
})
```

- [ ] **Step 5: Implement colors.js**

Create `src/utils/colors.js`:
```js
export const SEGMENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#82E0AA', '#F0B27A', '#85C1E9',
]

export function getColor(index) {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]
}
```

- [ ] **Step 6: Run tests to verify all pass**

```bash
npm run test
```
Expected: PASS — 7 tests passing across both files.

- [ ] **Step 7: Commit**

```bash
git add src/utils/ tests/utils/
git commit -m "feat: add roomCode and colors utility functions"
```

---

### Task 3: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase.js`, `.env.example`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 2: Create your local .env**

Copy `.env.example` to `.env` and fill in values from your Supabase project.
To find them: go to https://supabase.com → your project → Project Settings → API.
No database setup needed — this app uses only Realtime Broadcast (no tables).

- [ ] **Step 3: Verify .env is in .gitignore**

Check `.gitignore` — Vite's default template already includes `.env`. If not, add it.

- [ ] **Step 4: Create supabase.js**

Create `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js .env.example
git commit -m "feat: add Supabase client"
```

---

### Task 4: Router Setup

**Files:**
- Create: `src/router/index.js`, `src/pages/HomePage.vue`, `src/pages/RoomPage.vue`
- Modify: `src/main.js`

- [ ] **Step 1: Create stub pages**

Create `src/pages/HomePage.vue`:
```vue
<template><div>Home</div></template>
```

Create `src/pages/RoomPage.vue`:
```vue
<template><div>Room: {{ $route.params.code }}</div></template>
```

- [ ] **Step 2: Create router**

Create `src/router/index.js`:
```js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import RoomPage from '../pages/RoomPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/room/:code', component: RoomPage },
  ],
})
```

- [ ] **Step 3: Register router in main.js**

Replace `src/main.js`:
```js
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
```

- [ ] **Step 4: Verify routing works**

```bash
npm run dev
```
- Open http://localhost:5173 → shows "Home"
- Open http://localhost:5173/room/TEST → shows "Room: TEST"

- [ ] **Step 5: Commit**

```bash
git add src/router/ src/pages/ src/main.js
git commit -m "feat: add Vue Router with Home and Room pages"
```

---

### Task 5: useHost Composable

The host is the single source of truth. It holds the entries array in memory, responds to participant `join` events by subscribing to that participant's private channel and broadcasting the current wheel state, and responds to `spin_request` by picking a random entry, removing it, broadcasting the removal (without labels), and sending the private result to the spinner's channel.

**Files:**
- Create: `src/composables/useHost.js`
- Create: `tests/composables/useHost.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/composables/useHost.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = {
  send: mockSend,
  on: (...args) => { mockOn(...args); return mockChannel },
  subscribe: (...args) => { mockSubscribe(...args); return mockChannel },
}
const mockRemoveChannel = vi.fn()

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  },
}))

import { useHost } from '../../src/composables/useHost'

describe('useHost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initEntries creates entries with id, label, and color', () => {
    const { entries, initEntries } = useHost('TEST')
    initEntries(['Alice', 'Bob', 'Charlie'])
    expect(entries.value).toHaveLength(3)
    expect(entries.value[0]).toMatchObject({ label: 'Alice' })
    expect(entries.value[0].id).toBeDefined()
    expect(entries.value[0].color).toBeDefined()
  })

  it('initEntries trims whitespace from labels', () => {
    const { entries, initEntries } = useHost('TEST')
    initEntries(['  Alice  ', ' Bob'])
    expect(entries.value[0].label).toBe('Alice')
    expect(entries.value[1].label).toBe('Bob')
  })

  it('subscribe calls supabase.channel with the room code', async () => {
    const { subscribe } = useHost('ROOM1')
    const { supabase } = await import('../../src/lib/supabase')
    subscribe()
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM1')
  })

  it('subscribe registers listeners for join and spin_request events', () => {
    const { subscribe } = useHost('ROOM1')
    subscribe()
    expect(mockOn).toHaveBeenCalledWith('broadcast', { event: 'join' }, expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('broadcast', { event: 'spin_request' }, expect.any(Function))
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test
```
Expected: FAIL — "Cannot find module '../../src/composables/useHost'"

- [ ] **Step 3: Implement useHost.js**

Create `src/composables/useHost.js`:
```js
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { getColor } from '../utils/colors'

export function useHost(roomCode) {
  const entries = ref([])
  const log = ref([])
  const participants = ref([])
  const isSpinning = ref(false)

  let mainChannel = null
  const participantChannels = new Map()

  function initEntries(labels) {
    entries.value = labels.map((label, i) => ({
      id: crypto.randomUUID(),
      label: label.trim(),
      color: getColor(i),
    }))
  }

  function broadcastWheelUpdate() {
    mainChannel.send({
      type: 'broadcast',
      event: 'wheel_update',
      payload: {
        segments: entries.value.map(({ id, color }) => ({ id, color })),
      },
    })
  }

  async function handleJoin({ participantId, name }) {
    if (!participants.value.find(p => p.id === participantId)) {
      participants.value.push({ id: participantId, name })
    }
    if (!participantChannels.has(participantId)) {
      const ch = supabase.channel(`room:${roomCode}:result:${participantId}`)
      await ch.subscribe()
      participantChannels.set(participantId, ch)
    }
    broadcastWheelUpdate()
  }

  async function handleSpinRequest({ participantId, name }) {
    if (isSpinning.value || entries.value.length === 0) return
    isSpinning.value = true

    const idx = Math.floor(Math.random() * entries.value.length)
    const picked = entries.value.splice(idx, 1)[0]

    log.value.unshift({ participantId, name, label: picked.label, timestamp: new Date() })

    mainChannel.send({
      type: 'broadcast',
      event: 'entry_removed',
      payload: {
        segments: entries.value.map(({ id, color }) => ({ id, color })),
      },
    })

    // If host missed the join event, create private channel on-demand
    if (!participantChannels.has(participantId)) {
      const ch = supabase.channel(`room:${roomCode}:result:${participantId}`)
      await ch.subscribe()
      participantChannels.set(participantId, ch)
    }

    participantChannels.get(participantId).send({
      type: 'broadcast',
      event: 'spin_result',
      payload: { label: picked.label },
    })

    isSpinning.value = false
  }

  function subscribe() {
    mainChannel = supabase.channel(`room:${roomCode}`)
    mainChannel
      .on('broadcast', { event: 'join' }, ({ payload }) => handleJoin(payload))
      .on('broadcast', { event: 'spin_request' }, ({ payload }) => handleSpinRequest(payload))
      .subscribe()
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    participantChannels.forEach(ch => supabase.removeChannel(ch))
    participantChannels.clear()
  }

  return { entries, log, participants, isSpinning, initEntries, subscribe, unsubscribe }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useHost.js tests/composables/useHost.test.js
git commit -m "feat: add useHost composable"
```

---

### Task 6: useParticipant Composable

**Files:**
- Create: `src/composables/useParticipant.js`
- Create: `tests/composables/useParticipant.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/composables/useParticipant.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockChannel = {
  send: mockSend,
  on: (...args) => { mockOn(...args); return mockChannel },
  subscribe: (...args) => { mockSubscribe(...args); return mockChannel },
}

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

import { useParticipant } from '../../src/composables/useParticipant'

describe('useParticipant', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with empty segments, no result, and hasSpun=false', () => {
    const { segments, myResult, hasSpun } = useParticipant('ROOM', 'pid1', 'Alice')
    expect(segments.value).toEqual([])
    expect(myResult.value).toBeNull()
    expect(hasSpun.value).toBe(false)
  })

  it('subscribe opens main channel and private result channel', async () => {
    const { subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    const { supabase } = await import('../../src/lib/supabase')
    subscribe()
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM')
    expect(supabase.channel).toHaveBeenCalledWith('room:ROOM:result:pid1')
  })

  it('spin broadcasts spin_request with participantId and name', () => {
    const { segments, spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    segments.value = [{ id: '1', color: '#fff' }]
    spin()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'spin_request',
        payload: { participantId: 'pid1', name: 'Alice' },
      })
    )
  })

  it('spin does nothing when hasSpun is true', () => {
    const { hasSpun, segments, spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    segments.value = [{ id: '1', color: '#fff' }]
    hasSpun.value = true
    spin()
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('spin does nothing when segments is empty', () => {
    const { spin, subscribe } = useParticipant('ROOM', 'pid1', 'Alice')
    subscribe()
    spin()
    expect(mockSend).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test
```
Expected: FAIL — "Cannot find module '../../src/composables/useParticipant'"

- [ ] **Step 3: Implement useParticipant.js**

Create `src/composables/useParticipant.js`:
```js
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useParticipant(roomCode, participantId, name) {
  const segments = ref([])
  const myResult = ref(null)
  const hasSpun = ref(false)
  const isSpinning = ref(false)

  let mainChannel = null
  let privateChannel = null

  function spin() {
    if (hasSpun.value || isSpinning.value || segments.value.length === 0) return
    isSpinning.value = true
    mainChannel.send({
      type: 'broadcast',
      event: 'spin_request',
      payload: { participantId, name },
    })
  }

  function subscribe() {
    mainChannel = supabase.channel(`room:${roomCode}`)
    mainChannel
      .on('broadcast', { event: 'wheel_update' }, ({ payload }) => {
        segments.value = payload.segments
      })
      .on('broadcast', { event: 'entry_removed' }, ({ payload }) => {
        segments.value = payload.segments
        isSpinning.value = false
      })
      .subscribe(() => {
        mainChannel.send({
          type: 'broadcast',
          event: 'join',
          payload: { participantId, name },
        })
      })

    privateChannel = supabase.channel(`room:${roomCode}:result:${participantId}`)
    privateChannel
      .on('broadcast', { event: 'spin_result' }, ({ payload }) => {
        myResult.value = payload.label
        hasSpun.value = true
        isSpinning.value = false
      })
      .subscribe()
  }

  function unsubscribe() {
    if (mainChannel) supabase.removeChannel(mainChannel)
    if (privateChannel) supabase.removeChannel(privateChannel)
  }

  return { segments, myResult, hasSpun, isSpinning, spin, subscribe, unsubscribe }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useParticipant.js tests/composables/useParticipant.test.js
git commit -m "feat: add useParticipant composable"
```

---

### Task 7: SpinWheel Component

Canvas-based animated wheel. Draws colored arcs per segment. Shows labels only when `showLabels=true`. Animation loop: accelerates while `spinning=true`, decelerates to rest when `false`. Emits `spin` on click (used by host view to allow visual interaction; actual spin is triggered by button).

**Files:**
- Create: `src/components/SpinWheel.vue`

- [ ] **Step 1: Create SpinWheel.vue**

Create `src/components/SpinWheel.vue`:
```vue
<template>
  <canvas
    ref="canvasRef"
    :width="size"
    :height="size"
    style="cursor: pointer; border-radius: 50%"
    @click="$emit('spin')"
  />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  segments: { type: Array, required: true },
  showLabels: { type: Boolean, default: false },
  spinning: { type: Boolean, default: false },
  size: { type: Number, default: 400 },
})
defineEmits(['spin'])

const canvasRef = ref(null)
let animationId = null
let currentAngle = 0
let spinSpeed = 0

function draw(angle) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = props.size / 2
  const cy = props.size / 2
  const radius = cx - 10

  ctx.clearRect(0, 0, props.size, props.size)

  if (props.segments.length === 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#e5e7eb'
    ctx.fill()
    ctx.fillStyle = '#6b7280'
    ctx.font = `16px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Wheel Empty', cx, cy)
    return
  }

  const sliceAngle = (Math.PI * 2) / props.segments.length

  props.segments.forEach((seg, i) => {
    const start = angle + i * sliceAngle
    const end = start + sliceAngle

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = seg.color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    if (props.showLabels && seg.label) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + sliceAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 4
      ctx.fillText(seg.label.slice(0, 20), radius - 12, 5)
      ctx.restore()
    }
  })

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // Pointer triangle at top
  ctx.beginPath()
  ctx.moveTo(cx, cy - radius + 4)
  ctx.lineTo(cx - 10, cy - radius - 14)
  ctx.lineTo(cx + 10, cy - radius - 14)
  ctx.closePath()
  ctx.fillStyle = '#1f2937'
  ctx.fill()
}

function animate() {
  if (props.spinning) {
    spinSpeed = Math.min(spinSpeed + 0.015, 0.35)
  } else if (spinSpeed > 0) {
    spinSpeed *= 0.97
    if (spinSpeed < 0.001) spinSpeed = 0
  }
  currentAngle += spinSpeed
  draw(currentAngle)
  animationId = requestAnimationFrame(animate)
}

onMounted(() => { animationId = requestAnimationFrame(animate) })
onUnmounted(() => { if (animationId) cancelAnimationFrame(animationId) })
watch(() => props.segments.length, () => draw(currentAngle))
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SpinWheel.vue
git commit -m "feat: add SpinWheel canvas component"
```

---

### Task 8: CreateRoomForm Component

Host enters their name and one entry per line (minimum 2). On submit, generates a room code, stores `{ role, hostName, entries }` in `localStorage` under key `room:{code}`, then navigates to `/room/{code}`.

**Files:**
- Create: `src/components/CreateRoomForm.vue`
- Create: `tests/components/CreateRoomForm.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/CreateRoomForm.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CreateRoomForm from '../../src/components/CreateRoomForm.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/room/:code', component: { template: '<div/>' } },
  ],
})

describe('CreateRoomForm', () => {
  it('submit button is disabled when inputs are empty', () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is disabled when only one entry is provided', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('submit button is enabled when host name and 2+ entries are filled', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('navigates to /room/:code on submit', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')
    await wrapper.find('form').trigger('submit')
    expect(router.currentRoute.value.path).toMatch(/^\/room\/[A-Z0-9]{6}$/)
  })

  it('saves session to localStorage on submit', async () => {
    const wrapper = mount(CreateRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="hostName"]').setValue('Adi')
    await wrapper.find('textarea[name="entries"]').setValue('Alice\nBob')
    await wrapper.find('form').trigger('submit')
    const code = router.currentRoute.value.params.code
    const stored = JSON.parse(localStorage.getItem(`room:${code}`))
    expect(stored.role).toBe('host')
    expect(stored.entries).toEqual(['Alice', 'Bob'])
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test
```
Expected: FAIL — "Cannot find module '../../src/components/CreateRoomForm'"

- [ ] **Step 3: Implement CreateRoomForm.vue**

Create `src/components/CreateRoomForm.vue`:
```vue
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/CreateRoomForm.vue tests/components/CreateRoomForm.test.js
git commit -m "feat: add CreateRoomForm component"
```

---

### Task 9: JoinRoomForm Component

Participant enters a room code and their name. On submit, generates a `participantId` via `crypto.randomUUID()`, stores `{ role, participantId, participantName }` in localStorage, and navigates to `/room/{code}`. Accepts an `initialCode` prop for pre-filling when redirected from the share link.

**Files:**
- Create: `src/components/JoinRoomForm.vue`
- Create: `tests/components/JoinRoomForm.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/components/JoinRoomForm.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import JoinRoomForm from '../../src/components/JoinRoomForm.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/room/:code', component: { template: '<div/>' } },
  ],
})

describe('JoinRoomForm', () => {
  it('submit button is disabled when inputs are empty', () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('pre-fills room code from initialCode prop', () => {
    const wrapper = mount(JoinRoomForm, {
      props: { initialCode: 'ABC123' },
      global: { plugins: [router] },
    })
    expect(wrapper.find('input[name="roomCode"]').element.value).toBe('ABC123')
  })

  it('navigates to /room/:code on submit', async () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="roomCode"]').setValue('ABC123')
    await wrapper.find('input[name="participantName"]').setValue('Alice')
    await wrapper.find('form').trigger('submit')
    expect(router.currentRoute.value.path).toBe('/room/ABC123')
  })

  it('saves participant session to localStorage on submit', async () => {
    const wrapper = mount(JoinRoomForm, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[name="roomCode"]').setValue('XYZ999')
    await wrapper.find('input[name="participantName"]').setValue('Bob')
    await wrapper.find('form').trigger('submit')
    const stored = JSON.parse(localStorage.getItem('room:XYZ999'))
    expect(stored.role).toBe('participant')
    expect(stored.participantName).toBe('Bob')
    expect(stored.participantId).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test
```
Expected: FAIL — "Cannot find module '../../src/components/JoinRoomForm'"

- [ ] **Step 3: Implement JoinRoomForm.vue**

Create `src/components/JoinRoomForm.vue`:
```vue
<template>
  <form @submit.prevent="submit">
    <div>
      <label>Room Code</label>
      <input
        name="roomCode"
        v-model="roomCode"
        type="text"
        placeholder="ABC123"
        maxlength="8"
        style="text-transform: uppercase"
      />
    </div>
    <div>
      <label>Nama Kamu</label>
      <input name="participantName" v-model="participantName" type="text" placeholder="Namamu" />
    </div>
    <button type="submit" :disabled="!isValid">Join Room</button>
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/JoinRoomForm.vue tests/components/JoinRoomForm.test.js
git commit -m "feat: add JoinRoomForm component"
```

---

### Task 10: SharePanel Component

Displays the room code in large text and generates a QR code pointing to the join URL using the `qrcode` npm library.

**Files:**
- Create: `src/components/SharePanel.vue`

- [ ] **Step 1: Create SharePanel.vue**

Create `src/components/SharePanel.vue`:
```vue
<template>
  <div>
    <p style="margin: 0; color: #6b7280; font-size: 0.875rem">Room Code</p>
    <p style="font-size: 2.5rem; font-weight: 800; letter-spacing: 0.25em; margin: 4px 0">
      {{ code }}
    </p>
    <p style="font-size: 0.75rem; color: #9ca3af; word-break: break-all">{{ roomUrl }}</p>
    <canvas ref="qrCanvas" style="margin-top: 8px" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({ code: { type: String, required: true } })
const qrCanvas = ref(null)
const roomUrl = computed(() => `${window.location.origin}/room/${props.code}`)

onMounted(async () => {
  await QRCode.toCanvas(qrCanvas.value, roomUrl.value, { width: 180, margin: 1 })
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SharePanel.vue
git commit -m "feat: add SharePanel with QR code"
```

---

### Task 11: EntryList and SpinLog Components

**Files:**
- Create: `src/components/EntryList.vue`
- Create: `src/components/SpinLog.vue`

- [ ] **Step 1: Create EntryList.vue**

Create `src/components/EntryList.vue`:
```vue
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
```

- [ ] **Step 2: Create SpinLog.vue**

Create `src/components/SpinLog.vue`:
```vue
<template>
  <div>
    <h3 style="margin: 0 0 8px">Log Hasil</h3>
    <p v-if="log.length === 0" style="color: #9ca3af; font-style: italic">
      Belum ada yang spin.
    </p>
    <ul style="list-style: none; padding: 0; margin: 0">
      <li v-for="(entry, i) in log" :key="i" style="margin-bottom: 6px">
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EntryList.vue src/components/SpinLog.vue
git commit -m "feat: add EntryList and SpinLog components"
```

---

### Task 12: HostPanel Component

**Files:**
- Create: `src/components/HostPanel.vue`

- [ ] **Step 1: Create HostPanel.vue**

Create `src/components/HostPanel.vue`:
```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HostPanel.vue
git commit -m "feat: add HostPanel component"
```

---

### Task 13: ResultModal Component

**Files:**
- Create: `src/components/ResultModal.vue`

- [ ] **Step 1: Create ResultModal.vue**

Create `src/components/ResultModal.vue`:
```vue
<template>
  <Transition name="fade">
    <div
      v-if="result"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 100; cursor: pointer"
      @click="$emit('close')"
    >
      <div
        style="background: #fff; border-radius: 20px; padding: 48px 56px; text-align: center; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.4)"
        @click.stop
      >
        <p style="font-size: 1rem; color: #6b7280; margin: 0 0 12px">Hasil kamu:</p>
        <p style="font-size: 2.8rem; font-weight: 800; color: #1f2937; margin: 0 0 24px">
          {{ result }}
        </p>
        <button
          style="padding: 10px 28px; font-size: 0.9rem; cursor: pointer; border-radius: 8px; border: 1px solid #d1d5db"
          @click="$emit('close')"
        >
          Tutup
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ result: { type: String, default: null } })
defineEmits(['close'])
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultModal.vue
git commit -m "feat: add ResultModal component"
```

---

### Task 14: RoomPage — Orchestration

RoomPage reads the role from `localStorage` on mount, initializes the correct composable, and wires up all components. If no session is found in localStorage (e.g., someone navigated directly via share link), redirect to `/?join={code}` so they can enter their name.

**Files:**
- Modify: `src/pages/RoomPage.vue`

- [ ] **Step 1: Implement RoomPage.vue**

Replace the entire contents of `src/pages/RoomPage.vue`:
```vue
<template>
  <div style="display: flex; gap: 32px; padding: 24px; max-width: 1100px; margin: 0 auto; min-height: 100vh">
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 16px">
      <h2 style="margin: 0">
        Room: <code>{{ code }}</code>
        <span v-if="isHost" style="font-size: 0.8rem; color: #6b7280; margin-left: 8px">(Host)</span>
      </h2>

      <SpinWheel
        :segments="wheelSegments"
        :showLabels="isHost"
        :spinning="isSpinning"
        :size="400"
        @spin="onSpin"
      />

      <template v-if="!isHost">
        <button
          @click="onSpin"
          :disabled="hasSpun || isSpinning || wheelSegments.length === 0"
          style="padding: 14px 40px; font-size: 1.2rem; font-weight: bold; cursor: pointer; border-radius: 12px; border: none; background: #3b82f6; color: white"
        >
          {{ spinButtonLabel }}
        </button>
        <p v-if="wheelSegments.length === 0 && !hasSpun" style="color: #9ca3af">
          Menunggu host memulai...
        </p>
      </template>
    </div>

    <div v-if="isHost" style="width: 300px; overflow-y: auto; padding: 8px">
      <HostPanel :code="code" :entries="hostEntries" :log="hostLog" />
    </div>

    <ResultModal :result="myResult" @close="myResult = null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SpinWheel from '../components/SpinWheel.vue'
import HostPanel from '../components/HostPanel.vue'
import ResultModal from '../components/ResultModal.vue'
import { useHost } from '../composables/useHost'
import { useParticipant } from '../composables/useParticipant'

const route = useRoute()
const router = useRouter()
const code = route.params.code

const stored = JSON.parse(localStorage.getItem(`room:${code}`) || 'null')

// Redirect to home with pre-filled code if no session found
if (!stored) {
  router.replace(`/?join=${code}`)
}

const isHost = stored?.role === 'host'

const host = isHost ? useHost(code) : null
const participant = stored?.role === 'participant'
  ? useParticipant(code, stored.participantId, stored.participantName)
  : null

const wheelSegments = computed(() => {
  if (isHost && host) {
    return host.entries.value.map(({ id, color, label }) => ({ id, color, label }))
  }
  return participant?.segments.value ?? []
})

const isSpinning = computed(() =>
  isHost ? (host?.isSpinning.value ?? false) : (participant?.isSpinning.value ?? false)
)
const hasSpun = computed(() => participant?.hasSpun.value ?? false)
const hostEntries = computed(() => host?.entries.value ?? [])
const hostLog = computed(() => host?.log.value ?? [])
const myResult = ref(null)

const spinButtonLabel = computed(() => {
  if (hasSpun.value) return 'Sudah Spin ✓'
  if (isSpinning.value) return 'Spinning...'
  if (wheelSegments.value.length === 0) return 'Menunggu...'
  return 'Spin!'
})

watchEffect(() => {
  if (participant?.myResult.value) {
    myResult.value = participant.myResult.value
  }
})

onMounted(() => {
  if (isHost) host?.subscribe()
  else participant?.subscribe()
})

onUnmounted(() => {
  if (isHost) host?.unsubscribe()
  else participant?.unsubscribe()
})

function onSpin() {
  if (!isHost) participant?.spin()
}
</script>
```

- [ ] **Step 2: Run all tests**

```bash
npm run test
```
Expected: PASS — all tests still passing (no tests for RoomPage, it's integration-level).

- [ ] **Step 3: Commit**

```bash
git add src/pages/RoomPage.vue
git commit -m "feat: implement RoomPage with host/participant orchestration"
```

---

### Task 15: HomePage

Renders CreateRoomForm and JoinRoomForm side by side. Reads `?join` query param (from the share link redirect) to pre-fill JoinRoomForm.

**Files:**
- Modify: `src/pages/HomePage.vue`

- [ ] **Step 1: Implement HomePage.vue**

Replace the entire contents of `src/pages/HomePage.vue`:
```vue
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
```

- [ ] **Step 2: Run all tests**

```bash
npm run test
```
Expected: PASS — all tests still passing.

- [ ] **Step 3: Test manually in browser**

```bash
npm run dev
```

**Happy path checklist:**
1. Open http://localhost:5173 → see two forms side by side
2. Fill in host name + 3+ entries → click "Buat Room" → redirects to `/room/CODE`
3. Should see the wheel with labels (host view) + HostPanel on the right
4. Open a new tab → go to http://localhost:5173/room/CODE → redirected to `/?join=CODE`
5. Enter a participant name → click "Join" → redirects to `/room/CODE`
6. Should see the wheel without labels + "Spin!" button
7. Click "Spin!" → wheel animates → ResultModal appears with a result
8. Switch back to host tab → log should show the participant's result
9. Check that the entry is removed from the host's EntryList

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.vue
git commit -m "feat: implement HomePage with create and join forms"
```

---

### Task 16: Final Polish and Edge Case Verification

**Files:** No new files — manual verification and minor fixes.

- [ ] **Step 1: Verify empty wheel state**

With only 1 entry remaining, spin it. Confirm:
- Wheel shows "Wheel Empty" after spin
- Spin button is disabled for remaining participants

- [ ] **Step 2: Verify spin-once enforcement**

After spinning once, confirm the Spin button shows "Sudah Spin ✓" and cannot be clicked again (disabled state).

- [ ] **Step 3: Verify multiple simultaneous spins are handled**

Open 3 participant tabs. Have two participants click Spin nearly simultaneously. Confirm only one entry is removed per spin (the `isSpinning` guard in `useHost.handleSpinRequest` prevents double-processing).

- [ ] **Step 4: Verify QR code links to correct URL**

In the host view, scan the QR code with a phone. Confirm it opens `http://<your-local-ip>:5173/room/CODE` and shows the join form with the code pre-filled.

Note: For LAN testing, use `npm run dev -- --host` to expose Vite on your local network IP.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final verification and polish"
```

---

## Summary

| Task | Output |
|---|---|
| 1 | Vue 3 + Vite + Vitest scaffold |
| 2 | roomCode + colors utilities with tests |
| 3 | Supabase client |
| 4 | Vue Router with stub pages |
| 5 | useHost composable with tests |
| 6 | useParticipant composable with tests |
| 7 | SpinWheel canvas component |
| 8 | CreateRoomForm with tests |
| 9 | JoinRoomForm with tests |
| 10 | SharePanel with QR code |
| 11 | EntryList + SpinLog |
| 12 | HostPanel |
| 13 | ResultModal |
| 14 | RoomPage orchestration |
| 15 | HomePage |
| 16 | Final verification |
