'use client'

import { useEffect, useId, useRef } from 'react'

/**
 * LiquidText — text that pours into shape the first time it is seen.
 *
 * Each glyph starts as a heavy blur; the parent runs an alpha-threshold
 * filter, so overlapping blurs fuse into one liquid blob that tightens,
 * splits and settles into crisp letters. Once settled the filter is dropped
 * so the type renders with normal antialiasing again.
 *
 * `trigger="load"` plays on mount (hero); `"view"` plays on first scroll
 * into view. Reduced motion: renders the text as-is.
 */
export function LiquidText({
  text,
  as: Tag = 'span',
  trigger = 'view',
  delay = 0,
  stagger = 45,
  duration = 1300,
  className,
  style,
}: {
  text: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  trigger?: 'load' | 'view'
  delay?: number
  stagger?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)
  const filterId = `liquid-${useId().replace(/:/g, '')}`

  useEffect(() => {
    const el = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.dataset.state = 'done'
      return
    }
    const chars = Array.from(el.querySelectorAll<HTMLElement>('[data-ch]'))
    const blur = parseFloat(getComputedStyle(el).fontSize) * 0.22
    let anims: Animation[] = []

    const play = () => {
      el.dataset.state = 'pouring'
      anims = chars.map((c, i) =>
        c.animate(
          [
            { filter: `blur(${blur}px)`, opacity: 0, transform: 'translateY(0.18em) scaleY(1.25)' },
            { filter: `blur(${blur * 0.45}px)`, opacity: 1, offset: 0.55 },
            { filter: 'blur(0px)', opacity: 1, transform: 'none' },
          ],
          {
            duration,
            delay: delay + i * stagger,
            easing: 'cubic-bezier(.22,.8,.24,1)',
            fill: 'both',
          },
        ),
      )
      Promise.all(anims.map((a) => a.finished))
        .then(() => (el.dataset.state = 'done'))
        .catch(() => {})
    }

    if (trigger === 'load') {
      play()
      return () => anims.forEach((a) => a.cancel())
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        play()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      anims.forEach((a) => a.cancel())
    }
  }, [trigger, delay, stagger, duration])

  const words = text.split(' ')
  return (
    <Tag
      ref={ref as never}
      className={`liquid-text ${className ?? ''}`}
      style={{ ...style, ['--liquid-filter' as string]: `url(#${filterId})` }}
      aria-label={text}
      data-state="idle"
    >
      <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
        <filter id={filterId} x="-20%" y="-50%" width="140%" height="200%">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
          />
        </filter>
      </svg>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden className="liquid-word">
          {Array.from(w).map((ch, ci) => (
            <span key={ci} data-ch className="liquid-ch">
              {ch}
            </span>
          ))}
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}
