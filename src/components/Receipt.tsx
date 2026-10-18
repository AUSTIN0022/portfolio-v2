'use client'

import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { LINKS } from '@/content/lab'
import { CopyEmail } from './CopyEmail'
import { BARS, renderReceipt, type ReceiptModel } from '@/lib/receiptImage'

const HOLD_MS = 8000 // how long a printed receipt hangs before it's torn off
const TICK_MS = 100

type Phase = 'idle' | 'sending' | 'printing' | 'printed' | 'tearing'

/** What the server said, as printed on the receipt. */
type Result = {
  status: number
  requestId: string
  ms: number
  key: string
  replay: boolean
  error?: string
  name: string
  email: string
  chars: number
  topic: string
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  422: 'Unprocessable',
  429: 'Too Many Requests',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}
const WHY: Record<string, string> = {
  mail_not_configured: 'Mail is not set up on this deployment.',
  too_many_requests: 'Too many requests from this address. Try again in a few minutes.',
  mail_rejected: 'The mail provider refused the message.',
  mail_unreachable: 'The mail provider did not answer in time.',
  network: 'The request never reached the server.',
}
/** One-tap openers: pick one and only a name and email are left to type. */
const PRESETS = [
  { label: 'Just hi', item: 'Hello', text: 'Hi Austin — I came across your portfolio and would love to connect. Do you have a few minutes to chat sometime?' },
  { label: 'A project', item: 'Project discussion', text: 'Hi Austin — I have a project that I think could be a good fit for you, and I’d love to explore working together on it. Can we set up a quick call?' },
  { label: 'Hiring', item: 'Hiring conversation', text: 'Hi Austin — we have an opening that seems to match your profile. Could we find a time to talk about it?' },
] as const

/** The receipt's content, shared by the paper on the page and the saved image. */
function receiptModel(r: Result, stamp: string): ReceiptModel {
  const ok = !r.error
  return {
    stamp,
    ok,
    why: ok ? undefined : `Nothing was sent. ${WHY[r.error!] ?? 'Something went wrong.'} Your message is still in the form — or email me directly.`,
    items: [
      [`1 × ${r.topic}`, `from ${r.name.split(' ')[0]} · ${r.chars} characters`],
      ['1 × Reply to', r.email],
      ['1 × Calm at 3am', 'incl.'],
    ],
    kv: [
      ['Status', `${r.status || 'no response'} ${STATUS_TEXT[r.status] ?? ''}`.trim()],
      ['Request-ID', r.requestId],
      ['Idempotency', short(r.key)],
      ['Latency', `${r.ms} ms`],
      ...(ok ? ([['Delivery', r.replay ? 'replay — not re-sent' : 'sent once'], ['Reply', '24h']] as [string, string][]) : []),
    ],
    total: ok ? 'One conversation' : 'Retry safe',
    thanks: ok ? 'Thank you for your request.' : 'Press the key again to retry.',
  }
}

const short = (k: string) => `${k.slice(0, 8)}…${k.slice(-4)}`

/**
 * Receipt — the contact section as a tiny thermal printer with a real form on
 * it. Pressing the key POSTs /api/contact (with an idempotency key, so a retry
 * can't send twice); the slot then feeds out a receipt of what the server
 * actually answered — request ID, status, latency — in short stepped pulls.
 * It hangs for 8 s (the perforation under the slot fills as it counts down,
 * and the count pauses while the pointer or focus is on the receipt), then
 * it's torn off — a tug, then a fall — and the printer is ready again.
 */
