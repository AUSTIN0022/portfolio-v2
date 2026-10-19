'use client'

import { useRef, useState } from 'react'
import { cylinder } from '../iso/iso-kit'
import { Dots, IsoFigure, Line, Plate, Solid } from '../iso/react/draw'
import { LANES, PAD_FRONT, TIP_SHUTTLE, poseAt, readoutOf, stepAt, STEPS, WINNER, type Pose } from './model'
import { AnatomySection, sayIn } from '../scroll'
import { Controls, useDriver, useHoverLoop } from '../driver'
import { sfx } from '../sound'
import {
  BASE_ART, BEAM_ART, BLADE_ART, BUMPER_ART, COLLAR, GAUGE_ART, LANE_ART, SHUTTLE_ART, WALL_ART,
  bumperCoil, gaugeNeedle,
} from './geometry'
import { HEIGHT, P, WIDTH, move } from './view'
import '../iso/iso.css'
import './gate.css'

const LABEL =
  'A lockbox bench with three suitors. Three blades on three lanes slide toward a wall at the same time, each one a delivery of the same payment webhook. A single shuttle on an overhead beam sits at one lane and receives only the first blade to reach it; a lit pin pops up to show the payment is recorded, and a dial gauge counts one. The other two blades meet spring-loaded bumpers, compress them and are pushed back, changing nothing.'

const rest = (by: [number, number, number]) => move(by)
const COLLAR_TOP = COLLAR.z + 2.4

/* ── static art, in painter's order ──────────────────────────────────── */
const BASE = (
  <g>
    <path className="iso-halo" d={BASE_ART.halo} />
    {BASE_ART.feet.map((parts, i) => (
      <g key={i}>
        {parts.map((paths, n) => (
          <Solid key={n} paths={paths} tone={n ? 'mid' : 'lo'} />
        ))}
      </g>
    ))}
    <Solid paths={BASE_ART.slab} tone="mid" />
    <Line d={BASE_ART.groove} tone="lo" />
    <Line d={BASE_ART.screwRings} tone="lo" />
    <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
    <Solid paths={BASE_ART.plate} tone="lo" crease="none" />
    <Line d={BASE_ART.plateLine} tone="faint" />
    <Line d={BASE_ART.plateRule} tone="lo" free />
    <Dots points={BASE_ART.plateScrews} size={0.45} tone="mid" />
    <Solid paths={BASE_ART.strip} tone="lo" crease="none" />
    <Line d={BASE_ART.stripBase} tone="faint" />
    <Line d={BASE_ART.ruleMinor} tone="lo" />
    <Line d={BASE_ART.ruleMajor} tone="mid" />
  </g>
)

const WALL = (
  <g>
    <Solid paths={WALL_ART.capLeft} tone="mid" />
    <Solid paths={WALL_ART.slab} tone="mid" inner={<Line d={WALL_ART.seam} tone="faint" />} />
    <Line d={WALL_ART.seats} tone="lo" />
    <Line d={WALL_ART.seatBores} tone="lo" />
    <Solid paths={WALL_ART.capRight} tone="mid" />
    <Dots points={WALL_ART.capScrews} size={0.45} tone="mid" />
  </g>
)

const laneStatic = (i: number) => (
  <g key={`lane-${i}`}>
    <Solid paths={LANE_ART[i].channel} tone="lo" crease="none" />
    <Line d={LANE_ART[i].channelLine} tone="faint" />
    <Solid paths={LANE_ART[i].railBack} tone="mid" />
    <Solid paths={LANE_ART[i].railFront} tone="mid" />
    <Dots points={LANE_ART[i].railScrews} size={0.4} tone="mid" />
    <Solid paths={LANE_ART[i].stop} tone="mid" />
    <Dots points={LANE_ART[i].stopScrews} size={0.45} tone="mid" />
  </g>
)

const SHUTTLE_BACK = (
  <g>
    <path className="iso-halo gate-shadow" d={SHUTTLE_ART.halo} />
    <Solid paths={SHUTTLE_ART.block} tone="mid" inner={<Line d={SHUTTLE_ART.blockSeam} tone="faint" />} />
    <Line d={SHUTTLE_ART.socketRim} tone="lo" />
    <Line d={SHUTTLE_ART.socket} tone="lo" />
    <Dots points={SHUTTLE_ART.blockScrews} size={0.45} tone="mid" />
    <Solid paths={SHUTTLE_ART.carriage} tone="mid" />
    <Line d={SHUTTLE_ART.carriageLine} tone="faint" />
    <Dots points={SHUTTLE_ART.carriageScrews} size={0.45} tone="mid" />
  </g>
)

