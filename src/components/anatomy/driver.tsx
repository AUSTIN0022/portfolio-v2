'use client'

import { useEffect, useRef, useState } from 'react'
import { onSound, setSound, soundOn } from './sound'

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export interface Driver {
  /** Animate to `to` over `seconds`, then call `then`. Scrolling hands control back to the scroll. */
  play: (to: number, seconds: number, then?: () => void) => void
  /** Jump to u without easing. */
  set: (u: number) => void
  /** Where the figure is now. */
  at: () => number
  /** Run 0 → 1 on repeat (used on hover). */
  loop: (seconds: number) => void
  stop: () => void
}

/**
 * One source of truth for a figure's position u in [0, 1]: the scroll of
 * `track` (eased), or a short animation started by a button, a key or a
 * hover. `draw(u, prev)` is called each frame u changes.
 */
export function useDriver(track: React.RefObject<HTMLElement | null> | undefined, draw: (u: number, prev: number) => void, initial = 0): React.RefObject<Driver> {
  const latest = useRef(draw)
  latest.current = draw
  const state = useRef({ u: initial, raf: 0, mode: 'scroll' as 'scroll' | 'play', playY: 0 })
  const api = useRef<Driver>(null!)

  const paint = (u: number) => {
    const prev = state.current.u
    state.current.u = u
    if (u !== prev) latest.current(u, prev)
  }

  if (!api.current) {
    api.current = {
      at: () => state.current.u,
      set: (u) => {
        cancelAnimationFrame(state.current.raf)
        state.current.mode = 'play'
        state.current.playY = window.scrollY
        paint(clamp(u))
      },
      stop: () => {
        cancelAnimationFrame(state.current.raf)
        state.current.raf = 0
      },
      play: (to, seconds, then) => {
        cancelAnimationFrame(state.current.raf)
        state.current.mode = 'play'
        state.current.playY = window.scrollY
        const from = state.current.u
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const start = performance.now()
        const step = (now: number) => {
          const t = still ? 1 : Math.min(1, (now - start) / 1000 / Math.max(0.05, seconds))
          paint(from + (to - from) * ease(t))
          if (t < 1) state.current.raf = requestAnimationFrame(step)
          else {
            state.current.raf = 0
            then?.()
          }
        }
        state.current.raf = requestAnimationFrame(step)
      },
      loop: (seconds) => {
        const run = () => {
          paint(0)
          api.current.play(1, seconds, run)
        }
        run()
      },
    }
  }

  // Scroll control.
  useEffect(() => {
    const host = track?.current
    if (!host) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let target = 0
    let visible = false
    const measure = () => {
      const r = host.getBoundingClientRect()
      target = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
    }
    const loop = () => {
      const s = state.current
      if (s.mode !== 'scroll') return
      let u = s.u + (target - s.u) * (still ? 1 : 0.14)
      if (Math.abs(target - u) < 0.0004) u = target
      paint(u)
      s.raf = u !== target && visible ? requestAnimationFrame(loop) : 0
    }
    const onScroll = () => {
      measure()
      const s = state.current
      // A button's run keeps control until the visitor really scrolls away.
      if (s.mode === 'play' && Math.abs(window.scrollY - s.playY) < 120) return
      if (s.mode === 'play') {
        cancelAnimationFrame(s.raf)
        s.raf = 0
        s.mode = 'scroll'
      }
      if (!s.raf && visible) s.raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && state.current.mode === 'scroll') onScroll()
    }, { rootMargin: '120px 0px' })
    io.observe(host)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    measure()
    paint(target)
    return () => {
      cancelAnimationFrame(state.current.raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [track])

  useEffect(() => () => cancelAnimationFrame(state.current.raf), [])
  return api
}

/** Run the machine on repeat while the pointer is over `host`'s card, and settle back to `still` after. */
export function useHoverLoop(root: React.RefObject<HTMLElement | null>, driver: React.RefObject<Driver>, still: number, seconds: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const card = root.current?.closest('.work-card') ?? root.current
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const enter = () => driver.current.loop(seconds)
    const leave = () => driver.current.play(still, 0.6)
    card.addEventListener('pointerenter', enter)
    card.addEventListener('pointerleave', leave)
    return () => {
      card.removeEventListener('pointerenter', enter)
      card.removeEventListener('pointerleave', leave)
    }
  }, [root, driver, still, seconds, enabled])
}

export interface Action {
  label: string
  run: () => void
  disabled?: boolean
  pressed?: boolean
}

/** The buttons for a figure: click to run; plus the sound switch. */
export function Controls({ actions }: { actions: Action[] }) {
  const [sound, setLocal] = useState(false)
  useEffect(() => {
    setLocal(soundOn())
    return onSound(setLocal)
  }, [])
  return (
    <div className="bench-controls" role="toolbar" aria-label="Figure controls">
      {actions.map((a) => (
        <button key={a.label} type="button" onClick={a.run} disabled={a.disabled} aria-pressed={a.pressed}>
          {a.label}
        </button>
      ))}
      <button type="button" className="bench-sound" aria-pressed={sound} onClick={() => setSound(!sound)}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>
    </div>
  )
}