export function Receipt({ head, foot }: { head: React.ReactNode; foot: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [stamp, setStamp] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  // Reused across retries of the same message; replaced once one is delivered.
  const idemKey = useRef('')
  const uid = useId()
  const formId = `${uid}-form`
  const [vals, setVals] = useState({ name: '', email: '', message: '' })
  const [preset, setPreset] = useState<number | null>(null)
  // The conversation type sticks to the message even if the text is edited afterwards.
  const [topic, setTopic] = useState('Message')
  const [shot, setShot] = useState<{ url: string; name: string; alt: string } | null>(null)
  const dlg = useRef<HTMLDialogElement>(null)
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

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (phase !== 'idle') return
    const form = e.currentTarget
    const fields = { ...vals, website: String(new FormData(form).get('website') ?? '') }
    idemKey.current ||= crypto.randomUUID()
    const key = idemKey.current
    setPhase('sending')
    const t = performance.now()
    let out: Result
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': key },
        body: JSON.stringify({ ...fields, topic }),
      })
      const body = (await res.json().catch(() => ({}))) as { requestId?: string; error?: string; replay?: boolean }
      out = {
        status: res.status,
        requestId: body.requestId ?? res.headers.get('x-request-id') ?? '—',
        ms: Math.round(performance.now() - t),
        key,
        replay: !!body.replay,
        error: res.ok ? undefined : (body.error ?? 'error'),
        name: fields.name,
        email: fields.email,
        chars: fields.message.length,
        topic,
      }
    } catch {
      out = { status: 0, requestId: '—', ms: Math.round(performance.now() - t), key, replay: false, error: 'network', name: fields.name, email: fields.email, chars: fields.message.length, topic }
    }
    if (!out.error) {
      setVals({ name: '', email: '', message: '' })
      setPreset(null)
      setTopic('Message')
      idemKey.current = '' // delivered: the next message is a new request
    }
    setResult(out)
    setPhase('printing')
  }

  const out = phase !== 'idle' && phase !== 'sending'
  const doc = result ? receiptModel(result, stamp) : null

  const openShot = async () => {
    if (!result || !doc || !paperRef.current) return
    await document.fonts.ready
    const url = renderReceipt(doc, getComputedStyle(paperRef.current).fontFamily)
    setShot({ url, name: `austin-makasare-receipt-${result.requestId}.png`, alt: `${result.topic} request, ${doc.kv[0][1]}` })
  }
  useEffect(() => {
    if (shot && !dlg.current?.open) dlg.current?.showModal()
  }, [shot])

  const idle = phase === 'idle'
  const set = (k: keyof typeof vals) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVals((v) => ({ ...v, [k]: e.target.value }))
    if (k === 'message') setPreset(null)
  }

  return (
    <>
      <div className="contact-copy">
        {head}
        <form id={formId} className="cf" onSubmit={send}>
          <div className="cf-presets" role="group" aria-label="Start from a message">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                className="cf-chip"
                aria-pressed={preset === i}
                disabled={!idle}
                onClick={() => {
                  setPreset(i)
                  setTopic(p.item)
                  setVals((v) => ({ ...v, message: p.text }))
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="cf-row">
            <label>
              <span>Name</span>
              <input name="name" value={vals.name} onChange={set('name')} required maxLength={80} autoComplete="name" disabled={!idle} />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" value={vals.email} onChange={set('email')} required maxLength={120} autoComplete="email" disabled={!idle} />
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea name="message" value={vals.message} onChange={set('message')} required minLength={10} maxLength={2000} rows={2} disabled={!idle} />
          </label>
          {/* Bot trap: off-screen, skipped by keyboard and assistive tech. */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="cf-trap" />
          <p className="cf-hint">
            Then press the key on the printer <span aria-hidden>→</span>
          </p>
        </form>
        {foot}
      </div>

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
            <span className="rc-led" data-on={!idle ? '' : undefined} />
            <span className="rc-model">AM-200 · thermal</span>
          </div>
          <button type="submit" form={formId} className="rc-key" disabled={!idle} aria-label="Send request — prints a receipt">
            <span className="rc-key-face">
              {phase === 'idle' ? 'Send request' : phase === 'sending' ? 'Sending…' : phase === 'printing' ? 'Printing…' : result ? `${result.status || 'ERR'} ${STATUS_TEXT[result.status] ?? ''}`.trim() : ''}
            </span>
          </button>
          <div className="rc-slot" />
          <div className="rc-perf" aria-hidden />
        </div>

      <div className="rc-feed" data-open={out ? '' : undefined} aria-live="polite">
        {out && doc && (
          <div
            ref={paperRef}
            className="rc-paper"
            role="button"
            tabIndex={0}
            aria-label="Open this receipt as an image you can save"
            onClick={(e) => !(e.target as Element).closest('a, button') && openShot()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), openShot())}
          >
            <p className="rc-center rc-brand">AUSTIN MAKASARE</p>
            <p className="rc-center rc-dim">Backend-focused full-stack engineer</p>
            <p className="rc-center rc-dim">{doc.stamp}</p>
            <hr />
            <p className="rc-mono">POST /api/contact HTTP/1.1</p>
            <hr />
            {doc.why ? (
              <p className="rc-why">{doc.why}</p>
            ) : (
              <dl className="rc-items">
                {doc.items.map(([dt, dd]) => (
                  <Fragment key={dt}>
                    <dt>{dt}</dt>
                    <dd>{dd}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
            <hr />
            <dl className="rc-kv" data-ok={doc.ok ? '' : undefined}>
              {doc.kv.map(([k, v]) => (
                <Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </Fragment>
              ))}
            </dl>
            <hr />
            <p className="rc-total">
              <span>Total</span>
              <span>{doc.total}</span>
            </p>
            <div className="rc-bars" aria-hidden>
              {BARS.map(([w, g], i) => (
                <i key={i} style={{ width: w, marginRight: g }} />
              ))}
            </div>
            <div className="rc-actions">
              <CopyEmail label="Email" className="copy-email--pill" />
              <a href={LINKS.cal} target="_blank" rel="noopener noreferrer">
                Book a call →
              </a>
            </div>
            <p className="rc-center rc-dim">{doc.thanks}</p>
            <p className="rc-center rc-dim rc-hint">Click the receipt to save it as an image</p>
          </div>
        )}
      </div>
    </div>

      <dialog
        ref={dlg}
        className="rc-modal"
        aria-label="Receipt"
        data-lenis-prevent
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}
        onClose={() => setShot(null)}
      >
        {shot && (
          <div className="rc-modal-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.url} alt={shot.alt} />
            <div className="rc-modal-actions">
              <a className="rc-modal-dl" href={shot.url} download={shot.name}>
                Download PNG
              </a>
              <button type="button" onClick={() => dlg.current?.close()}>
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
