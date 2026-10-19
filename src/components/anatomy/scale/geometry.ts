import { circleRing, cylinder, iso, knurl, lineOnTop, onTop, pathOf, planOutline, insetPlan, ringOf, ringSeam, slabOf, translateAlong, depthOf, type Flat, type Plan, type Point3, type Projection } from '../iso/iso-kit'
import { frontText, type DialSpec } from '../shared'
import { BAYS } from './model'

/*
 * Eight blade servers stand in a row of bays against a back plate; the ones
 * that are off are pulled forward on their rails. In front of them sits the
 * load balancer, cabled along the floor to every bay: its face shows the
 * live connections, and requests run down the cables to the servers.
 */

export const WIDTH = 640
export const HEIGHT = 380
const PAD = 20
const AZIMUTH = 40

export const BASE: Plan = { x: -150, y: -74, w: 316, d: 180, r: 10 }
export const BASE_H = 9
export const FOOT_H = 5

const PITCH = 24
const SW = 18
const SD = 44
const SZ = 2
const SH = 30
const STOP = SZ + SH
const FRONT = -2
export const PULL = 38
const BAY_X = (i: number) => -112 + i * PITCH
const BACK: Plan = { x: -120, y: -58, w: 204, d: 6, r: 1.5 }

/* load balancer, at the front */
const LB: Plan = { x: -74, y: 54, w: 92, d: 26, r: 3 }
const LB_Z = 2
const LB_H = 16
const LB_FRONT = LB.y + LB.d
const lbPortX = (i: number) => LB.x + 10 + i * 10.4

const BOX: Plan = { x: 100, y: 34, w: 44, d: 26, r: 3 }
const SLOT_Y = BOX.y + 13
const KNOB_X = 109
export const KNOB_TRAVEL = 22
export const PARTICIPANTS: DialSpec = { x: 122, y: -46, r: 15, z: 3, h: 8, count: 15, every: 2, span: (Math.PI * 3) / 2, from: -Math.PI * 0.75 }
export const INSTANCES: DialSpec = { x: 122, y: -6, r: 15, z: 3, h: 8, count: 7, every: 1, span: (Math.PI * 3) / 2, from: -Math.PI * 0.75 }

function fit(points: Point3[]): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH }
  const flat = points.map((p) => iso(p, unit))
  const xs = flat.map(([x]) => x)
  const ys = flat.map(([, y]) => y)
  const scale = Math.min((WIDTH - PAD * 2) / (Math.max(...xs) - Math.min(...xs)), (HEIGHT - PAD * 2) / (Math.max(...ys) - Math.min(...ys)))
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
export const P = fit([...box(BASE, -BASE_H - FOOT_H, 0), ...box(BACK, 0, 50)])
export const at = (p: Point3) => iso(p, P)
export const move = (by: Point3) => translateAlong(P, by)
const solid = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) => slabOf(plan, z, h, P, steps, bevel)
const face = (pts: [number, number][], y: number): string => pathOf(pts.map(([x, z]) => at([x, y, z])), true)

export const BACK_ART = {
  plate: solid(BACK, 0, 50, 3, 0.8),
  seam: ringSeam(ringOf(BACK, 3), 25, P),
  screws: Array.from({ length: BAYS }, (_, i) => at([BAY_X(i) + SW / 2, BACK.y + BACK.d, 45])),
}

export const RAILS = Array.from({ length: BAYS }, (_, i) => {
  const x = BAY_X(i)
  return [solid({ x: x + 1, y: -46, w: 2.4, d: SD + PULL + 2, r: 0.8 }, 0, SZ, 2), solid({ x: x + SW - 3.4, y: -46, w: 2.4, d: SD + PULL + 2, r: 0.8 }, 0, SZ, 2)]
})

/** A server, built racked; the live code slides it out along +y by PULL × (1 − racked). */
export const SERVERS = Array.from({ length: BAYS }, (_, i) => {
  const x = BAY_X(i)
  const plan: Plan = { x, y: FRONT - SD, w: SW, d: SD, r: 2 }
  return {
    halo: solid(plan, SZ, SH).fill,
    body: solid(plan, SZ, SH, 4, 0.6),
    panel: face([[x + 2, SZ + 3], [x + SW - 2, SZ + 3], [x + SW - 2, STOP - 3], [x + 2, STOP - 3]], FRONT),
    vents: [0, 1, 2].map((n) => face([[x + 3.5, STOP - 9 - n * 3.4], [x + 9, STOP - 9 - n * 3.4], [x + 9, STOP - 7.6 - n * 3.4], [x + 3.5, STOP - 7.6 - n * 3.4]], FRONT)).join(''),
    window: face([[x + 11.5, SZ + 9], [x + 14.5, SZ + 9], [x + 14.5, STOP - 7], [x + 11.5, STOP - 7]], FRONT),
    port: face([[x + 7, SZ + 3.6], [x + 11, SZ + 3.6], [x + 11, SZ + 7], [x + 7, SZ + 7]], FRONT),
    handle: solid({ x: x + 2.5, y: FRONT, w: 3, d: 2.2, r: 0.6 }, SZ + 9, 8, 2),
    topVents: [0, 1, 2].map((n) => lineOnTop([x + 5 + n * 4, FRONT - SD + 8], [x + 5 + n * 4, FRONT - 8], STOP, P)).join(''),
    led: at([x + 4, FRONT, SZ + 5.3]),
    text: frontText(x + SW / 2, FRONT, STOP - 4.6, P),
    centre: [x + SW / 2, FRONT - SD / 2, SZ + SH / 2] as Point3,
  }
})
/** The load window's fill on a server's face, for a share of 0 – 1, at pull offset dy. */
export function loadFill(i: number, load: number, dy: number): string {
  const x = BAY_X(i)
  const z0 = SZ + 9.6
  const z1 = z0 + (STOP - 7.6 - z0) * Math.min(1, load)
  if (z1 - z0 < 0.2) return ''
  return face([[x + 12, z0], [x + 14, z0], [x + 14, z1], [x + 12, z1]], FRONT + dy)
}

