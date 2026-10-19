'use client'

import { useEffect, useRef } from 'react'

/**
 * The footer name as a halftone: the word is drawn once off-screen, sampled on
 * a grid, and printed as ink dots sized by coverage — the same print as the
 * portrait. Dots near the pointer are pushed aside and warm to the accent,
 * then spring home. Fine pointers only; reduced motion prints it still.
 */
export function DotName({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    let W = 0, H = 0, dpr = 1, cell = 6
    let hx = new Float32Array(0), hy = new Float32Array(0), hr = new Float32Array(0)
    let ox = new Float32Array(0), oy = new Float32Array(0), heat = new Float32Array(0)
    let ink = '#121212', accent = '#ff4f12'
    let px = -1e4, py = -1e4, raf = 0

    const colors = () => {
      const s = getComputedStyle(canvas)
      ink = s.getPropertyValue('--lab-ink').trim() || ink
      accent = s.getPropertyValue('--lab-accent').trim() || accent
    }

    const build = () => {
      W = canvas.clientWidth
      if (!W) return
      dpr = Math.min(devicePixelRatio, 2)
      cell = Math.max(4, Math.round(W / 210))
      const family = getComputedStyle(canvas).fontFamily
      // Size the word to the full width.
      const probe = document.createElement('canvas').getContext('2d')!
      probe.font = `900 100px ${family}`
      const m = probe.measureText(text)
      // Fit the ink, not the advance width, edge to edge.
      const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight
      const size = (100 * (W - cell)) / inkW
      H = Math.ceil(((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * size) / 100 + cell)
      canvas.style.height = `${H}px`
      canvas.width = W * dpr
      canvas.height = H * dpr
      const cols = Math.ceil(W / cell)
      const rows = Math.ceil(H / cell)
      const off = document.createElement('canvas')
      off.width = cols
      off.height = rows
      const o = off.getContext('2d', { willReadFrequently: true })!
      o.fillStyle = '#000'
      o.font = `900 ${size / cell}px ${family}`
      o.textBaseline = 'alphabetic'
      o.fillText(text, (m.actualBoundingBoxLeft * size) / 100 / cell + 0.5, (m.actualBoundingBoxAscent * size) / 100 / cell + 0.5)
      const px8 = o.getImageData(0, 0, cols, rows).data
      const xs: number[] = [], ys: number[] = [], rs: number[] = []
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const a = px8[(y * cols + x) * 4 + 3] / 255
          if (a < 0.08) continue
          xs.push(x * cell + cell / 2)
          ys.push(y * cell + cell / 2)
          rs.push(Math.sqrt(a) * cell * 0.5)
        }
      hx = Float32Array.from(xs)
      hy = Float32Array.from(ys)
      hr = Float32Array.from(rs)
      ox = new Float32Array(xs.length)
      oy = new Float32Array(xs.length)
      heat = new Float32Array(xs.length)
      paint()
    }

    const paint = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const cold = new Path2D()
      const warm = new Path2D()
      for (let i = 0; i < hx.length; i++) {
        const x = hx[i] + ox[i], y = hy[i] + oy[i], r = hr[i] * (1 + heat[i] * 0.35)
        const p = heat[i] > 0.35 ? warm : cold
        p.moveTo(x + r, y)
        p.arc(x, y, r, 0, Math.PI * 2)
      }
      ctx.fillStyle = ink
      ctx.fill(cold)
      ctx.fillStyle = accent
      ctx.fill(warm)
    }

    const tick = () => {
      const R = cell * 9
      let moving = false
      for (let i = 0; i < hx.length; i++) {
        const dx = hx[i] - px, dy = hy[i] - py
        const d = Math.hypot(dx, dy)
        let tx = 0, ty = 0, th = 0
        if (d < R) {
          const f = (1 - d / R) ** 2
          tx = (dx / (d || 1)) * f * cell * 2.6
          ty = (dy / (d || 1)) * f * cell * 2.6
          th = f
        }
        ox[i] += (tx - ox[i]) * 0.18
        oy[i] += (ty - oy[i]) * 0.18
        heat[i] += (th - heat[i]) * 0.12
        if (Math.abs(tx - ox[i]) + Math.abs(ty - oy[i]) + Math.abs(th - heat[i]) > 0.02) moving = true
      }
      paint()
      raf = moving ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
      kick()
    }
    const onLeave = () => {
      px = py = -1e4
      kick()
    }

    colors()
    document.fonts.ready.then(build)
    const ro = new ResizeObserver(build)
    ro.observe(canvas)
    const mo = new MutationObserver(() => {
      colors()
      paint()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    if (fine && !still) {
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [text])

  return <canvas ref={ref} className="lab-foot-dots" aria-hidden />
}
