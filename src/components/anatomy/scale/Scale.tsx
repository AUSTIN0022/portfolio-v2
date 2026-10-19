'use client'

import { useEffect, useRef, useState } from 'react'
import { depthOf } from '../iso/iso-kit'
import { Dots, IsoFigure, Line, Plate, Solid } from '../iso/react/draw'
import { baseArt, dialArt, needleOf } from '../shared'
import { AnatomySection, sayIn } from '../scroll'
import { Controls, useDriver, useHoverLoop } from '../driver'
import { sfx } from '../sound'
import { BAYS, PEAK, poseAt, readoutOf, stepAt, STEPS, type Pose } from './model'
import {
  BACK_ART, BASE, BASE_H, BOX_ART, CABLES, FOOT_H, HEIGHT, INSTANCES, KNOB_ART, KNOB_TRAVEL, LB_ART, P, PARTICIPANTS, PULL, RAILS, SERVERS, WIDTH,
  along, loadFill, move,
} from './geometry'
import '../iso/iso.css'
import '../gate/gate.css'

const LABEL =
  'Eight blade servers stand in a row of bays, with a load balancer in front of them cabled along the floor to every bay. Between contests only the first server is in; the rest are pulled out. A go-live switch is thrown and the other seven slide in. When the contest starts the load balancer’s display counts the connections, requests run down the cables to each server in turn, and every server shows how many connections it holds and fills its load window. When it ends, the switch goes back and the servers slide out again.'

