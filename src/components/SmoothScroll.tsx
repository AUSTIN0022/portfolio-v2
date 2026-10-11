'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Inertia scrolling (Lenis) — the same feel the pages had inside v1, where
 * v1's MotionLayer provided it. Anchor links (#work, #contact) glide too.
 * Off under reduced motion; touch keeps native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.1, anchors: true, autoRaf: true })
    return () => lenis.destroy()
  }, [])
  return null
}