const BEAM = (
  <g>
    {BEAM_ART.feet.slice(0, 1).map((paths, i) => (
      <Solid key={i} paths={paths} tone="lo" />
    ))}
    <Dots points={BEAM_ART.footScrews.slice(0, 2)} size={0.45} tone="mid" />
    <Solid paths={BEAM_ART.posts[0]} tone="mid" crease="none" />
    <Line d={BEAM_ART.postRings[0]} tone="faint" />
    <Solid paths={BEAM_ART.collars[0]} tone="mid" />
    <Solid paths={BEAM_ART.beam} tone="mid" />
    <Line d={BEAM_ART.beamRuleBase} tone="faint" />
    <Line d={BEAM_ART.ruler.minor} tone="lo" />
    <Line d={BEAM_ART.ruler.major} tone="mid" />
    <Dots points={BEAM_ART.beamScrews} size={0.5} tone="mid" />
  </g>
)

const FRONT_POST = (
  <g>
    <Solid paths={BEAM_ART.feet[1]} tone="lo" />
    <Dots points={BEAM_ART.footScrews.slice(2)} size={0.45} tone="mid" />
    <Solid paths={BEAM_ART.posts[1]} tone="mid" crease="none" />
    <Line d={BEAM_ART.postRings[1]} tone="faint" />
    <Solid paths={BEAM_ART.collars[1]} tone="mid" />
  </g>
)

const SHUTTLE_FRONT = (
  <g>
    <Solid paths={SHUTTLE_ART.bracket} tone="mid" />
    <Solid paths={SHUTTLE_ART.collar} tone="mid" />
  </g>
)

const bladeArt = (i: number) => (
  <g>
    <Solid paths={BLADE_ART[i].nose} tone="hi" className="gate-nose" />
    <Solid paths={BLADE_ART[i].body} tone="mid" />
    <Line d={BLADE_ART[i].slot} tone="lo" />
    <Dots points={BLADE_ART[i].rivets} size={0.4} tone="lo" />
    {BLADE_ART[i].yokes.map((paths, n) => (
      <Solid key={n} paths={paths} tone="mid" />
    ))}
    <Dots points={BLADE_ART[i].yokeScrews} size={0.4} tone="mid" />
    <Solid paths={BLADE_ART[i].stem} tone="mid" crease="none" />
    <Solid paths={BLADE_ART[i].knob} tone="mid" />
    <Line d={BLADE_ART[i].knobKnurl} tone="lo" />
    <Line d={BLADE_ART[i].mark} tone="hi" />
  </g>
)

const dialArt = (a: typeof GAUGE_ART) => (
  <g>
    <Solid paths={a.stand} tone="lo" />
    <Dots points={a.standScrews} size={0.45} tone="mid" />
    <Solid paths={a.puck} tone="hi" />
    <Line d={a.band} tone="faint" />
    <Line d={a.knurl} tone="faint" />
    <Line d={a.bezel} tone="lo" />
    <Line d={a.face} tone="faint" />
    <Line d={a.minor} tone="lo" />
    <Line d={a.major} tone="mid" />
    <Line d={a.hub} tone="lo" />
  </g>
)

const CAP_ART = cylinder(COLLAR.x, COLLAR.y, 2.9, COLLAR_TOP, 2.2, P, 22, 0.3)
const pinPaths = (lift: number) => (lift > 0.05 ? cylinder(COLLAR.x, COLLAR.y, 1.9, COLLAR_TOP, lift, P, 18) : null)

/**
 * The lockbox bench, posed at u. With `track` it follows the scroll; without,
 * it is a still at `still` (the home-page thumbnail).
 */
