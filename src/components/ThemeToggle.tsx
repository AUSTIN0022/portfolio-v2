'use client'

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { LuMoon, LuSun } from 'react-icons/lu'

const COLORS = { light: '#f1efe9', dark: '#121211' }

/** Sets the theme on <html>, remembers it, and tints the browser chrome to match. */
function apply(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[theme]))
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Private mode / blocked storage: the choice just lasts for this visit.
  }
}

/**
 * Light / dark switch. The first paint is handled by the inline script in
 * layout.tsx (saved choice, else the system setting); this flips it, as a
 * circle that grows from the button using the View Transitions API. Browsers
 * without it, or with reduced motion, just switch.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark')
  }, [])

  const toggle = async (origin?: { x: number; y: number }) => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    const commit = () => {
      apply(next)
      setDark(next === 'dark')
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || !document.startViewTransition) return commit()

    const x = origin?.x ?? innerWidth / 2
    const y = origin?.y ?? innerHeight / 2
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const root = document.documentElement
    root.setAttribute('data-theme-switching', '')
    const t = document.startViewTransition(() => flushSync(commit))
    try {
      await t.ready
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    } catch {
      // Transition skipped (e.g. the tab was hidden); the theme is already applied.
    }
    await t.finished.catch(() => {})
    root.removeAttribute('data-theme-switching')
  }

  useEffect(() => {
    const onToggle = () => toggle()
    window.addEventListener('theme:toggle', onToggle)
    return () => window.removeEventListener('theme:toggle', onToggle)
  })

  return (
    <button
      type="button"
      className="lab-k lab-theme"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect()
        toggle({ x: b.left + b.width / 2, y: b.top + b.height / 2 })
      }}
    >
      {dark ? <LuSun aria-hidden /> : <LuMoon aria-hidden />}
    </button>
  )
}
