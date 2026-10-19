import { circleRing, coil, cylinder, extrude, insetPlan, knurl, lineOnTop, onTop, pathOf, planOutline, radialTicks, ringOf, ringSeam, rise, segment, sideArc, sideRing, slabOf, topTicks, type Flat, type Plan, type Plane } from '../iso/iso-kit'
import { LANES } from './model'
import { BASE, BASE_H, BLADE_LEN, BLADE_Z, BEAM, BEAM_Z, BLOCK_H, BLOCK_Z, DIAL, DIAL_TOP, DIAL_Z, DIAL_H, FOOT_H, LANE_X0, LANE_X1, P, PAD_X0, POST_Y, ROD_Z, SHUTTLE_X, TIMER, WALL, WALL_FACE, WALL_H, at } from './view'
import { PAD_FRONT } from './model'

const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel)
const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 28, bevel = 0) => cylinder(cx, cy, r, z, h, P, steps, bevel)
const ring = (cx: number, cy: number, r: number, z: number, steps = 32) => onTop(circleRing(cx, cy, r, steps), z, P, true)
const join = (parts: string[]) => parts.join('')

/* ── Base: plate on feet, groove, screws, label plate, ruler strip ─────── */
const FEET: Plane[] = [
  [BASE.x + 20, BASE.y + 18],
  [BASE.x + BASE.w - 20, BASE.y + 18],
  [BASE.x + 20, BASE.y + BASE.d - 18],
  [BASE.x + BASE.w - 20, BASE.y + BASE.d - 18],
]
const BASE_SCREWS: Plane[] = [
  [BASE.x + 8, BASE.y + 8],
  [BASE.x + BASE.w - 8, BASE.y + 8],
  [BASE.x + 8, BASE.y + BASE.d - 8],
  [BASE.x + BASE.w - 8, BASE.y + BASE.d - 8],
]
const PLATE: Plan = { x: BASE.x + 22, y: BASE.y + BASE.d - 24, w: 58, d: 12, r: 2 }
const STRIP: Plan = { x: BASE.x + 100, y: BASE.y + BASE.d - 21, w: 190, d: 7, r: 1 }
const RULER = topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.4, 0.6, [2, 3.6], P)

export const BASE_ART = {
  halo: solid(BASE, -BASE_H - FOOT_H, BASE_H, 8).fill,
  feet: FEET.map(([x, y]) => [cyl(x, y, 7, -BASE_H - FOOT_H, 1.6), cyl(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6)]),
  slab: solid(BASE, -BASE_H, BASE_H, 8, 1.6),
  groove: planOutline(insetPlan(BASE, 4.5), 0, P),
  screwRings: join(BASE_SCREWS.map(([x, y]) => ring(x, y, 2.2, 0, 16))),
  screws: BASE_SCREWS.map(([x, y]) => at([x, y, 0])),
  plate: solid(PLATE, 0, 0.8, 4),
  plateLine: planOutline(insetPlan(PLATE, 1.6), 0.8, P),
  plateRule: join([0, 1, 2].map((row) => lineOnTop([PLATE.x + 8, PLATE.y + 3.6 + row * 2.2], [PLATE.x + (row === 1 ? 32 : 44), PLATE.y + 3.6 + row * 2.2], 0.8, P))),
  plateScrews: [at([PLATE.x + 3.5, PLATE.y + PLATE.d / 2, 0.8]), at([PLATE.x + PLATE.w - 3.5, PLATE.y + PLATE.d / 2, 0.8])],
  strip: solid(STRIP, 0, 0.6, 3),
  stripBase: lineOnTop([STRIP.x + 4, STRIP.y + 0.4], [STRIP.x + STRIP.w - 4, STRIP.y + 0.4], 0.6, P),
  ruleMinor: RULER.minor,
  ruleMajor: RULER.major,
}

