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
