'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * ReviewReplay — one PR Sentinel review, replayed: the pull request's diff on
 * the left, the pipeline's trace on the right. As agents report, their line
 * comments land on the diff; the reflection agent then drops the one that
 * isn't a real defect. An illustrative run of the real pipeline (webhook →
 * PR understanding → planner → two waves → reflection → writer), not a log.
 */

type Line = { n?: number; kind: ' ' | '+' | '-' | '@'; code: string }
type Note = { line: number; sev: 'high' | 'medium' | 'nit'; text: string }
type Step = { wait: number; agent: string; text: string; note?: Note; drop?: number; done?: boolean }

const FILE = 'src/webhooks/github.ts'
const DIFF: Line[] = [
  { kind: '@', code: '@@ -9,8 +9,13 @@ export async function onPullRequest(req, res) {' },
  { n: 10, kind: ' ', code: "  const sig = req.header('x-hub-signature-256')" },
  { n: 11, kind: '+', code: "  const expected = 'sha256=' + sign(req.rawBody)" },
  { n: 12, kind: '+', code: '  if (sig !== expected) return res.sendStatus(401)' },
  { n: 13, kind: '+', code: '' },
  { n: 14, kind: '+', code: "  const id = req.header('x-github-delivery')" },
  { n: 15, kind: '+', code: '  if (await seen(id)) return res.sendStatus(200)' },
  { kind: '-', code: "  await reviewQueue.add('review', req.body)" },
  { n: 16, kind: '+', code: "  reviewQueue.add('review', req.body, { jobId: id })" },
  { n: 17, kind: ' ', code: '  res.sendStatus(202)' },
  { n: 18, kind: ' ', code: '}' },
]

const STEPS: Step[] = [
  { wait: 400, agent: 'webhook', text: 'pull_request.opened #42 · HMAC verified · queued' },
  { wait: 900, agent: 'understanding', text: 'intent: verify + dedupe deliveries · risk: high (auth path)' },
  { wait: 900, agent: 'planner', text: 'wave 1 → security, architecture, reliability · wave 2 → testing, quality' },
  { wait: 900, agent: 'security', text: `get_file_contents(${FILE}) · cache hit @ 9f2c1e4` },
  {
    wait: 1100,
    agent: 'security',
    text: 'finding L12 · high',
    note: { line: 12, sev: 'high', text: 'Signature compared with !== — timing-unsafe. Use crypto.timingSafeEqual on equal-length buffers.' },
  },
  { wait: 900, agent: 'reliability', text: 'get_diff(#42) · cache hit @ 9f2c1e4' },
  {
    wait: 1100,
    agent: 'reliability',
    text: 'finding L16 · medium',
    note: { line: 16, sev: 'medium', text: 'add() is no longer awaited — a Redis error is swallowed and the 202 still goes out.' },
  },
  {
    wait: 1000,
    agent: 'quality',
    text: 'finding L14 · nit',
    note: { line: 14, sev: 'nit', text: 'Extract the header name into a constant.' },
  },
  { wait: 1200, agent: 'reflection', text: '2 findings confirmed · 1 dropped — style preference, not a defect', drop: 14 },
  { wait: 1000, agent: 'writer', text: 'review posted · 2 line comments · changes requested', done: true },
]

export function ReviewReplay() {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(0)
  const [run, setRun] = useState(0)

  // Start the first time the panel scrolls into view.
  useEffect(() => {
    const el = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(STEPS.length)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        setRun(1)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!run) return
    setShown(0)
    const timers: number[] = []
    let at = 0
    STEPS.forEach((s, i) => {
      at += s.wait
      timers.push(window.setTimeout(() => setShown(i + 1), at))
    })
    return () => timers.forEach(clearTimeout)
  }, [run])

  const steps = STEPS.slice(0, shown)
  const notes = steps.flatMap((s) => (s.note ? [s.note] : []))
  const dropped = new Set(steps.flatMap((s) => (s.drop ? [s.drop] : [])))
  const done = steps.at(-1)?.done

  return (
    <section ref={ref} className="replay" aria-label="A PR Sentinel review, replayed">
      <header className="replay-head">
        <span className="lab-kicker">Replay · one review, start to finish</span>
        <p className="replay-dek">
          An illustrative run of the real pipeline: a pull request goes in, specialised agents inspect it in two waves,
          and only what survives reflection comes back as a review.
        </p>
      </header>

      <div className="replay-panel">
        <div className="replay-diff">
          <p className="replay-bar">
            <span>PR #42 · Verify and dedupe webhook deliveries</span>
            <span>{FILE}</span>
          </p>
          <ol className="replay-code">
            {DIFF.map((l, i) => {
              const note = notes.find((x) => x.line === l.n)
              return (
                <li key={i} data-kind={l.kind} data-flag={note && !dropped.has(note.line) ? note.sev : undefined}>
                  <span className="replay-ln">{l.n ?? ''}</span>
                  <code>
                    <span className="replay-sign">{l.kind === '@' ? '' : l.kind}</span>
                    {l.code}
                  </code>
                  {note && (
                    <div className="replay-note" data-sev={note.sev} data-dropped={dropped.has(note.line) ? '' : undefined}>
                      <span className="replay-sev">{note.sev}</span>
                      {note.text}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        <div className="replay-trace" aria-live="polite">
          <p className="replay-bar">
            <span>Trace</span>
            <span>{done ? 'complete' : shown ? 'running…' : 'waiting'}</span>
          </p>
          <ol>
            {steps.map((s, i) => (
              <li key={i} data-agent={s.agent} data-done={s.done ? '' : undefined}>
                <span className="replay-agent">{s.agent}</span>
                <span className="replay-text">{s.text}</span>
              </li>
            ))}
            {!done && shown > 0 && <li className="replay-cursor" aria-hidden />}
          </ol>
          <button type="button" className="replay-again" onClick={() => setRun((r) => r + 1)} disabled={!done}>
            ↻ Replay
          </button>
        </div>
      </div>
    </section>
  )
}