type Phase = 'idle' | 'warm' | 'live' | 'down'
const phaseOf = (u: number): Phase => (u < 0.12 || u >= 0.995 ? 'idle' : u < 0.415 ? 'warm' : u < 0.84 ? 'live' : 'down')
const isLive = (p: Pose, i: number) => p.racked[i] > 0.98
const liveOf = (p: Pose) => p.racked.filter((r) => r > 0.98).length
const pullOf = (p: Pose, i: number) => PULL * (1 - p.racked[i])
const shareOf = (p: Pose, i: number) => (isLive(p, i) ? Math.round(p.crowd / Math.max(1, liveOf(p))) : null)
const levelOf = (p: Pose, i: number) => {
  const n = shareOf(p, i)
  return n === null ? 'off' : n / 1250 < 0.7 ? 'ok' : 'hot'
}
const orderOf = (p: Pose) =>
  SERVERS.map((s, i) => ({ i, k: depthOf([s.centre[0], s.centre[1] + pullOf(p, i), s.centre[2]], P) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.i)
const POOL = 28
const fmt = (n: number) => n.toLocaleString('en-US')

/**
 * The bench, posed at u (scroll or buttons). Requests run on their own clock
 * while there is a crowd: the load balancer sends each down the next live
 * server's cable.
 */
export function ScaleFigure({
  track,
  onStep,
  still = 0,
  bare = false,
}: {
  track?: React.RefObject<HTMLElement | null>
  onStep?: (i: number) => void
  still?: number
  bare?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)
  const el = useRef<Record<string, SVGElement | null>>({})
  const bind = (key: string) => (node: SVGElement | null) => {
    el.current[key] = node
  }
  const step = useRef(-1)
  const order = useRef('')
  const [phase, setPhase] = useState<Phase>(phaseOf(still))
  const setA = (key: string, name: string, value: string) => {
    const n = el.current[key]
    if (n && n.getAttribute(name) !== value) n.setAttribute(name, value)
  }
  const setT = (key: string, text: string) => {
    const n = el.current[key]
    if (n && n.textContent !== text) n.textContent = text
  }

  const driver = useDriver(track, (u, prev) => {
    const p = poseAt(u)
    const q = poseAt(prev)
    if ((p.switch > 0.5) !== (q.switch > 0.5)) sfx.clunk()
    for (let i = 1; i < BAYS; i++) if (isLive(p, i) !== isLive(q, i)) (sfx.slide(), sfx.click())
    if (p.crowd > 100 && q.crowd <= 100) sfx.chime()
    const ph = phaseOf(u)
    setPhase((x) => (x === ph ? x : ph))
    for (let i = 0; i < BAYS; i++) {
      const dy = pullOf(p, i)
      const n = shareOf(p, i)
      setA(`server${i}`, 'transform', move([0, dy, 0]))
      setA(`server${i}`, 'data-level', levelOf(p, i))
      setA(`fill${i}`, 'd', loadFill(i, n === null ? 0 : n / 1250, dy))
      setT(`count${i}`, n === null ? '' : fmt(n))
      setA(`cable${i}`, 'data-live', isLive(p, i) ? 'true' : 'false')
      setA(`port${i}`, 'data-live', isLive(p, i) ? 'true' : 'false')
      setA(`riser${i}`, 'style', `opacity:${isLive(p, i) ? 1 : 0}`)
    }
    setT('lbCount', fmt(Math.round(p.crowd / 10) * 10))
    const next = orderOf(p)
    const host = el.current.servers
    if (host && next.join() !== order.current) {
      order.current = next.join()
      for (const i of next) {
        const n = el.current[`server${i}`]
        if (n) host.appendChild(n)
      }
    }
    setA('knob', 'transform', move([KNOB_TRAVEL * p.switch, 0, 0]))
    setA('needleCrowd', 'd', needleOf(PARTICIPANTS, PARTICIPANTS.from + (p.crowd / PEAK) * PARTICIPANTS.span, P))
    setA('needleCount', 'd', needleOf(INSTANCES, INSTANCES.from + ((Math.max(1, liveOf(p)) - 1) / 7) * INSTANCES.span, P))
    sayIn(root.current, readoutOf(u))
    const s = stepAt(u)
    if (s !== step.current) {
      step.current = s
      onStep?.(s)
    }
  }, still)
  useHoverLoop(root, driver, still, 10, bare)

  // Requests: the load balancer dispatches packets down the cables, round-robin over live servers.
  useEffect(() => {
    const node = root.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const free = Array.from(node.querySelectorAll<SVGCircleElement>('.lb-packet'))
    const flying: { k: number; t: number; el: SVGCircleElement }[] = []
    let next = 0
    let owed = 0
    let last = 0
    let raf = 0
    let visible = false
    let lastTick = 0
    const blink = (sel: string) => {
      const s = node.querySelector(sel)
      if (!s) return
      s.setAttribute('data-blink', '')
      setTimeout(() => s.removeAttribute('data-blink'), 110)
    }
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const p = poseAt(driver.current.at())
      const live = Array.from({ length: BAYS }, (_, i) => i).filter((i) => isLive(p, i))
      owed += dt * 14 * (p.crowd / PEAK)
      while (owed >= 1 && free.length && live.length) {
        owed -= 1
        const k = live[next++ % live.length]
        flying.push({ k, t: 0, el: free.pop()! })
        blink(`[data-port="${k}"]`)
      }
      for (let j = flying.length - 1; j >= 0; j--) {
        const f = flying[j]
        f.t += dt / 1.1
        if (f.t >= 1 || !isLive(p, f.k)) {
          f.el.style.opacity = '0'
          free.push(f.el)
          flying.splice(j, 1)
          blink(`[data-server="${f.k}"]`)
          if (now - lastTick > 80) {
            sfx.tick()
            lastTick = now
          }
          continue
        }
        const [x, y] = along(f.k, f.t)
        f.el.setAttribute('cx', x.toFixed(1))
        f.el.setAttribute('cy', y.toFixed(1))
        f.el.style.opacity = '1'
      }
      raf = visible ? requestAnimationFrame(frame) : 0
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(node)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [driver])

  const d = () => driver.current
  const goLive = () => d().play(0.41, 3.2)
  const startContest = () => (d().at() < 0.41 ? d().play(0.41, 2.6, () => d().play(0.66, 2.4)) : d().play(0.66, 2.4))
  const goIdle = () => d().play(1, 3.4, () => d().set(0))
  const toggle = () => (phase === 'idle' ? goLive() : goIdle())

  const p0 = poseAt(still)
  const order0 = orderOf(p0)

  const svg = (
    <IsoFigure width={WIDTH} height={HEIGHT} label={LABEL}>
      {baseArt(BASE, BASE_H, FOOT_H, P)}
      <Solid paths={BACK_ART.plate} tone="mid" inner={<Line d={BACK_ART.seam} tone="faint" />} />
      <Dots points={BACK_ART.screws} size={0.45} tone="mid" />
      {RAILS.map((pair, i) => (
        <g key={i}>
          <Solid paths={pair[0]} tone="lo" crease="none" />
          <Solid paths={pair[1]} tone="lo" crease="none" />
        </g>
      ))}
      {CABLES.map((c, i) => (
        <path key={i} ref={bind(`cable${i}`)} className="iso-line lb-cable" data-live={isLive(p0, i) ? 'true' : 'false'} d={c.floor} />
      ))}
      <g ref={bind('servers')}>
        {order0.map((i) => {
          const s = SERVERS[i]
          const n = shareOf(p0, i)
          return (
            <g key={i} ref={bind(`server${i}`)} data-server={i} className="scale-server" data-level={levelOf(p0, i)} transform={move([0, pullOf(p0, i), 0])}>
              <path className="iso-halo gate-shadow" d={s.halo} />
              <Solid paths={s.body} tone="mid" />
              <Line d={s.panel} tone="faint" />
              <Line d={s.vents} tone="lo" />
              <Line d={s.window} tone="lo" />
              <Line d={s.port} tone="mid" />
              <Line d={s.topVents} tone="faint" />
              <Solid paths={s.handle} tone="mid" />
              <path ref={bind(`fill${i}`)} className="scale-fill" d={loadFill(i, n === null ? 0 : n / 1250, 0)} />
              <circle className="scale-led" cx={s.led[0]} cy={s.led[1]} r={0.9} />
              <text ref={bind(`count${i}`)} className="scale-count" transform={s.text} fontSize={4.4} textAnchor="middle">
                {n === null ? '' : fmt(n)}
              </text>
            </g>
          )
        })}
      </g>
      {CABLES.map((c, i) => (
        <g key={i} ref={bind(`riser${i}`)} className="lb-riser" style={{ opacity: isLive(p0, i) ? 1 : 0 }}>
          <path className="iso-line lb-cable" data-live="true" d={c.riser} />
          <Dots points={[c.end]} size={0.8} tone="hi" />
        </g>
      ))}
      <path className="iso-halo gate-shadow" d={LB_ART.halo} />
      {LB_ART.feet.map((f, i) => (
        <Solid key={i} paths={f} tone="lo" />
      ))}
      <Solid paths={LB_ART.body} tone="hi" inner={<Line d={LB_ART.seam} tone="faint" />} />
      <Line d={LB_ART.bezel} tone="faint" />
      <Line d={LB_ART.display} tone="mid" />
      <Line d={LB_ART.portMarks} tone="lo" />
      <Line d={LB_ART.topVents} tone="lo" />
      <Dots points={LB_ART.screws} size={0.45} tone="mid" />
      <text ref={bind('lbCount')} className="lb-count" transform={LB_ART.text} fontSize={6.4} textAnchor="middle">
        {fmt(Math.round(p0.crowd / 10) * 10)}
      </text>
      {LB_ART.portLeds.map((pt, i) => (
        <circle key={i} ref={bind(`port${i}`)} data-port={i} className="lb-port" data-live={isLive(p0, i) ? 'true' : 'false'} cx={pt[0]} cy={pt[1]} r={1} />
      ))}
      <g className="lb-packets">
        {Array.from({ length: POOL }, (_, k) => (
          <circle key={k} className="lb-packet" r={1.5} style={{ opacity: 0 }} />
        ))}
      </g>
      <Solid paths={BOX_ART.box} tone="mid" inner={<Line d={BOX_ART.seam} tone="faint" />} />
      <Line d={BOX_ART.slot} tone="lo" />
      <Line d={BOX_ART.stops} tone="lo" />
      <Dots points={BOX_ART.screws} size={0.45} tone="mid" />
      <g ref={bind('knob')} transform={move([KNOB_TRAVEL * p0.switch, 0, 0])} className={bare ? undefined : 'bench-hit'} onClick={bare ? undefined : toggle}>
        {!bare && <title>{phase === 'idle' ? 'Go live' : 'Go idle'}</title>}
        <Solid paths={KNOB_ART.knob} tone="hi" lit />
        <Line d={KNOB_ART.knurl} tone="lo" />
        <Line d={KNOB_ART.mark} tone="lit" />
      </g>
      {dialArt(PARTICIPANTS, P)}
      <path ref={bind('needleCrowd')} className="iso-line gate-needle" data-tone="lit" d={needleOf(PARTICIPANTS, PARTICIPANTS.from + (p0.crowd / PEAK) * PARTICIPANTS.span, P)} />
      {dialArt(INSTANCES, P)}
      <path ref={bind('needleCount')} className="iso-line gate-needle" data-tone="hi" d={needleOf(INSTANCES, INSTANCES.from + ((Math.max(1, liveOf(p0)) - 1) / 7) * INSTANCES.span, P)} />
    </IsoFigure>
  )

  if (bare)
    return (
      <div ref={root} className="iso gate gate--bare">
        {svg}
      </div>
    )
  return (
    <div ref={root} className="iso gate">
      <Plate
        fig="Fig 1"
        title="One switch, eight servers"
        hint="Scroll, or use the buttons"
        readout={readoutOf(still)}
        keys={[
          { mark: 'lit', label: 'The go-live switch' },
          { mark: 'raised', label: 'A server — racked is live' },
          { mark: 'edge', label: 'A request, from the load balancer to one server' },
        ]}
      >
        {svg}
        <Controls
          actions={[
            { label: 'Go live', run: goLive, disabled: phase !== 'idle' },
            { label: 'Start contest', run: startContest, disabled: phase === 'live' || phase === 'down' },
            { label: 'Go idle', run: goIdle, disabled: phase === 'idle' },
            { label: 'Reset', run: () => d().play(0, 0.8) },
          ]}
        />
      </Plate>
    </div>
  )
}

export function ScaleSection() {
  return (
    <AnatomySection
      kicker="Anatomy · auto-scaling"
      title="One switch, eight servers"
      label="How QuizBuzz scales for a contest"
      steps={STEPS}
      figure={(track, onStep) => <ScaleFigure track={track} onStep={onStep} />}
    />
  )
}
