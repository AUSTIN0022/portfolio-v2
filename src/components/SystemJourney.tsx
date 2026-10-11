'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Journey, JourneyNode as Node } from '@/content/journeys'
import { LiquidText } from './LiquidText'

/**
 * SystemJourney — a system's architecture (see content/journeys.ts) as a
 * full-bleed, scroll-pinned film, drawn in a flow-diagram language: small icon tiles with their names
 * underneath, four bright "hub" pills for the core services, and fan-shaped
 * curves carrying traffic. The world is tall and roomy; one camera travels
 * down and across it between the seven story stages (pulling back mid-move),
 * then the last stage pans the whole system top to bottom rather than
 * shrinking it into one crowded frame. The orange packet is one request.
 *
 * Per-frame work is imperative in one rAF loop gated on visibility; React
 * state only changes when the stage or the request's hop does.
 */

const HUB_W = 236
const HUB_H = 60
const TILE = 64
/** Left edge of a hub's centred [icon 22 · gap 10 · label] group, from an estimated label width. */
const hubStart = (label: string, w = label.length * 8.9) => -(22 + 10 + w) / 2

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)

/** Where an edge leaves / enters a node: hubs and tiles each have their own box. */
function half(n: Node) {
  return n.kind === 'hub' ? { w: HUB_W / 2, h: HUB_H / 2 } : { w: TILE / 2, h: TILE / 2 }
}
function edgePath(a: Node, b: Node) {
  const ha = half(a)
  const hb = half(b)
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dy) >= Math.abs(dx) * 0.5) {
    const sgn = Math.sign(dy) || 1
    // Leave a node below its caption, not through it.
    const sy = a.y + sgn * (ha.h + (sgn > 0 ? (a.kind === 'tile' ? 54 : 36) : 8))
    const ey = b.y - sgn * (hb.h + (sgn < 0 ? (b.kind === 'tile' ? 54 : 36) : 8))
    const my = (sy + ey) / 2
    return `M ${a.x} ${sy} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${ey}`
  }
  const sgn = Math.sign(dx) || 1
  const sx = a.x + sgn * (ha.w + 10)
  const ex = b.x - sgn * (hb.w + 10)
  const mx = (sx + ex) / 2
  return `M ${sx} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${ex} ${b.y}`
}

