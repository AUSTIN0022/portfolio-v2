'use client'

import { useEffect, useRef } from 'react'

/**
 * VoxelCard — the voxel portrait as a small printed card that leans toward
 * the pointer on a spring, with a glare that slides across the print.
 * Coarse pointers and reduced motion get the card, flat.
 *
 * The print itself is a halftone — the photo re-drawn as ink dots sized by
 * darkness, so it belongs with the site's line art. Hovering dissolves the
 * dots from the cursor outward, cell by cell, to the photograph underneath;
 * leaving re-forms them from the edges in. Touch toggles it on tap.
 */
export function VoxelCard() {
  const ref = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current!
    const canvas = canvasRef.current!
    const card = ref.current!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    const CELL = 5
    let w = 0, h = 0, cols = 0, rows = 0, dpr = 1
    let rad = new Float32Array(0) // each dot's ink radius
    let p = new Float32Array(0) // 0 = ink dot, 1 = dissolved to photo
    let a = new Uint8Array(0) // where each cell is heading
    let pace = new Float32Array(0)
    let mode = 0 // 1 while developed
    let raf = 0

    const build = () => {
      w = img.clientWidth
      h = img.clientHeight
      if (!w || !h || !img.naturalWidth) return
      dpr = Math.min(devicePixelRatio, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      // Same crop as the <img>: object-fit cover at 50% 28%.
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const sw = w / scale
      const sh = h / scale
      const sx = (img.naturalWidth - sw) * 0.5
      const sy = (img.naturalHeight - sh) * 0.28
      cols = Math.ceil(w / CELL)
      rows = Math.ceil(h / CELL)
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
      const px = sctx.getImageData(0, 0, cols, rows).data
      const n = cols * rows
      rad = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const lum = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255
        // A touch of contrast so the face reads, then dot area ∝ darkness.
        const ink = Math.min(1, Math.max(0, (1 - lum - 0.12) * 1.35))
        rad[i] = Math.sqrt(ink) * CELL * 0.62
      }
      p = new Float32Array(n).fill(mode)
      a = new Uint8Array(n).fill(mode)
      pace = Float32Array.from({ length: n }, () => 0.1 + Math.random() * 0.1)
      paint()
    }

    const paint = () => {
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#fbfaf6'
      for (let i = 0; i < p.length; i++) {
        if (p[i] > 0.99) continue
        ctx.globalAlpha = 1 - p[i]
        ctx.fillRect((i % cols) * CELL, Math.floor(i / cols) * CELL, CELL, CELL)
      }
      ctx.globalAlpha = 1
      const ink = new Path2D()
      const glint = new Path2D()
      for (let i = 0; i < p.length; i++) {
        const q = p[i]
        const band = Math.sin(q * Math.PI) // 0 at rest, 1 mid-transition
        const r = rad[i] * (1 - q)
        if (r < 0.3 && band < 0.05) continue
        // Mid-transition dots shiver off their grid point, like nanites in flight.
        const cx = (i % cols) * CELL + CELL / 2 + (Math.random() - 0.5) * CELL * 1.8 * band
        const cy = Math.floor(i / cols) * CELL + CELL / 2 + (Math.random() - 0.5) * CELL * 1.8 * band
        if (band > 0.55) {
          glint.moveTo(cx + 1.1, cy)
          glint.arc(cx, cy, 1.1, 0, Math.PI * 2)
        } else if (r >= 0.3) {
          ink.moveTo(cx + r, cy)
          ink.arc(cx, cy, r, 0, Math.PI * 2)
        }
      }
      ctx.fillStyle = '#121212'
      ctx.fill(ink)
      ctx.fillStyle = '#f2490f'
      ctx.fill(glint)
    }

    // Each frame, settled cells pass the change to a random neighbour, so it
    // crawls outward from wherever it started until the whole print has turned.
    const tick = () => {
      const next = a.slice()
      let pending = false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== mode) {
          pending = true
          continue
        }
        if (Math.abs(p[i] - mode) > 0.7) continue
        const x = i % cols
        if (x > 0 && a[i - 1] !== mode && Math.random() < 0.55) next[i - 1] = mode
        if (x < cols - 1 && a[i + 1] !== mode && Math.random() < 0.55) next[i + 1] = mode
        if (i >= cols && a[i - cols] !== mode && Math.random() < 0.55) next[i - cols] = mode
        if (i + cols < a.length && a[i + cols] !== mode && Math.random() < 0.55) next[i + cols] = mode
      }
      a = next
      let moving = false
      for (let i = 0; i < p.length; i++) {
        const d = a[i] - p[i]
        if (Math.abs(d) < 0.01) p[i] = a[i]
        else {
          p[i] += d * pace[i]
          moving = true
        }
      }
      paint()
      raf = pending || moving ? requestAnimationFrame(tick) : 0
    }

    const seed = (cx: number, cy: number, radius: number) => {
      const x0 = Math.floor(cx / CELL), y0 = Math.floor(cy / CELL), k = Math.ceil(radius / CELL)
      for (let y = Math.max(0, y0 - k); y <= Math.min(rows - 1, y0 + k); y++)
        for (let x = Math.max(0, x0 - k); x <= Math.min(cols - 1, x0 + k); x++)
          if ((x - x0) ** 2 + (y - y0) ** 2 <= k * k) a[y * cols + x] = mode
    }
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h] as const
    }
    const go = (m: number, e: PointerEvent | null) => {
      mode = m
      if (still) {
        p.fill(m)
        a.fill(m)
        return paint()
      }
      if (e) seed(...local(e), 14)
      else
        // Re-forming starts at the edges and closes in.
        for (let i = 0; i < a.length; i++) {
          const x = i % cols
          if (x === 0 || x === cols - 1 || i < cols || i >= a.length - cols) a[i] = m
        }
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onEnter = (e: PointerEvent) => fine && go(1, e)
    const onMove = (e: PointerEvent) => {
      if (!fine || mode !== 1 || still) return
      seed(...local(e), 14) // the cursor drags the change along with it
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onLeave = () => fine && go(0, null)
    const onClick = (e: MouseEvent) => !fine && go(mode ? 0 : 1, e as PointerEvent)

    if (img.complete) build()
    img.addEventListener('load', build)
    const ro = new ResizeObserver(build)
    ro.observe(img)
    card.addEventListener('pointerenter', onEnter)
    card.addEventListener('pointermove', onMove)
    card.addEventListener('pointerleave', onLeave)
    card.addEventListener('click', onClick)
    return () => {
      cancelAnimationFrame(raf)
      img.removeEventListener('load', build)
      ro.disconnect()
      card.removeEventListener('pointerenter', onEnter)
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
      card.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    const el = ref.current!
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0
    const loop = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`)
      el.style.setProperty('--gx', `${50 + x * 40}%`)
      el.style.setProperty('--gy', `${50 + y * 40}%`)
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(loop) : 0
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onLeave = () => {
      tx = ty = 0
      if (!raf) raf = requestAnimationFrame(loop)
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
    <figure className="voxel">
      <div ref={ref} className="voxel-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src="/voxel.jpg" alt="Austin Makasare, rebuilt as a voxel portrait" loading="lazy" />
        <canvas ref={canvasRef} className="voxel-halftone" aria-hidden />
        <span className="voxel-glare" aria-hidden />
      </div>
      <figcaption>Fig. 5 — The author, in voxels and halftone. Hover or tap to develop the print.</figcaption>
    </figure>
  )
}
