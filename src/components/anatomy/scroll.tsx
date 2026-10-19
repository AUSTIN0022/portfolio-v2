'use client'

import { useEffect, useRef, useState } from 'react'

const clamp = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Drives `draw(u)` from how far `track` has been scrolled through (0 at its
 * top, 1 at its bottom), eased so a fast scroll still reads as motion. Runs
 * only while the track is on screen; reduced motion draws without easing.
 */
export function useScrub(track: React.RefObject<HTMLElement | null> | undefined, draw: (u: number) => void) {
  const latest = useRef(draw)
  latest.current = draw
  useEffect(() => {
    const host = track?.current
    if (!host) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let target = 0
    let shown = 0
    let raf = 0
    let visible = false
    const measure = () => {
      const r = host.getBoundingClientRect()
      target = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
    }
    const loop = () => {
      shown += (target - shown) * (still ? 1 : 0.14)
      if (Math.abs(target - shown) < 0.0004) shown = target
      latest.current(shown)
      raf = shown !== target && visible ? requestAnimationFrame(loop) : 0
    }
    const kick = () => {
      measure()
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick()
    }, { rootMargin: '120px 0px' })
    io.observe(host)
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    measure()
    shown = target
    latest.current(shown)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
    }
  }, [track])
}

/** Writes `text` into the card's readout slot without a re-render. */
export function sayIn(root: HTMLElement | null, text: string) {
  const slot = root?.querySelector('[data-readout]')
  if (slot && slot.textContent !== text) slot.textContent = text
}

type Step = { readonly key: string; readonly title: string; readonly text: string }

/**
 * A scroll-driven Anatomy section: a tall track; the figure sticks while the
 * steps beside it light up in turn.
 */
export function AnatomySection({
  kicker,
  title,
  label,
  steps,
  figure,
}: {
  kicker: string
  title: string
  label: string
  steps: readonly Step[]
  figure: (track: React.RefObject<HTMLDivElement | null>, onStep: (i: number) => void) => React.ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  return (
    <section className="lab-section gate-section" aria-label={label}>
      <header className="lab-sechead">
        <span className="lab-kicker">{kicker}</span>
        <h2 className="lab-h2">{title}</h2>
      </header>
      <div ref={track} className="gate-track">
        <div className="gate-stick">
          <ol className="gate-steps">
            {steps.map((s, i) => (
              <li key={s.key} data-active={active === i ? '' : undefined} data-past={i < active ? '' : undefined}>
                <span className="gate-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          {figure(track, setActive)}
        </div>
      </div>
    </section>
  )
}