export function GateFigure({
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
  const setA = (key: string, name: string, value: string) => {
    const n = el.current[key]
    if (n && n.getAttribute(name) !== value) n.setAttribute(name, value)
  }

  const [busy, setBusy] = useState(false)
  const driver = useDriver(track, (u, prev) => {
    const pose = poseAt(u)
    const was = poseAt(prev)
    for (let i = 0; i < 3; i++) {
      if (i !== WINNER && pose.tips[i] <= PAD_FRONT && was.tips[i] > PAD_FRONT) (sfx.thunk(), sfx.buzz())
      const state = i === WINNER ? (pose.pin > 3 ? 'won' : '') : pose.pads[i] < -1 ? 'hit' : ''
      setA(`blade${i}`, 'data-state', state)
    }
    if (pose.tips[WINNER] <= TIP_SHUTTLE + 0.5 && was.tips[WINNER] > TIP_SHUTTLE + 0.5) sfx.click()
    if (pose.pin > 3 && was.pin <= 3) sfx.chime()
    for (let i = 0; i < 3; i++) {
      setA(`blade${i}`, 'transform', rest([pose.tips[i], 0, 0]))
      setA(`pad${i}`, 'transform', rest([pose.pads[i], 0, 0]))
      const c = bumperCoil(i, pose.pads[i])
      setA(`coilBack${i}`, 'd', c.back)
      setA(`coilFront${i}`, 'd', c.front)
    }
    setA('shuttleBack', 'transform', rest([0, pose.shuttleY, 0]))
    setA('shuttleFront', 'transform', rest([0, pose.shuttleY, 0]))
    setA('cap', 'transform', rest([0, pose.shuttleY, pose.pin]))
    setA('pinGroup', 'transform', rest([0, pose.shuttleY, 0]))
    const pin = pinPaths(pose.pin)
    const group = el.current.pin
    if (group) group.style.opacity = pin ? '1' : '0'
    if (pin) {
      setA('pinFill', 'd', pin.fill)
      pin.shades.forEach((d, n) => setA(`pinShade${n}`, 'd', d))
      setA('pinTop', 'd', pin.top)
      setA('pinEdge', 'd', pin.outline)
    }
    setA('needle', 'd', gaugeNeedle(pose.gauge))
    sayIn(root.current, readoutOf(u))
    const s = stepAt(u)
    if (s !== step.current) {
      step.current = s
      onStep?.(s)
    }
  }, still)
  useHoverLoop(root, driver, still, 7, bare)

  const deliver = () => {
    setBusy(true)
    driver.current.set(0)
    driver.current.play(0.88, 4.6, () => setBusy(false))
  }
  const reset = () => driver.current.play(driver.current.at() > 0.5 ? 1 : 0, 1.2, () => driver.current.set(0))

  const p0: Pose = poseAt(still)
  const pin0 = pinPaths(p0.pin)
  const coil0 = [0, 1, 2].map((i) => bumperCoil(i, p0.pads[i]))

  const svg = (
    <IsoFigure width={WIDTH} height={HEIGHT} label={LABEL}>
      {BASE}
      {WALL}
      {LANES.map((_, i) => (
        <g key={i}>
          {laneStatic(i)}
          <path ref={bind(`coilBack${i}`)} className="iso-line gate-coil" data-tone="lo" d={coil0[i].back} />
          <Solid paths={BUMPER_ART[i].rod} tone="mid" crease="none" />
          <path ref={bind(`coilFront${i}`)} className="iso-line gate-coil" data-tone="mid" d={coil0[i].front} />
          <g ref={bind(`pad${i}`)} transform={rest([p0.pads[i], 0, 0])}>
            <Solid paths={BUMPER_ART[i].pad} tone="mid" />
            <Line d={BUMPER_ART[i].padFace} tone="lo" />
          </g>
        </g>
      ))}
      {BEAM}
      <g ref={bind('shuttleBack')} transform={rest([0, p0.shuttleY, 0])}>
        {SHUTTLE_BACK}
      </g>
      {FRONT_POST}
      {LANES.map((_, i) => (
        <g key={`b${i}`} ref={bind(`blade${i}`)} transform={rest([p0.tips[i], 0, 0])} data-winner={i === WINNER ? '' : undefined}>
          {bladeArt(i)}
        </g>
      ))}
      <g ref={bind('shuttleFront')} transform={rest([0, p0.shuttleY, 0])}>
        {SHUTTLE_FRONT}
      </g>
      <g ref={bind('pinGroup')} transform={rest([0, p0.shuttleY, 0])}>
        <g ref={bind('pin')} className="iso-solid" data-lit="" style={{ opacity: pin0 ? 1 : 0 }}>
          <path ref={bind('pinFill')} className="iso-fill" d={pin0?.fill ?? ''} />
          {[0, 1, 2, 3].map((n) => (
            <path key={n} ref={bind(`pinShade${n}`)} className="iso-shade" data-shade={n} d={pin0?.shades[n] ?? ''} />
          ))}
          <path ref={bind('pinTop')} className="iso-top" d={pin0?.top ?? ''} />
          <path ref={bind('pinEdge')} className="iso-line iso-edge" data-tone="hi" d={pin0?.outline ?? ''} />
        </g>
      </g>
      <g ref={bind('cap')} transform={rest([0, p0.shuttleY, p0.pin])}>
        <Solid paths={CAP_ART} tone="hi" lit />
      </g>
      {dialArt(GAUGE_ART)}
      <path ref={bind('needle')} className="iso-line gate-needle" data-tone="lit" d={gaugeNeedle(p0.gauge)} />
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
        title="One payment, three deliveries"
        hint="Scroll, or click it"
        readout={readoutOf(still)}
        keys={[
          { mark: 'lit', label: 'Recorded — the pin' },
          { mark: 'raised', label: 'A webhook delivery' },
        ]}
      >
        <div className="bench-hit" onClick={() => !busy && deliver()} title="Deliver three times">
          {svg}
        </div>
        <Controls
          actions={[
            { label: 'Deliver ×3', run: deliver, disabled: busy },
            { label: 'Reset', run: reset, disabled: busy },
          ]}
        />
      </Plate>
    </div>
  )
}

export function GateSection() {
  return (
    <AnatomySection
      kicker="Anatomy · exactly once"
      title="One payment, three deliveries"
      label="How a payment webhook is recorded exactly once"
      steps={STEPS}
      figure={(track, onStep) => <GateFigure track={track} onStep={onStep} />}
    />
  )
}
