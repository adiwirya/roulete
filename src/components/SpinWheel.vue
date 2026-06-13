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
import { playTick } from '../utils/sounds'

const props = defineProps({
  segments: { type: Array, required: true },
  showLabels: { type: Boolean, default: false },
  spinning: { type: Boolean, default: false },
  size: { type: Number, default: 400 },
})
const emit = defineEmits(['spin', 'spinEnd'])

const canvasRef = ref(null)
let animationId = null
let currentAngle = 0
let spinSpeed = 0
let spinStartedAt = 0
let lastTickAngle = 0
let didSpin = false

const MIN_SPIN_MS = 2500   // full-speed phase
const MAX_SPEED = 0.30
const ACCEL = 0.013
const DECEL = 0.960        // total ~5s (2.5s full + ~2.5s decel)

watch(() => props.spinning, (val) => {
  if (val) {
    spinStartedAt = performance.now()
    didSpin = true
  }
})

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
  const elapsed = spinStartedAt > 0 ? performance.now() - spinStartedAt : Infinity
  const keepSpinning = props.spinning || (spinStartedAt > 0 && elapsed < MIN_SPIN_MS)

  if (keepSpinning) {
    spinSpeed = Math.min(spinSpeed + ACCEL, MAX_SPEED)
  } else {
    if (spinStartedAt > 0 && elapsed >= MIN_SPIN_MS) spinStartedAt = 0
    if (spinSpeed > 0) {
      spinSpeed *= DECEL
      if (spinSpeed < 0.001) {
        spinSpeed = 0
        if (didSpin) {
          didSpin = false
          emit('spinEnd')
        }
      }
    }
  }

  currentAngle += spinSpeed

  // Tick sound: fire on each segment boundary crossing
  if (spinSpeed > 0.02 && props.segments.length > 0) {
    const segAngle = (2 * Math.PI) / props.segments.length
    const delta = currentAngle - lastTickAngle
    if (delta >= segAngle) {
      lastTickAngle = currentAngle - (delta % segAngle)
      playTick(spinSpeed / MAX_SPEED)
    }
  } else {
    lastTickAngle = currentAngle
  }

  draw(currentAngle)
  animationId = requestAnimationFrame(animate)
}

onMounted(() => { animationId = requestAnimationFrame(animate) })
onUnmounted(() => { if (animationId) cancelAnimationFrame(animationId) })
watch(() => props.segments.length, () => draw(currentAngle))
</script>
