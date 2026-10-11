'use client'

import { useEffect, useRef } from 'react'

/**
 * VoxelCard — the voxel portrait as a small printed card that leans toward
 * the pointer on a spring, with a glare that slides across the print.
 * Coarse pointers and reduced motion get the card, flat.
 *
 * The print itself is a halftone — the photo re-drawn as ink dots sized by
 * darkness, so it belongs with the site's line art; hovering lifts the
 * screen to show the photograph underneath.
 */
export function VoxelCard() {
  const ref = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current!
    const canvas = canvasRef.current!
    const draw = () => {
      const w = img.clientWidth
      const h = img.clientHeight
      if (!w || !h || !img.naturalWidth) return
      const dpr = Math.min(devicePixelRatio, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      // Same crop as the <img>: object-fit cover at 50% 28%.
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const sw = w / scale
      const sh = h / scale
      const sx = (img.naturalWidth - sw) * 0.5
      const sy = (img.naturalHeight - sh) * 0.28
      const cell = 5
      const cols = Math.ceil(w / cell)
      const rows = Math.ceil(h / cell)
      const sample = document.createElement('canvas')
      sample.width = cols
      sample.height = rows
      const sctx = sample.getContext('2d', { willReadFrequently: true })!
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
      const px = sctx.getImageData(0, 0, cols, rows).data
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#fbfaf6'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#121212'
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
          // A touch of contrast so the face reads, then dot area ∝ darkness.
          const ink = Math.min(1, Math.max(0, (1 - lum - 0.12) * 1.35))
          const r = Math.sqrt(ink) * cell * 0.62
          if (r < 0.35) continue
          ctx.beginPath()
          ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    if (img.complete) draw()
    img.addEventListener('load', draw)
    const ro = new ResizeObserver(draw)
    ro.observe(img)
    return () => {
      img.removeEventListener('load', draw)
      ro.disconnect()
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
      <div ref={ref} className="voxel-card" onClick={(e) => e.currentTarget.toggleAttribute('data-dev')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src="/voxel.jpg" alt="Austin Makasare, rebuilt as a voxel portrait" loading="lazy" />
        <canvas ref={canvasRef} className="voxel-halftone" aria-hidden />
        <span className="voxel-glare" aria-hidden />
      </div>
      <figcaption>Fig. 5 — The author, in voxels and halftone. Hover or tap to develop the print.</figcaption>
    </figure>
  )
}
