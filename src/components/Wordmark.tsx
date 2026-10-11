'use client'

import { useEffect, useRef } from 'react'

/**
 * Wordmark — the footer's outlined MAKASARE. Letters near the pointer lift
 * and fill with ink, falling off with distance like a magnet passing under
 * them; each letter eases toward its target so the wave stays smooth.
 * Fine pointers only; reduced motion keeps the plain outline.
 */
export function Wordmark({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current!
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const letters = Array.from(el.querySelectorAll<HTMLElement>('span'))
    const cur = letters.map(() => 0)
    let target = letters.map(() => 0)
    let raf = 0

    const loop = () => {
      let moving = false
      letters.forEach((l, i) => {
        cur[i] += (target[i] - cur[i]) * 0.14
        if (Math.abs(target[i] - cur[i]) > 0.002) moving = true
        l.style.setProperty('--p', cur[i].toFixed(3))
      })
      raf = moving ? requestAnimationFrame(loop) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onMove = (e: PointerEvent) => {
      const reach = el.clientWidth * 0.16
      target = letters.map((l) => {
        const r = l.getBoundingClientRect()
        const d = Math.abs(e.clientX - (r.left + r.width / 2))
        return Math.max(0, 1 - d / reach) ** 1.6
      })
      kick()
    }
    const onLeave = () => {
      target = letters.map(() => 0)
      kick()
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <p ref={ref} className="lab-foot-name" aria-hidden>
      {Array.from(text).map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </p>
  )
}