export function SystemJourney({ journey }: { journey: Journey }) {
  const {
    nodes: NODES,
    stages: STAGES,
    cams: CAMS,
    pan: PAN,
    spans: SPANS,
    requestPath: REQUEST_PATH,
    requestLabels: REQUEST_LABELS,
  } = journey
  const N = STAGES.length
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const camRef = useRef<SVGGElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(0)
  const [hops, setHops] = useState(0)

  const byId = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>, [NODES])
  const edges = useMemo(
    () => journey.edges.map((e, i) => ({ ...e, key: `${e.from}-${e.to}`, i, d: edgePath(byId[e.from], byId[e.to]) })),
    [journey.edges, byId],
  )
  const reqEdges = useMemo(
    () => REQUEST_PATH.slice(0, -1).map((id, i) => edges.find((e) => e.from === id && e.to === REQUEST_PATH[i + 1])!),
    [edges, REQUEST_PATH],
  )

  useEffect(() => {
    const section = sectionRef.current!
    const stageEl = stageRef.current!
    const svg = svgRef.current!
    const cam = camRef.current!
    const chip = chipRef.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pathEls = new Map<string, SVGPathElement>()
    const lens = new Map<string, number>()
    svg.querySelectorAll<SVGPathElement>('[data-edge]').forEach((p) => {
      const L = p.getTotalLength()
      pathEls.set(p.dataset.edge!, p)
      lens.set(p.dataset.edge!, L)
      p.style.setProperty('--len', String(L))
    })
    const nodeEls = new Map<string, SVGGElement>()
    svg.querySelectorAll<SVGGElement>('[data-node]').forEach((g) => nodeEls.set(g.dataset.node!, g))
    // Centre each hub's icon + label exactly, now that the label can be measured
    // (again once web fonts land, since that changes the width).
    const centreHubs = () =>
      nodeEls.forEach((g) => {
        const text = g.querySelector<SVGTextElement>('.sj-hub-label')
        const icon = g.querySelector<SVGSVGElement>('.sj-hub-icon')
        if (!text || !icon) return
        const start = hubStart('', text.getComputedTextLength())
        icon.setAttribute('x', String(start))
        text.setAttribute('x', String(start + 32))
      })
    centreHubs()
    document.fonts?.ready.then(centreHubs)
    const edgeEls = new Map<string, SVGGElement>()
    svg.querySelectorAll<SVGGElement>('[data-edge-group]').forEach((g) => edgeEls.set(g.dataset.edgeGroup!, g))
    const comets = Array.from(svg.querySelectorAll<SVGGElement>('[data-comet]'))
    const packet = svg.querySelector<SVGGElement>('[data-packet]')!

    let W = 0, H = 0
    const resize = () => {
      W = stageEl.clientWidth
      H = stageEl.clientHeight
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(stageEl)

    const cur = { ...CAMS[0], req: 0 }
    let lastStage = -1
    let lastHops = -1
    let visible = false
    let raf = 0
    let t0 = 0

    const setState = (el: Element | undefined, s: string) => {
      if (el && el.getAttribute('data-state') !== s) el.setAttribute('data-state', s)
    }
    const put = (el: Element, attrs: Record<string, number>) => {
      for (const k in attrs) el.setAttribute(k, String(attrs[k]))
    }

    const frame = (now: number) => {
      raf = visible ? requestAnimationFrame(frame) : 0
      // rAF's timestamp can precede the performance.now() t0 was seeded from.
      const dt = clamp((now - t0) / 1000, 0, 0.25)
      t0 = now

      // Scroll → story position. Stages 0..N-2 move between CAMS; the last
      // stage gets one extra screen of scroll to pan the whole system.
      const r = section.getBoundingClientRect()
      const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight))
      const f = p * N // N-1 transitions + 1 pan
      let target: { x: number; y: number; s: number }
      let stageF: number
      if (f < N - 1) {
        const i = Math.min(N - 2, Math.floor(f))
        const e = smooth(clamp((f - i - 0.28) / 0.44))
        const a = CAMS[i]
        const b = i + 1 < CAMS.length ? CAMS[i + 1] : PAN.from
        stageF = i + e
        target = {
          x: lerp(a.x, b.x, e),
          y: lerp(a.y, b.y, e),
          // Scale in log space, with a breath outward mid-move.
          s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)) * (1 - 0.2 * Math.sin(Math.PI * e)),
        }
      } else {
        const t = smooth(clamp((f - (N - 1) - 0.1) / 0.8))
        stageF = N - 1
        target = { x: PAN.from.x, y: lerp(PAN.from.y, PAN.to.y, t), s: PAN.from.s }
      }

      const k = reduce ? 1 : 1 - Math.exp(-dt * 8) // frame-rate independent easing
      cur.x += (target.x - cur.x) * k
      cur.y += (target.y - cur.y) * k
      cur.s += (target.s - cur.s) * k

      const wide = W > 900
      const fit = Math.min(W / 1440, H / 900) * (wide ? 1 : 1.6)
      const S = cur.s * fit
      const cx = wide ? W * 0.64 : W * 0.5
      const cy = wide ? H * 0.5 : H * 0.36
      cam.setAttribute('transform', `translate(${cx} ${cy}) scale(${S}) translate(${-cur.x} ${-cur.y})`)

      const si = Math.round(stageF)
      const st = STAGES[si]
      const all = st.active === 'ALL'
      const activeSet = new Set(all ? NODES.map((n) => n.id) : st.active)
      if (si !== lastStage) {
        lastStage = si
        setStage(si)
        NODES.forEach((n) =>
          setState(nodeEls.get(n.id), n.appear > si ? 'hidden' : activeSet.has(n.id) ? 'active' : 'dim'),
        )
        edges.forEach((ed) => {
          const hidden = ed.appear > si || byId[ed.from].appear > si || byId[ed.to].appear > si
          const on = activeSet.has(ed.from) && activeSet.has(ed.to)
          setState(edgeEls.get(ed.key), hidden ? 'hidden' : on ? 'active' : 'dim')
        })
      }

      // Ambient traffic: short dashes riding the live curves.
      const time = now / 1000
      comets.forEach((c) => {
        const key = c.dataset.comet!
        const ed = edges[Number(c.dataset.ei)]
        const shown = ed.appear <= si && activeSet.has(ed.from) && activeSet.has(ed.to)
        c.style.opacity = shown ? '1' : '0'
        if (!shown) return
        const path = pathEls.get(key)!
        const L = lens.get(key)!
        const u = reduce ? 0.6 : (time * (90 / L) + Number(c.dataset.phase)) % 1
        const head = path.getPointAtLength(u * L)
        const tail = path.getPointAtLength(Math.max(0, u * L - 22))
        const line = c.firstElementChild as SVGLineElement
        put(line, { x1: tail.x, y1: tail.y, x2: head.x, y2: head.y })
        line.style.opacity = String(Math.sin(Math.PI * u))
      })

      // The request rides stages 1 → 5 across the six hops of REQUEST_PATH.
      const reqTarget = clamp((stageF - 0.85) / 4.3) * reqEdges.length
      cur.req += (reqTarget - cur.req) * (reduce ? 1 : 1 - Math.exp(-dt * 5))
      const seg = clamp(Math.floor(cur.req), 0, reqEdges.length - 1)
      const local = clamp(cur.req - seg)
      const showPacket = stageF > 0.6
      packet.style.opacity = showPacket ? '1' : '0'
      if (showPacket) {
        const ed = reqEdges[seg]
        const path = pathEls.get(ed.key)!
        const L = lens.get(ed.key)!
        const head = path.getPointAtLength(local * L)
        const tail = path.getPointAtLength(Math.max(0, local * L - 80))
        put(packet.children[0], { x1: tail.x, y1: tail.y, x2: head.x, y2: head.y })
        put(packet.children[1], { cx: head.x, cy: head.y })
        put(packet.children[2], { cx: head.x, cy: head.y })
        const sx = cx + (head.x - cur.x) * S
        const sy = cy + (head.y - cur.y) * S
        chip.style.transform = `translate(${sx}px, ${sy - 40}px) translateX(-50%)`
      }
      chip.style.opacity = showPacket && cur.req > 0.02 && f < N - 1 ? '1' : '0'

      const h = Math.min(reqEdges.length, Math.floor(cur.req + 0.02))
      if (h !== lastHops) {
        lastHops = h
        setHops(h)
        nodeEls.forEach((g) => g.removeAttribute('data-hit'))
        const hitId = REQUEST_PATH[h]
        if (h > 0 && hitId) nodeEls.get(hitId)?.setAttribute('data-hit', '')
      }
    }

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible && !raf) {
        t0 = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(section)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [edges, reqEdges, byId, NODES, STAGES, CAMS, PAN, REQUEST_PATH, N])

  const st = STAGES[stage]
  const maxMs = SPANS.reduce((a, s) => a + s.ms, 0)
  let offset = 0

  return (
    <section ref={sectionRef} className="sj" style={{ height: `${(N + 2) * 100}vh` }} aria-label={`${journey.name} architecture journey`}>
      <div ref={stageRef} className="sj-stage">
        <div className="sj-grid" aria-hidden />
        <svg ref={svgRef} className="sj-svg" aria-hidden>
          <defs>
            <radialGradient id="sj-hub-glow">
              <stop offset="0" stopColor="#ff4f12" stopOpacity="0.38" />
              <stop offset="1" stopColor="#ff4f12" stopOpacity="0" />
            </radialGradient>
            <filter id="sj-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g ref={camRef}>
            {edges.map((ed) => (
              <g key={ed.key} data-edge-group={ed.key} data-state="hidden" className="sj-edge">
                <path data-edge={ed.key} d={ed.d} />
              </g>
            ))}
            <g filter="url(#sj-soft)">
              {edges.flatMap((ed) =>
                ed.traffic
                  ? [0, 0.34, 0.67].map((ph) => (
                      <g key={`${ed.key}-${ph}`} data-comet={ed.key} data-ei={ed.i} data-phase={ph + ed.i * 0.11} className="sj-comet">
                        <line />
                      </g>
                    ))
                  : [],
              )}
            </g>
            {NODES.map((n) => {
              const Icon = n.icon
              return (
                <g key={n.id} data-node={n.id} data-kind={n.kind} data-state="hidden" className="sj-node" transform={`translate(${n.x} ${n.y})`}>
                  <g className="sj-node-body">
                    {n.kind === 'hub' ? (
                      <>
                        <ellipse rx={HUB_W * 0.9} ry={HUB_H * 1.6} className="sj-hub-glow" fill="url(#sj-hub-glow)" />
                        <rect x={-HUB_W / 2} y={-HUB_H / 2} width={HUB_W} height={HUB_H} rx={14} className="sj-hub" />
                        {/* Icon + label are centred as one group; x is refined from the measured text width on mount. */}
                        <Icon x={hubStart(n.label)} y={-11} width={22} height={22} className="sj-hub-icon" />
                        <text x={hubStart(n.label) + 32} y={0} dominantBaseline="central" className="sj-hub-label">
                          {n.label}
                        </text>
                        <text y={HUB_H / 2 + 24} textAnchor="middle" className="sj-node-sub">
                          {n.sub}
                        </text>
                      </>
                    ) : (
                      <>
                        <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx={14} className="sj-tile" />
                        <Icon x={-13} y={-13} width={26} height={26} className="sj-tile-icon" />
                        <text y={TILE / 2 + 24} textAnchor="middle" className="sj-node-label">
                          {n.label}
                        </text>
                        <text y={TILE / 2 + 42} textAnchor="middle" className="sj-node-sub">
                          {n.sub}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              )
            })}
            <g data-packet className="sj-packet" filter="url(#sj-soft)">
              <line />
              <circle r={10} className="sj-packet-halo" />
              <circle r={5} />
            </g>
          </g>
        </svg>

        <div ref={chipRef} className="sj-chip" aria-hidden>
          <span className="sj-chip-dot" />
          {REQUEST_LABELS[Math.max(0, Math.min(REQUEST_LABELS.length - 1, hops - 1))]}
        </div>

        <div className="sj-caption" aria-live="polite">
          <p className="sj-kicker">
            <span>{journey.name}</span>
            <span>
              {st.index} <i>/</i> {String(N).padStart(2, '0')}
            </span>
          </p>
          <LiquidText key={st.key} text={st.title} as="h3" trigger="load" stagger={18} duration={900} className="sj-title" />
          <p className="sj-sub" key={`${st.key}-s`}>
            {st.subtitle}
          </p>
          {st.why && (
            <p className="sj-why" key={`${st.key}-w`}>
              {st.why}
            </p>
          )}
          <ol className="sj-rail" aria-hidden>
            {STAGES.map((s, i) => (
              <li key={s.key} data-on={i <= stage ? '' : undefined} />
            ))}
          </ol>
        </div>

        <aside className="sj-trace" aria-label="Request trace">
          <p className="sj-trace-head">
            <span>trace</span> {journey.traceId} <em>· illustrative timings</em>
          </p>
          <ul>
            {SPANS.map((s, i) => {
              const left = (offset / maxMs) * 100
              offset += s.ms
              return (
                <li key={s.name} data-on={i < hops ? '' : undefined}>
                  <span className="sj-trace-name">{s.name}</span>
                  <span className="sj-trace-bar">
                    <i style={{ left: `${left}%`, width: `${Math.max(2, (s.ms / maxMs) * 100)}%` }} />
                  </span>
                  <span className="sj-trace-ms">{s.ms >= 1000 ? `${(s.ms / 1000).toFixed(1)}s` : `${s.ms}ms`}</span>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </section>
  )
}