/* ── Lanes: a channel and two rails each, with an end stop ────────────── */
export const LANE_ART = LANES.map((y) => {
  const channel: Plan = { x: LANE_X0, y: y - 8, w: LANE_X1 - LANE_X0, d: 16, r: 2 }
  const stop: Plan = { x: LANE_X1 - 2, y: y - 12, w: 6, d: 24, r: 1.2 }
  return {
    channel: solid(channel, 0, 1.2, 3),
    channelLine: planOutline(insetPlan(channel, 2), 1.2, P, 3),
    railBack: solid({ x: LANE_X0, y: y - 11.5, w: LANE_X1 - LANE_X0 - 2, d: 3, r: 1 }, 0, 3.2, 3, 0.4),
    railFront: solid({ x: LANE_X0, y: y + 8.5, w: LANE_X1 - LANE_X0 - 2, d: 3, r: 1 }, 0, 3.2, 3, 0.4),
    railScrews: [0, 1, 2, 3, 4].flatMap((n) => [at([LANE_X0 + 14 + n * 30, y - 10, 3.2]), at([LANE_X0 + 14 + n * 30, y + 10, 3.2])]),
    stop: solid(stop, 0, 8, 3, 0.5),
    stopScrews: [at([stop.x + 3, y - 6, 8]), at([stop.x + 3, y + 6, 8])],
  }
})

/* ── The wall the losers meet, with a seat for each bumper ────────────── */
const WALL_RING = ringOf(WALL, 3)
export const WALL_ART = {
  slab: solid(WALL, 0, WALL_H, 3, 0.8),
  seam: ringSeam(WALL_RING, 15, P),
  seats: join(LANES.map((y) => sideRing([WALL_FACE, y, ROD_Z], 5.2, 'x', P, 22))),
  seatBores: join(LANES.map((y) => sideRing([WALL_FACE, y, ROD_Z], 2.4, 'x', P, 16))),
  capLeft: solid({ x: WALL.x - 2, y: WALL.y - 4, w: WALL.w + 4, d: 6, r: 1.2 }, 0, WALL_H + 3, 3, 0.6),
  capRight: solid({ x: WALL.x - 2, y: WALL.y + WALL.d - 2, w: WALL.w + 4, d: 6, r: 1.2 }, 0, WALL_H + 3, 3, 0.6),
  capScrews: [at([WALL_FACE + 2, WALL.y + WALL.d + 4, WALL_H + 3]), at([WALL_FACE + 2, WALL.y - 4, WALL_H + 3])],
}

/* ── Bumpers: a rod from the wall, a pad on it, a spring between ──────── */
const ROD_END = PAD_FRONT + 1
export const BUMPER_ART = LANES.map((y) => ({
  rod: solid({ x: WALL_FACE, y: y - 1.4, w: ROD_END - WALL_FACE, d: 2.8, r: 1 }, ROD_Z - 1.4, 2.8, 2),
  pad: solid({ x: PAD_X0, y: y - 6, w: 5, d: 12, r: 1.5 }, BLADE_Z, 7.4, 3, 0.4),
  padFace: lineOnTop([PAD_X0 + 1, y - 3.5], [PAD_X0 + 1, y + 3.5], BLADE_Z + 7.4, P),
}))
/** The spring is rebuilt each frame as the pad pushes it in. */
export const bumperCoil = (lane: number, dx: number) => coil(WALL_FACE + 0.4, PAD_X0 + dx, [LANES[lane], ROD_Z], 3.6, 5, 'x', P)

