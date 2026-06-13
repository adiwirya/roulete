let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

// Short tick — pitch rises with speed (0–1 normalized)
export function playTick(speed = 0.5) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 380 + speed * 720   // 380–1100 Hz
    gain.gain.setValueAtTime(0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
    osc.start(now)
    osc.stop(now + 0.06)
  } catch (_) {}
}

// 4-note ascending fanfare: C5 E5 G5 C6
export function playFanfare() {
  try {
    const ctx = getCtx()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
      osc.start(t)
      osc.stop(t + 0.42)
    })
  } catch (_) {}
}
