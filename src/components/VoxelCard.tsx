'use client'

import { useEffect, useRef } from 'react'

/**
 * VoxelCard — the voxel portrait as a small printed card that leans toward
 * the pointer on a spring, with a glare that slides across the print.
 * Coarse pointers and reduced motion get the card, flat.
 */
export function VoxelCard() {
  const ref = useRef<HTMLDivElement>(null)

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
        <img src="/voxel.jpg" alt="Austin Makasare, rebuilt as a voxel portrait" loading="lazy" />
        <span className="voxel-glare" aria-hidden />
      </div>
      <figcaption>Fig. 5 — The author, rebuilt in voxels.</figcaption>
    </figure>
  )
}
