'use client'

import { useEffect, useRef, useState } from 'react'
import { LINKS } from '@/content/lab'
import { CopyEmail } from './CopyEmail'

// Deterministic "barcode": bar widths from a fixed string, so SSR and client agree.
const BARS = Array.from('AUSTIN-MAKASARE-200-OK-POST-HIRE').map((c) => 1 + (c.charCodeAt(0) % 4))
const HOLD_MS = 8000 // how long a printed receipt hangs before it's torn off
const TICK_MS = 100

type Phase = 'idle' | 'printing' | 'printed' | 'tearing'

/**
 * Receipt — the contact section as a tiny thermal printer. Pressing the key
 * "sends" POST /hire; the slot feeds out a receipt in short stepped pulls.
 * It hangs for 8 s (the perforation under the slot fills as it counts down,
 * and the count pauses while the pointer or focus is on the receipt), then
 * it's torn off — a tug, then a fall — and the printer is ready again.
 */
export function Receipt() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [stamp, setStamp] = useState('')
  const paperRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const held = useRef(false)

  // Print.
  useEffect(() => {
    if (phase !== 'printing') return
    const d = new Date()
    setStamp(
      `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    )
    const el = paperRef.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('printed')
      return
    }
    // Stepped feed: advance, pause, advance — with a hair of lateral jitter.
    const steps = 14
    const frames: Keyframe[] = []
    for (let i = 0; i <= steps; i++) {
      const x = i === steps ? 0 : i % 2 ? 0.6 : -0.4
      frames.push({ transform: `translate(${x}px, ${-100 + (100 * i) / steps}%)`, offset: i / steps })
    }
    const a = el.animate(frames, { duration: 2200, easing: 'steps(28, end)', fill: 'both' })
    a.finished.then(() => setPhase('printed')).catch(() => {})
    return () => a.cancel()
  }, [phase])

  // Hang, counting down while nobody is holding it.
  useEffect(() => {
    if (phase !== 'printed') return
    const root = rootRef.current!
    let left = HOLD_MS
    root.style.setProperty('--hold', '0')
    const id = setInterval(() => {
      if (held.current) return
      left -= TICK_MS
      root.style.setProperty('--hold', String(1 - left / HOLD_MS))
      if (left <= 0) {
        clearInterval(id)
        setPhase('tearing')
      }
    }, TICK_MS)
    return () => clearInterval(id)
  }, [phase])

  // Tear off: a short tug up, then it drops away.
  useEffect(() => {
    if (phase !== 'tearing') return
    const el = paperRef.current!
    rootRef.current!.style.setProperty('--hold', '0')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const a = el.animate(
      reduce
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1, offset: 0 },
            { transform: 'translate(-2px, -10px) rotate(-1.5deg)', opacity: 1, offset: 0.14 },
            { transform: 'translate(4px, -4px) rotate(2deg)', opacity: 1, offset: 0.24, easing: 'cubic-bezier(.5,0,.9,.4)' },
            { transform: 'translate(70px, 110vh) rotate(24deg)', opacity: 0, offset: 1 },
          ],
      { duration: reduce ? 250 : 1250, fill: 'both' },
    )
    a.finished.then(() => setPhase('idle')).catch(() => {})
    return () => a.cancel()
  }, [phase])

  const out = phase !== 'idle'

  return (
    <div
      ref={rootRef}
      className="rc"
      onPointerEnter={() => (held.current = true)}
      onPointerLeave={() => (held.current = false)}
      onFocus={() => (held.current = true)}
      onBlur={() => (held.current = false)}
    >
      <div className="rc-printer">
        <div className="rc-head">
          <span className="rc-led" data-on={out ? '' : undefined} />
          <span className="rc-model">AM-200 · thermal</span>
        </div>
        <button
          type="button"
          className="rc-key"
          onClick={() => setPhase('printing')}
          disabled={out}
          aria-label="Send a request and print the receipt"
        >
          <span className="rc-key-face">
            {phase === 'idle' ? 'Send request' : phase === 'printing' ? 'Printing…' : '200 OK'}
          </span>
        </button>
        <div className="rc-slot" />
        <div className="rc-perf" aria-hidden />
      </div>

      <div className="rc-feed" data-open={out ? '' : undefined} aria-live="polite">
        {out && (
          <div ref={paperRef} className="rc-paper">
            <p className="rc-center rc-brand">AUSTIN MAKASARE</p>
            <p className="rc-center rc-dim">Backend-focused full-stack engineer</p>
            <p className="rc-center rc-dim">{stamp}</p>
            <hr />
            <p className="rc-mono">POST /hire HTTP/1.1</p>
            <hr />
            <dl className="rc-items">
              <dt>1 × Backend systems</dt>
              <dd>queues · locks · infra</dd>
              <dt>1 × Full-stack delivery</dt>
              <dd>idea → production</dd>
              <dt>1 × Calm at 3am</dt>
              <dd>incl.</dd>
            </dl>
            <hr />
            <dl className="rc-kv">
              <dt>Status</dt>
              <dd>200 OK</dd>
              <dt>Location</dt>
              <dd>India · Remote</dd>
              <dt>Reply within</dt>
              <dd>24h</dd>
            </dl>
            <hr />
            <p className="rc-total">
              <span>Total</span>
              <span>One conversation</span>
            </p>
            <div className="rc-bars" aria-hidden>
              {BARS.map((w, i) => (
                <i key={i} style={{ width: w, marginRight: (BARS[(i + 3) % BARS.length] % 3) + 1 }} />
              ))}
            </div>
            <div className="rc-actions">
              <CopyEmail label="Email" className="copy-email--pill" />
              <a href={LINKS.cal} target="_blank" rel="noopener noreferrer">
                Book a call →
              </a>
            </div>
            <p className="rc-center rc-dim">Thank you for your request.</p>
          </div>
        )}
      </div>
    </div>
  )
}
