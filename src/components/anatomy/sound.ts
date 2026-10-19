/*
 * The benches' sound: a few synthesized cues (no files), off until the
 * visitor turns it on. The choice is remembered and shared by every figure.
 */

type Listener = (on: boolean) => void
let ctx: AudioContext | null = null
let on = false
const listeners = new Set<Listener>()

try {
  on = typeof localStorage !== 'undefined' && localStorage.getItem('bench-sound') === 'on'
} catch {
  // Storage blocked: sound stays off.
}

export const soundOn = () => on
export function setSound(next: boolean) {
  on = next
  try {
    localStorage.setItem('bench-sound', next ? 'on' : 'off')
  } catch {
    // Not persisted; fine.
  }
  if (next) audio()?.resume()
  listeners.forEach((l) => l(next))
}
export function onSound(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function audio() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

/** One enveloped tone. */
function tone(freq: number, dur: number, { type = 'sine' as OscillatorType, gain = 0.08, slide = 0, delay = 0 } = {}) {
  if (!on) return
  const a = audio()
  if (!a || a.state === 'suspended') return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

/** A short burst of filtered noise: a slide or a whoosh. */
function noise(dur: number, freq: number, gain = 0.05) {
  if (!on) return
  const a = audio()
  if (!a || a.state === 'suspended') return
  const n = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, n, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(a.destination)
  src.start()
}

export const sfx = {
  click: () => tone(1800, 0.03, { type: 'square', gain: 0.025 }),
  tick: () => tone(2400, 0.015, { type: 'square', gain: 0.015 }),
  thunk: () => (tone(140, 0.12, { type: 'triangle', gain: 0.12, slide: -60 }), noise(0.05, 900, 0.03)),
  clunk: () => (tone(90, 0.16, { type: 'square', gain: 0.05, slide: -30 }), noise(0.06, 500, 0.05)),
  slide: () => noise(0.18, 1400, 0.035),
  chime: () => (tone(880, 0.25, { gain: 0.06 }), tone(1320, 0.3, { gain: 0.04, delay: 0.07 })),
  buzz: () => tone(160, 0.14, { type: 'sawtooth', gain: 0.03 }),
  blip: (n = 0) => tone(660 + n * 90, 0.06, { type: 'triangle', gain: 0.05 }),
}
