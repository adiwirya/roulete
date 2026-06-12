# Spinwheel App — Design Spec
**Date:** 2026-06-12

## Overview

A multiplayer spinwheel website where a host creates a room with custom entries, shares it via link or QR code, and participants each spin once to get a private result. Entries are hidden from participants (no labels shown), results are revealed only to the spinner, and the host maintains a full log of all results.

---

## User Roles

**Host**
- Creates the room with a list of custom entries
- Sees the full wheel with labels
- Views a real-time log of who got what
- Shares the room via code + QR code
- Manually tells participants when to spin (no automated queue)

**Participant**
- Joins via `/room/:code` link or QR scan
- Enters their name on join
- Sees a wheel with colored segments but no labels
- Spins once; result is shown only on their screen via a private modal
- Cannot spin again after their first spin

---

## User Flow

### Host
1. Open app → fill in host name + list of entries → click "Buat Room"
2. Receive room code (e.g. `ABC123`) + QR code → share to participants
3. View full wheel (with labels) + log sidebar
4. Verbally instruct participants to spin one at a time

### Participant
1. Scan QR / open `/room/ABC123` → enter name → join
2. See wheel with N unlabeled colored segments
3. When host says it's their turn → click "Spin"
4. Wheel animates for all viewers → only their screen shows a result modal
5. One segment disappears from the wheel for everyone

---

## Architecture

### Tech Stack
- **Vue 3 + Vite** — Composition API, no external state management
- **Vue Router** — two routes: `/` and `/room/:code`
- **Supabase JS** — Realtime Broadcast only, no database reads/writes
- **qrcode** (npm) — client-side QR code generation

### Pages & Components
```
/                     → HomePage
  CreateRoomForm      → host name + entries input
  JoinRoomForm        → room code + participant name input

/room/:code           → RoomPage
  ├── SpinWheel       → canvas/CSS wheel animation
  ├── HostPanel       → visible only to host
  │   ├── EntryList   → remaining entries with labels
  │   ├── SpinLog     → {name, entry, timestamp}[] log
  │   └── SharePanel  → room code display + QR code
  └── ResultModal     → private result overlay for participant after spin
```

### Supabase Realtime Channels

| Channel | Direction | Events |
|---|---|---|
| `room:{code}` | broadcast to all | `join`, `spin_request`, `wheel_update`, `entry_removed` |
| `room:{code}:result:{participantId}` | host → specific participant | `spin_result` |

---

## State Model

### Host (in-memory only)
```ts
entries: { id: string; label: string; color: string }[]
log:     { participantId: string; name: string; label: string; timestamp: Date }[]
participants: { id: string; name: string }[]
```

### Participant (in-memory only)
```ts
wheelSegments: { id: string; color: string }[]   // no labels
myResult: string | null                           // populated after spin
hasSpun: boolean
```

---

## Spin Mechanics & Real-time Event Flow

```
Participant clicks "Spin"
  → broadcast spin_request { participantId, name } to room:{code}
  → all viewers see wheel spinning (no label reveal)

Host browser (always-on listener)
  → receives spin_request
  → picks random entry from entries[]
  → removes entry from entries[]
  → broadcasts entry_removed { remainingCount } to room:{code}   ← no label
  → broadcasts spin_result { label } to room:{code}:result:{participantId}
  → appends to log[]

Spinning participant
  → subscribed to their private channel
  → receives spin_result → shows ResultModal with label
  → wheel for everyone updates (one segment fewer)

Host sidebar
  → log updates automatically
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Host refreshes/closes browser | Participants see "Host disconnected" notice; room is gone |
| All entries exhausted | Wheel shows empty state; Spin button disabled for everyone |
| Participant tries to spin twice | Spin button disabled after first spin (tracked in local session) |
| Participant joins mid-session | Receives current `wheel_update` with remaining segments (no labels) |
| Multiple participants spin simultaneously | First `spin_request` processed; others receive "please wait" |

---

## Privacy Model

Entries never leave the host's browser as readable text. Participants only receive:
- Segment **count** and **colors** (not labels) via `wheel_update`
- Their own result label via a private per-participant channel

The host is the single source of truth and the sole entity that holds the full entries list.

---

## Out of Scope

- Persistent rooms (data deleted when host closes browser)
- Authentication / user accounts
- Automated turn queue
- Spectator mode with visible labels
- Re-spinning or editing entries mid-session