/* ── A blade (a submit): built with its nose at x = 0, moved along x ──── */
const NOSE_X = -7
export const BLADE_ART = LANES.map((y) => {
  const body: Plan = { x: 0, y: y - 5.5, w: BLADE_LEN, d: 11, r: 2 }
  const nose: Plan = { x: NOSE_X, y: y - 3.6, w: 9, d: 7.2, r: 1.6 }
  const yokes: Plan[] = [8, 42].map((x) => ({ x, y: y - 8, w: 10, d: 16, r: 1.6 }))
  return {
    nose: solid(nose, BLADE_Z, 4.4, 3, 0.4),
    body: solid(body, BLADE_Z, 5, 4, 0.6),
    slot: planOutline({ x: 4, y: y - 1.6, w: 7, d: 3.2, r: 1.5 }, BLADE_Z + 5, P, 4),
    rivets: [16, 24, 32].map((x) => at([x, y, BLADE_Z + 5])),
    yokes: yokes.map((plan) => solid(plan, BLADE_Z, 6.4, 3, 0.4)),
    yokeScrews: yokes.flatMap((plan) => [at([plan.x + 3, plan.y + 2.6, BLADE_Z + 6.4]), at([plan.x + 7, plan.y + 2.6, BLADE_Z + 6.4])]),
    knob: cyl(BLADE_LEN + 5, y, 3.4, BLADE_Z, 5.4, 22, 0.3),
    knobKnurl: knurl(BLADE_LEN + 5, y, 3.4, BLADE_Z, BLADE_Z + 5.4, 18, P),
    stem: solid({ x: BLADE_LEN - 2, y: y - 1.6, w: 4, d: 3.2, r: 1 }, BLADE_Z, 4, 2),
    mark: lineOnTop([BLADE_LEN + 2.6, y], [BLADE_LEN + 7.4, y], BLADE_Z + 5.4, P),
  }
})

/* ── The shuttle: overhead beam on two posts, a carriage, a hanging socket ── */
const POST_X = BEAM.x + BEAM.w / 2
export const BEAM_ART = {
  feet: [-POST_Y, POST_Y].map((y) => solid({ x: POST_X - 8, y: y - 8, w: 16, d: 16, r: 2.5 }, 0, 2, 4)),
  footScrews: [-POST_Y, POST_Y].flatMap((y) => [at([POST_X - 6, y, 2]), at([POST_X + 6, y, 2])]),
  posts: [-POST_Y, POST_Y].map((y) => cyl(POST_X, y, 4.6, 2, BEAM_Z - 2, 28)),
  postRings: [-POST_Y, POST_Y].map((y) => join([sideArc(POST_X, y, 4.6, 8, P, 16), sideArc(POST_X, y, 4.6, BEAM_Z - 6, P, 16)])),
  collars: [-POST_Y, POST_Y].map((y) => cyl(POST_X, y, 6, BEAM_Z - 3, 3, 28)),
  beam: solid(BEAM, BEAM_Z, 6, 4, 0.8),
  beamRuleBase: lineOnTop([BEAM.x + 3, BEAM.y + BEAM.d - 14], [BEAM.x + BEAM.w - 3, BEAM.y + BEAM.d - 14], BEAM_Z + 6, P),
  ruler: (() => {
    const t = topTicks(BEAM.y + 12, BEAM.y + BEAM.d - 12, 6, 5, BEAM.x + BEAM.w - 5, BEAM_Z + 6, [1.6, 3.2], P, 'y')
    return t
  })(),
  beamScrews: [-POST_Y, POST_Y].map((y) => at([POST_X, y, BEAM_Z + 6])),
}

