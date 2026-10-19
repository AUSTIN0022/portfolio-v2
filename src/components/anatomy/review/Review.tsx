'use client'

import { useRef, useState } from 'react'
import { cylinder, depthOf, insetPlan, iso, lineOnTop, pathOf, planOutline, ringOf, ringSeam, sideArc, slabOf, type Plan, type Point3, type Projection } from '../iso/iso-kit'
import { Dots, IsoFigure, Line, Solid } from '../iso/react/draw'
import { baseArt } from '../shared'
import { AnatomySection, sayIn } from '../scroll'
import { Controls, useDriver, useHoverLoop } from '../driver'
import { sfx } from '../sound'
import { Plate } from '../iso/react/draw'
import '../iso/iso.css'
import '../gate/gate.css'

/*
 * PR Sentinel as a bench, drawn still for the home page: a pull request on
 * a carriage under a gantry of eleven agent probes in two waves (the first
 * down, reading the diff; the second raised, waiting its turn), a cabinet of
 * cached git data keyed by commit with one drawer out, and an outbox of the
 * line comments that survived the reflection pass.
 */

const WIDTH = 640
const HEIGHT = 360
const AZIMUTH = 40
const BASE: Plan = { x: -150, y: -78, w: 300, d: 160, r: 10 }
const BASE_H = 9
const FOOT_H = 5

const TRAY: Plan = { x: -96, y: -28, w: 128, d: 56, r: 3 }
const TRAY_Z = 6
const TRAY_TOP = TRAY_Z + 4
const BEAM_X = -26
const BEAM: Plan = { x: BEAM_X - 8, y: -58, w: 16, d: 116, r: 2.5 }
const BEAM_Z = 46
const POSTS = [-52, 52]
const WAVE1 = [-25, -15, -5, 5, 15, 25].map((y) => [BEAM_X - 3.5, y] as const)
const WAVE2 = [-20, -10, 0, 10, 20].map((y) => [BEAM_X + 4, y] as const)
const CAB: Plan = { x: 64, y: -66, w: 44, d: 40, r: 2.5 }
const CAB_H = 38
const OUT: Plan = { x: 62, y: 14, w: 52, d: 44, r: 3 }

function fit(points: Point3[]): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH }
  const flat = points.map((p) => iso(p, unit))
  const xs = flat.map(([x]) => x)
  const ys = flat.map(([, y]) => y)
  const pad = 22
  const scale = Math.min((WIDTH - pad * 2) / (Math.max(...xs) - Math.min(...xs)), (HEIGHT - pad * 2) / (Math.max(...ys) - Math.min(...ys)))
  return {
    origin: [WIDTH / 2 - ((Math.max(...xs) + Math.min(...xs)) / 2) * scale, HEIGHT / 2 - ((Math.max(...ys) + Math.min(...ys)) / 2) * scale],
    scale,
    azimuth: AZIMUTH,
  }
}
const box = ({ x, y, w, d }: Plan, z0: number, z1: number): Point3[] => {
  const out: Point3[] = []
  for (const px of [x, x + w]) for (const py of [y, y + d]) for (const z of [z0, z1]) out.push([px, py, z])
  return out
}
const P = fit([...box(BASE, -BASE_H - FOOT_H, 0), ...box(BEAM, BEAM_Z, BEAM_Z + 6)])
const at = (p: Point3) => iso(p, P)
const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel)
const cyl = (x: number, y: number, r: number, z: number, h: number, steps = 18) => cylinder(x, y, r, z, h, P, steps)
const faceY = (y: number, pts: [number, number][]) => pathOf(pts.map(([x, z]) => at([x, y, z])), true)

/* The diff on the tray: rule lines for code, a few marked as added. */
const DIFF = Array.from({ length: 11 }, (_, k) => {
  const y = TRAY.y + 7 + k * 4.2
  const len = [86, 64, 96, 72, 40, 90, 58, 100, 70, 48, 80][k]
  return { y, len, added: k === 3 || k === 4 || k === 7 }
})

/** A probe, built lowered onto the diff; its plunger (stem and tip) is lifted by the live code. */
function probe(x: number, y: number) {
  const tip = TRAY_TOP
  return {
    housing: cyl(x, y, 2.8, BEAM_Z - 9, 9, 20),
    band: sideArc(x, y, 2.8, BEAM_Z - 4.5, P, 14),
    stem: cyl(x, y, 1, tip + 2, BEAM_Z - 2 - tip - 2, 12),
    tip: cyl(x, y, 1.6, tip, 2, 14),
    key: depthOf([x, y, tip], P),
  }
}
const PROBES = [...WAVE1.map(([x, y]) => ({ ...probe(x, y), wave: 1 })), ...WAVE2.map(([x, y]) => ({ ...probe(x, y), wave: 2 }))].sort(
  (a, b) => a.key - b.key,
)

