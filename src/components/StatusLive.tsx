'use client'

import { useCallback, useEffect, useState } from 'react'

type Info = { version: string; commit: string; region: string; time: string }
type Run = { state: 'running' | 'ok' | 'down'; ms: number[]; info?: Info }

const SAMPLES = 6

/**
 * Pings /api/status from the visitor's browser and draws each round trip, so
 * the response time on this page is the one the reader actually gets.
 */
export function StatusLive() {
  const [run, setRun] = useState<Run>({ state: 'running', ms: [] })

  const measure = useCallback(async () => {
    setRun({ state: 'running', ms: [] })
    const ms: number[] = []
    let info: Info | undefined
    try {
      for (let i = 0; i < SAMPLES; i++) {
        const t = performance.now()
        const res = await fetch('/api/status', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        info = await res.json()
        ms.push(Math.round(performance.now() - t))
        setRun({ state: 'running', ms: [...ms], info })
      }
      setRun({ state: 'ok', ms, info })
    } catch {
      setRun({ state: 'down', ms })
    }
  }, [])

  useEffect(() => {
    measure()
  }, [measure])

  const sorted = [...run.ms].sort((a, b) => a - b)
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
  const max = Math.max(50, ...run.ms)

  return (
    <section className="doc-block" aria-labelledby="live-h">
      <header className="doc-block-head">
        <h2 id="live-h">Live — measured from your browser</h2>
        <button type="button" className="doc-btn" onClick={measure} disabled={run.state === 'running'}>
          {run.state === 'running' ? 'Measuring…' : 'Measure again'}
        </button>
      </header>
      <p className="doc-verdict" data-state={run.state} role="status">
        <span className="cover-dot" />
        {run.state === 'running' && 'Pinging /api/status…'}
        {run.state === 'ok' && `All systems operational — median ${median} ms`}
        {run.state === 'down' && 'The status endpoint did not answer'}
      </p>
      <ol className="doc-bars" aria-label="Round-trip times">
        {Array.from({ length: SAMPLES }, (_, i) => {
          const v = run.ms[i]
          return (
            <li key={i}>
              <span>GET #{i + 1}</span>
              <span className="doc-bar">
                <i style={{ transform: `scaleX(${v ? v / max : 0})` }} />
              </span>
              <span>{v === undefined ? '—' : `${v} ms`}</span>
            </li>
          )
        })}
      </ol>
      {run.info && (
        <dl className="doc-kv">
          <dt>Served from</dt>
          <dd>{run.info.region}</dd>
          <dt>Server time</dt>
          <dd>{run.info.time}</dd>
        </dl>
      )}
    </section>
  )
}