const CAR: Plan = { x: SHUTTLE_X.from - 5, y: -13, w: SHUTTLE_X.to - SHUTTLE_X.from + 10, d: 26, r: 2.5 }
const BLOCK: Plan = { x: SHUTTLE_X.from, y: -10, w: SHUTTLE_X.to - SHUTTLE_X.from, d: 20, r: 2 }
const BLOCK_TOP = BLOCK_Z + BLOCK_H
const BRACKET: Plan = { x: SHUTTLE_X.to, y: -5, w: 14, d: 10, r: 1.6 }
const BRACKET_Z = 12
export const COLLAR = { x: SHUTTLE_X.to + 7, y: 0, z: BRACKET_Z + 4 }
/** Built at lane y = 0 and moved along y by the model. */
export const SHUTTLE_ART = {
  halo: solid(BLOCK, BLOCK_Z, BLOCK_H, 4).fill,
  block: solid(BLOCK, BLOCK_Z, BLOCK_H, 4, 0.8),
  socket: sideRing([SHUTTLE_X.to, 0, BLADE_Z + 2.4], 3.6, 'x', P, 20),
  socketRim: sideRing([SHUTTLE_X.to, 0, BLADE_Z + 2.4], 5, 'x', P, 22),
  blockSeam: ringSeam(ringOf(BLOCK, 4), BLOCK_Z + 11, P),
  blockScrews: [at([SHUTTLE_X.to, -7, BLOCK_TOP - 3]), at([SHUTTLE_X.to, 7, BLOCK_TOP - 3])],
  carriage: solid(CAR, BEAM_Z + 6, 4, 4, 0.6),
  carriageLine: planOutline(insetPlan(CAR, 2), BEAM_Z + 10, P, 4),
  carriageScrews: [at([CAR.x + 3, CAR.y + 3, BEAM_Z + 10]), at([CAR.x + CAR.w - 3, CAR.y + CAR.d - 3, BEAM_Z + 10])],
  bracket: solid(BRACKET, BRACKET_Z, 4, 3, 0.4),
  collar: cyl(COLLAR.x, COLLAR.y, 3.4, BRACKET_Z + 4, 2.4, 22),
}
/** The held-key indicator pin and its cap: lit, the one thing to watch. Built at its lowest. */
export const PIN_ART = {
  pin: cyl(COLLAR.x, COLLAR.y, 1.9, COLLAR.z + 2.4 - 6, 6, 18),
  cap: cyl(COLLAR.x, COLLAR.y, 2.9, COLLAR.z + 2.4, 2.2, 22, 0.3),
}
export const pinPath = (lift: number) => pathOf([at([COLLAR.x, COLLAR.y, COLLAR.z + 2.4 + lift])])

/* ── Dial gauge and TTL timer, face up ────────────────────────────────── */
function dial(c: { x: number; y: number; r: number }, every: number, count: number, span: number, from: number) {
  const t = radialTicks(c.x, c.y, c.r - 3, count, every, DIAL_TOP, [1.3, 2.8], P, from, span)
  return {
    stand: solid({ x: c.x - c.r - 4, y: c.y - c.r - 4, w: c.r * 2 + 8, d: c.r * 2 + 8, r: 5 }, 0, DIAL_Z, 6, 0.6),
    standScrews: [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => at([c.x + sx * (c.r + 1), c.y + sy * (c.r + 1), DIAL_Z])),
    puck: cyl(c.x, c.y, c.r, DIAL_Z, DIAL_H, 56, 0.8),
    band: sideArc(c.x, c.y, c.r, DIAL_TOP - 3.4, P, 32),
    knurl: knurl(c.x, c.y, c.r, DIAL_TOP - 3.4, DIAL_TOP, 72, P, 0.3),
    bezel: ring(c.x, c.y, c.r - 2.2, DIAL_TOP, 56),
    face: ring(c.x, c.y, c.r - 8.5, DIAL_TOP, 40),
    minor: t.minor,
    major: t.major,
    hub: ring(c.x, c.y, 1.6, DIAL_TOP, 16),
  }
}
// Gauge: 0 – 3 scored, spread over 270°. Timer: ten ticks round a full turn.
export const GAUGE_SPAN = (Math.PI * 3) / 2
export const GAUGE_FROM = -Math.PI * 0.75
export const GAUGE_ART = dial(DIAL, 1, 3, GAUGE_SPAN, GAUGE_FROM)
export const TIMER_ART = dial(TIMER, 1, 10, Math.PI * 2, 0)
const needle = (c: { x: number; y: number; r: number }, angle: number, length: number): string => {
  const sx = Math.sin(angle)
  const sy = -Math.cos(angle)
  return lineOnTop([c.x - sx * 3.5, c.y - sy * 3.5], [c.x + sx * length, c.y + sy * length], DIAL_TOP + 0.2, P)
}
export const gaugeNeedle = (reading: number) => needle(DIAL, GAUGE_FROM + (reading / 3) * GAUGE_SPAN, DIAL.r - 5)
export const timerArm = (angle: number) => needle(TIMER, angle, TIMER.r - 4.5)

/** Where a blade rests, as a dotted outline: the home position of lane i. */
export const HOME_MARK = (i: number) => planOutline({ x: 40, y: LANES[i] - 5.5, w: BLADE_LEN, d: 11, r: 2 }, BLADE_Z, P, 4)

export type { Flat }
export { extrude, rise, segment }