const RAILS = [-20, 16].map((y) => solid({ x: -124, y, w: 200, d: 4, r: 1 }, 0, 3, 3, 0.4))

const DRAWERS = [0, 1, 2, 3].map((k) => {
  const z0 = 3 + k * 8.6
  return { z0, z1: z0 + 7.4, out: k === 1 ? 12 : 0 }
})

/* ── The review, as a pure function of u ─────────────────────────────── */
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a))
const sm = (t: number) => t * t * (3 - 2 * t)
const RAISED = 24 - TRAY_TOP
/** Four findings on the diff; the reflection pass keeps two. */
const FINDINGS = [
  { line: 1, x: 70, at: 0.27, keep: false },
  { line: 4, x: 46, at: 0.31, keep: true },
  { line: 7, x: 104, at: 0.52, keep: true },
  { line: 9, x: 60, at: 0.56, keep: false },
]
function poseAt(u: number) {
  const tray = 60 * (1 - sm(seg(u, 0, 0.12))) + 60 * sm(seg(u, 0.95, 1))
  const drawer = 12 * sm(seg(u, 0.04, 0.12)) - 12 * sm(seg(u, 0.9, 0.96))
  const wave1 = RAISED * (1 - sm(seg(u, 0.16, 0.24)) + sm(seg(u, 0.34, 0.4)))
  const wave2 = sm(seg(u, 0.42, 0.5)) - sm(seg(u, 0.58, 0.63))
  const flags = FINDINGS.map((f) => {
    const shown = sm(seg(u, f.at, f.at + 0.03)) * (f.keep ? 1 : 1 - sm(seg(u, 0.68, 0.74)))
    const gone = sm(seg(u, 0.95, 1))
    return { shown: shown * (1 - gone), state: u >= 0.74 && f.keep ? 'kept' : u >= 0.66 && !f.keep ? 'false' : 'found' }
  })
  const cards = [0, 1].map((k) => 1 - sm(seg(u, 0.78 + k * 0.06, 0.84 + k * 0.06)))
  return { tray, drawer, wave1, wave2: RAISED * (1 - wave2), flags, cards }
}
const STEPS = [
  { until: 0.14, key: 'pr', title: 'A pull request arrives', text: 'GitHub’s webhook is verified and queued. The diff comes from a cache keyed by commit SHA — 12× fewer GitHub calls per review.' },
  { until: 0.41, key: 'w1', title: 'Wave one', text: 'A planner picks the specialised agents for this diff and runs the first wave in parallel, each limited to the tools its role needs.' },
  { until: 0.65, key: 'w2', title: 'Wave two', text: 'A second wave builds on what the first found. Eleven agents in all, around one orchestrator.' },
  { until: 1.01, key: 'post', title: 'Reflection, then comments', text: 'A reflection pass throws out false positives before anything is said; what survives is posted back as line comments.' },
] as const
const stepAt = (u: number) => STEPS.findIndex((s) => u < s.until)
function readoutOf(u: number) {
  if (u < 0.14) return 'webhook verified · diff from cache'
  if (u < 0.41) return 'wave 1 · agents reading the diff'
  if (u < 0.65) return 'wave 2 · building on wave 1'
  if (u < 0.77) return 'reflection · false positives out'
  if (u < 0.95) return 'line comments posted'
  return 'review done'
}