/* Cables: from the load balancer's back along the floor, up each bay, to the server's port. */
function polyLen(pts: Flat[]) {
  let L = 0
  for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
  return L
}
export const CABLES = Array.from({ length: BAYS }, (_, i) => {
  const cx = BAY_X(i) + 9
  const floor: Point3[] = [
    [lbPortX(i), LB.y + 2, 1.2],
    [lbPortX(i), LB.y - 5, 1.2],
    [cx, LB.y - 14, 1.2],
    [cx, FRONT + 0.8, 1.2],
  ]
  const riser: Point3[] = [
    [cx, FRONT + 0.8, 1.2],
    [cx, FRONT + 0.8, SZ + 5.3],
  ]
  const route = [...floor, riser[1]].map(at)
  return {
    floor: pathOf(floor.map(at)),
    riser: pathOf(riser.map(at)),
    end: at(riser[1]),
    route,
    length: polyLen(route),
  }
})
/** A point a share t (0 – 1) along cable i, on screen. */
export function along(i: number, t: number): Flat {
  const { route, length } = CABLES[i]
  let left = t * length
  for (let k = 1; k < route.length; k++) {
    const a = route[k - 1]
    const b = route[k]
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (left <= seg) return [a[0] + ((b[0] - a[0]) * left) / seg, a[1] + ((b[1] - a[1]) * left) / seg]
    left -= seg
  }
  return route[route.length - 1]
}

export const LB_ART = {
  halo: solid(LB, LB_Z, LB_H).fill,
  feet: [LB.x + 8, LB.x + LB.w - 8].map((x) => solid({ x: x - 4, y: LB.y + 3, w: 8, d: LB.d - 6, r: 1 }, 0, LB_Z, 2)),
  body: solid(LB, LB_Z, LB_H, 5, 0.8),
  seam: ringSeam(ringOf(LB, 5), LB_Z + LB_H / 2 + 1, P),
  bezel: face([[LB.x + 3, LB_Z + 2.4], [LB.x + LB.w - 3, LB_Z + 2.4], [LB.x + LB.w - 3, LB_Z + LB_H - 2.4], [LB.x + 3, LB_Z + LB_H - 2.4]], LB_FRONT),
  display: face([[LB.x + 8, LB_Z + 5], [LB.x + 40, LB_Z + 5], [LB.x + 40, LB_Z + LB_H - 4], [LB.x + 8, LB_Z + LB_H - 4]], LB_FRONT),
  text: frontText(LB.x + 24, LB_FRONT, LB_Z + 7.6, P),
  portLeds: Array.from({ length: BAYS }, (_, i) => at([LB.x + 48 + i * 5, LB_FRONT, LB_Z + 10.5])),
  portMarks: Array.from({ length: BAYS }, (_, i) => face([[LB.x + 46.6 + i * 5, LB_Z + 4.4], [LB.x + 49.4 + i * 5, LB_Z + 4.4], [LB.x + 49.4 + i * 5, LB_Z + 7.4], [LB.x + 46.6 + i * 5, LB_Z + 7.4]], LB_FRONT)).join(''),
  topVents: Array.from({ length: 7 }, (_, k) => planOutline({ x: LB.x + 10 + k * 11, y: LB.y + 5, w: 5, d: LB.d - 10, r: 2.4 }, LB_Z + LB_H, P, 3)).join(''),
  screws: [at([LB.x + 3, LB.y + 3, LB_Z + LB_H]), at([LB.x + LB.w - 3, LB.y + LB.d - 3, LB_Z + LB_H])],
}

export const BOX_ART = {
  box: solid(BOX, 0, 12, 5, 0.8),
  seam: ringSeam(ringOf(BOX, 5), 6, P),
  slot: planOutline({ x: KNOB_X - 4, y: SLOT_Y - 2.2, w: KNOB_TRAVEL + 8, d: 4.4, r: 2.2 }, 12, P, 4),
  stops: [onTop(circleRing(KNOB_X, SLOT_Y + 7, 1.4, 12), 12, P, true), onTop(circleRing(KNOB_X + KNOB_TRAVEL, SLOT_Y + 7, 1.4, 12), 12, P, true)].join(''),
  screws: [at([BOX.x + 3.5, BOX.y + 3.5, 12]), at([BOX.x + BOX.w - 3.5, BOX.y + BOX.d - 3.5, 12])],
}
export const KNOB_ART = {
  knob: cylinder(KNOB_X, SLOT_Y, 4, 12, 5, P, 24, 0.4),
  knurl: knurl(KNOB_X, SLOT_Y, 4, 12, 17, 20, P),
  mark: lineOnTop([KNOB_X - 2.4, SLOT_Y], [KNOB_X + 2.4, SLOT_Y], 17, P),
}

export { insetPlan, depthOf }
