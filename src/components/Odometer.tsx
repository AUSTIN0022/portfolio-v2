'use client'

import { useEffect, useRef } from 'react'

const STRIP = '01234567890123456789'

/**
 * Odometer — a number that rolls into place, departures-board style, the
 * first time it scrolls into view. Each digit is a strip of 0–9 twice, so
 * every column (even a 0) spins at least one full turn before it lands.
 * Non-digits (",", "+", "%", "×") sit still. Screen readers get the value.
 */
export function Odometer({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current!
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        el.dataset.in = ''
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  let digit = 0
  return (
    <span ref={ref} className={`odo ${className ?? ''}`}>
      <span className="sr-only">{value}</span>
      {Array.from(value).map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="odo-col" aria-hidden style={{ ['--to' as string]: Number(ch) + 10, ['--i' as string]: digit++ }}>
            <span className="odo-strip">
              {Array.from(STRIP).map((d, j) => (
                <span key={j}>{d}</span>
              ))}
            </span>
            {/* Sizes the column to the final glyph's width. */}
            <span className="odo-ghost">{ch}</span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
