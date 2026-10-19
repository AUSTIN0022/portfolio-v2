import { iso, translateAlong, type Flat, type Plan, type Point3, type Projection } from '../iso/iso-kit'
import { LANES } from './model'

export const WIDTH = 640
export const HEIGHT = 350
const PAD = 26
export const AZIMUTH = 38

export const BASE: Plan = { x: -150, y: -90, w: 322, d: 180, r: 10 }
export const BASE_H = 9
export const FOOT_H = 5

export const LANE_X0 = -34
export const LANE_X1 = 112
export const BLADE_Z = 2.4
export const BLADE_LEN = 64

export const WALL: Plan = { x: -42, y: -72, w: 9, d: 144, r: 2 }
export const WALL_FACE = WALL.x + WALL.w
export const WALL_H = 30

export const ROD_Z = 5.4
export const PAD_X0 = -23

export const SHUTTLE_X = { from: -10, to: 10 }
export const BLOCK_Z = 2
export const BLOCK_H = 22
export const BEAM_Z = 22
export const BEAM: Plan = { x: -9, y: -76, w: 12, d: 152, r: 2 }
export const POST_Y = 70

export const DIAL = { x: 138, y: -34, r: 15 }
export const TIMER = { x: 138, y: 30, r: 15 }
export const DIAL_Z = 3
export const DIAL_H = 8
export const DIAL_TOP = DIAL_Z + DIAL_H

function fit(points: Point3[]): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH }
  const flat = points.map((p) => iso(p, unit))
  const xs = flat.map(([x]) => x)
  const ys = flat.map(([, y]) => y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const up = Math.min(...ys)
  const down = Math.max(...ys)
  const scale = Math.min((WIDTH - PAD * 2) / (right - left), (HEIGHT - PAD * 2) / (down - up))
  return { origin: [WIDTH / 2 - ((left + right) / 2) * scale, HEIGHT / 2 - ((up + down) / 2) * scale], scale, azimuth: AZIMUTH }
}

const box = ({ x, y, w, d }: Plan, z0: number, z1: number): Point3[] => {
  const out: Point3[] = []
  for (const px of [x, x + w]) for (const py of [y, y + d]) for (const z of [z0, z1]) out.push([px, py, z])
  return out
}

export const P = fit([...box(BASE, -BASE_H - FOOT_H, 0), ...box(BEAM, BEAM_Z, BEAM_Z + 12), ...box(WALL, 0, WALL_H)])

export const at = (p: Point3) => iso(p, P)
export const lane = (i: number) => LANES[i]
export const move = (by: Point3) => translateAlong(P, by)
export type { Flat }