export function ReviewFigure({
  track,
  onStep,
  still = 0.3,
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
  const [busy, setBusy] = useState(false)
  const setA = (key: string, name: string, value: string) => {
    const n = el.current[key]
    if (n && n.getAttribute(name) !== value) n.setAttribute(name, value)
  }
  const mv = (x: number, y: number, z: number) => `translate(${(at([x, y, z])[0] - at([0, 0, 0])[0]).toFixed(2)} ${(at([x, y, z])[1] - at([0, 0, 0])[1]).toFixed(2)})`

  const driver = useDriver(track, (u, prev) => {
    const p = poseAt(u)
    const q = poseAt(prev)
    if (p.drawer > 6 && q.drawer <= 6) sfx.slide()
    if (p.wave1 < 1 && q.wave1 >= 1) sfx.thunk()
    if (p.wave2 < 1 && q.wave2 >= 1) sfx.thunk()
    p.flags.forEach((f, i) => {
      if (f.shown > 0.5 && q.flags[i].shown <= 0.5) sfx.blip(i)
      setA(`flag${i}`, 'style', `opacity:${f.shown.toFixed(3)}`)
      setA(`flag${i}`, 'data-state', f.state)
    })
    p.cards.forEach((c, k) => {
      if (c < 0.05 && q.cards[k] >= 0.05) sfx.click()
      setA(`card${k}`, 'transform', mv(0, 0, c * 26))
      setA(`card${k}`, 'style', `opacity:${(1 - c * 0.9).toFixed(3)}`)
    })
    setA('tray', 'transform', mv(p.tray, 0, 0))
    setA('drawer', 'transform', mv(0, p.drawer, 0))
    PROBES.forEach((pr, i) => setA(`probe${i}`, 'transform', mv(0, 0, pr.wave === 1 ? p.wave1 : p.wave2)))
    sayIn(root.current, readoutOf(u))
    const s = stepAt(u)
    if (s !== step.current) {
      step.current = s
      onStep?.(s)
    }
  }, still)
  useHoverLoop(root, driver, still, 9, bare)
  const review = () => {
    setBusy(true)
    driver.current.set(0)
    driver.current.play(0.94, 7, () => setBusy(false))
  }
  const reset = () => driver.current.play(driver.current.at() > 0.5 ? 1 : 0, 1, () => driver.current.set(0))

  const p0 = poseAt(still)
  const probesOf = (wave: number) => PROBES.filter((p) => p.wave === wave)
  const svg = (
    <IsoFigure
        width={WIDTH}
        height={HEIGHT}
        label="A review bench. A pull request lies on a carriage under a gantry of eleven agent probes in two rows: the first wave comes down to read the diff, then the second. Findings pop up as flags; a reflection pass drops the false ones and the rest are posted. Beside it, a cabinet of cached git data with one drawer pulled out, and an outbox holding the posted comments."
      >
        {baseArt(BASE, BASE_H, FOOT_H, P)}
        {RAILS.map((paths, i) => (
          <Solid key={i} paths={paths} tone="mid" />
        ))}
        <g ref={bind('tray')} transform={mv(p0.tray, 0, 0)}>
        <Solid paths={solid({ x: -78, y: -24, w: 92, d: 48, r: 2 }, 3, 3, 4)} tone="mid" />
        <Solid paths={solid(TRAY, TRAY_Z, 4, 6, 0.8)} tone="hi" />
        <Line d={planOutline(insetPlan(TRAY, 3), TRAY_TOP, P, 6)} tone="faint" />
        <Line d={DIFF.map((l) => lineOnTop([TRAY.x + 12, l.y], [TRAY.x + 12 + l.len * 0.95, l.y], TRAY_TOP, P)).join('')} tone="lo" free />
        <Line d={DIFF.filter((l) => l.added).map((l) => lineOnTop([TRAY.x + 5, l.y], [TRAY.x + 8, l.y], TRAY_TOP, P) + lineOnTop([TRAY.x + 6.5, l.y - 1.5], [TRAY.x + 6.5, l.y + 1.5], TRAY_TOP, P)).join('')} tone="mid" />
        <Dots points={[at([TRAY.x + 3, TRAY.y + 3, TRAY_TOP]), at([TRAY.x + TRAY.w - 3, TRAY.y + TRAY.d - 3, TRAY_TOP])]} size={0.45} tone="mid" />
        {/* findings: flags that pop up as the agents read, two of them false */}
        {FINDINGS.map((f, i) => (
          <g key={i} ref={bind(`flag${i}`)} className="review-flag" data-state={p0.flags[i].state} style={{ opacity: p0.flags[i].shown }}>
            <Solid paths={cyl(TRAY.x + f.x, DIFF[f.line].y, 0.6, TRAY_TOP, 9, 10)} tone="mid" crease="none" />
            <Solid paths={solid({ x: TRAY.x + f.x, y: DIFF[f.line].y - 0.4, w: 6, d: 0.8, r: 0.2 }, TRAY_TOP + 5.5, 3.5, 2)} tone="hi" className="review-flag-cloth" />
          </g>
        ))}
        </g>

        {/* gantry: back post, probes in depth order, front post, beam */}
        <Solid paths={solid({ x: BEAM_X - 6, y: POSTS[0] - 6, w: 12, d: 12, r: 2 }, 0, 2, 4)} tone="lo" />
        <Solid paths={cyl(BEAM_X, POSTS[0], 4, 2, BEAM_Z - 2, 24)} tone="mid" crease="none" />
        {PROBES.map((p, i) => (
          <g key={i}>
            <g ref={bind(`probe${i}`)} transform={mv(0, 0, p.wave === 1 ? p0.wave1 : p0.wave2)}>
              <Solid paths={p.stem} tone="mid" crease="none" />
              <Solid paths={p.tip} tone={p.wave === 1 ? 'hi' : 'mid'} />
            </g>
            <Solid paths={p.housing} tone="mid" />
            <Line d={p.band} tone="faint" />
          </g>
        ))}
        <Solid paths={solid({ x: BEAM_X - 6, y: POSTS[1] - 6, w: 12, d: 12, r: 2 }, 0, 2, 4)} tone="lo" />
        <Solid paths={cyl(BEAM_X, POSTS[1], 4, 2, BEAM_Z - 2, 24)} tone="mid" crease="none" />
        <Solid paths={solid(BEAM, BEAM_Z, 6, 4, 0.8)} tone="mid" inner={<Line d={ringSeam(ringOf(BEAM, 4), BEAM_Z + 3, P)} tone="faint" />} />
        <Line d={lineOnTop([BEAM_X, BEAM.y + 6], [BEAM_X, BEAM.y + BEAM.d - 6], BEAM_Z + 6, P)} tone="faint" />
        <Dots points={POSTS.map((y) => at([BEAM_X, y, BEAM_Z + 6]))} size={0.5} tone="mid" />

        {/* cache cabinet: four drawers keyed by commit, one out */}
        <Solid paths={solid(CAB, 0, CAB_H, 4, 0.8)} tone="mid" />
        {DRAWERS.map((d, k) => {
          const y = CAB.y + CAB.d
          const front = faceY(y, [[CAB.x + 3, d.z0], [CAB.x + CAB.w - 3, d.z0], [CAB.x + CAB.w - 3, d.z1], [CAB.x + 3, d.z1]])
          return d.out ? (
            <g key={k} ref={bind('drawer')} transform={mv(0, p0.drawer, 0)}>
              <Solid paths={solid({ x: CAB.x + 3, y: y - 14, w: CAB.w - 6, d: 14, r: 1 }, d.z0, d.z1 - d.z0, 3, 0.4)} tone="hi" />
              <Solid paths={solid({ x: CAB.x + CAB.w / 2 - 5, y, w: 10, d: 2, r: 0.6 }, d.z0 + 2.4, 2.2, 2)} tone="mid" />
            </g>
          ) : (
            <g key={k}>
              <Line d={front} tone="lo" />
              <Line d={faceY(y, [[CAB.x + CAB.w / 2 - 5, d.z0 + 2.6], [CAB.x + CAB.w / 2 + 5, d.z0 + 2.6], [CAB.x + CAB.w / 2 + 5, d.z0 + 4.6], [CAB.x + CAB.w / 2 - 5, d.z0 + 4.6]])} tone="mid" />
            </g>
          )
        })}

        {/* outbox with the posted comments */}
        <Solid paths={solid(OUT, 0, 7, 5, 0.6)} tone="mid" />
        <Line d={planOutline(insetPlan(OUT, 3), 7, P, 5)} tone="lo" />
        {[0, 1, 2].map((k) => {
          const card: Plan = { x: OUT.x + 7 + k * 2, y: OUT.y + 7 + k * 3, w: 34, d: 24, r: 1.5 }
          const z = 4 + k * 1.4
          return (
            <g key={k}>
              <Solid paths={solid(card, z, 1.2, 3)} tone="hi" />
              {k === 2 && (
                <Line
                  d={[0, 1, 2].map((r) => lineOnTop([card.x + 4, card.y + 6 + r * 4], [card.x + (r === 1 ? 20 : 28), card.y + 6 + r * 4], z + 1.2, P)).join('')}
                  tone="lo"
                  free
                />
              )}
            </g>
          )
        })}
        {[0, 1].map((k) => {
          const card: Plan = { x: OUT.x + 13 - k * 3, y: OUT.y + 15 - k * 4, w: 34, d: 24, r: 1.5 }
          const z = 4 + (3 + k) * 1.4
          return (
            <g key={`new${k}`} ref={bind(`card${k}`)} transform={mv(0, 0, p0.cards[k] * 26)} style={{ opacity: 1 - p0.cards[k] * 0.9 }}>
              <Solid paths={solid(card, z, 1.2, 3)} tone="hi" />
              <Line
                d={[0, 1].map((r) => lineOnTop([card.x + 4, card.y + 7 + r * 4], [card.x + (r ? 18 : 27), card.y + 7 + r * 4], z + 1.2, P)).join('')}
                tone="lo"
                free
              />
            </g>
          )
        })}
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
      <Plate fig="Fig 1" title="Two waves, one review" hint="Scroll, or click it" readout={readoutOf(still)} keys={[{ mark: 'lit', label: 'A finding that survives reflection' }, { mark: 'raised', label: 'An agent probe' }]}>
        <div className="bench-hit" onClick={() => !busy && review()} title="Review the pull request">
          {svg}
        </div>
        <Controls
          actions={[
            { label: 'Review PR', run: review, disabled: busy },
            { label: 'Reset', run: reset, disabled: busy },
          ]}
        />
      </Plate>
    </div>
  )
}

export function ReviewSection() {
  return (
    <AnatomySection
      kicker="Anatomy · agent waves"
      title="Two waves, one review"
      label="How PR Sentinel reviews a pull request"
      steps={STEPS}
      figure={(track, onStep) => <ReviewFigure track={track} onStep={onStep} />}
    />
  )
}
