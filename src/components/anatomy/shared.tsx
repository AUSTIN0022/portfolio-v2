import { circleRing, cylinder, insetPlan, knurl, lineOnTop, onTop, planOutline, radialTicks, sideArc, slabOf, topTicks, iso, type Flat, type Plan, type Plane, type Projection } from './iso/iso-kit'
import { Dots, Line, Solid } from './iso/react/draw'

/*
 * Parts every bench shares: the base plate on its feet, with a groove,
 * corner screws, a label plate and a ruler strip; and a face-up dial.
 */

export function baseArt(base: Plan, h: number, foot: number, P: Projection) {
  const at = (p: [number, number, number]) => iso(p, P)
  const ring = (cx: number, cy: number, r: number, z: number, steps = 16) => onTop(circleRing(cx, cy, r, steps), z, P, true)
  const feet: Plane[] = [
    [base.x + 20, base.y + 18],
    [base.x + base.w - 20, base.y + 18],
    [base.x + 20, base.y + base.d - 18],
    [base.x + base.w - 20, base.y + base.d - 18],
  ]
  const screws: Plane[] = [
    [base.x + 8, base.y + 8],
    [base.x + base.w - 8, base.y + 8],
    [base.x + 8, base.y + base.d - 8],
    [base.x + base.w - 8, base.y + base.d - 8],
  ]
  const plate: Plan = { x: base.x + 22, y: base.y + base.d - 24, w: 58, d: 12, r: 2 }
  const strip: Plan = { x: base.x + 100, y: base.y + base.d - 21, w: Math.min(190, base.w - 130), d: 7, r: 1 }
  const ruler = topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.4, 0.6, [2, 3.6], P)
  return (
    <g>
      <path className="iso-halo" d={slabOf(base, -h - foot, h, P, 8).fill} />
      {feet.map(([x, y], i) => (
        <g key={i}>
          <Solid paths={cylinder(x, y, 7, -h - foot, 1.6, P, 28)} tone="lo" />
          <Solid paths={cylinder(x, y, 5.4, -h - foot + 1.6, foot - 1.6, P, 28)} tone="mid" />
        </g>
      ))}
      <Solid paths={slabOf(base, -h, h, P, 8, 1.6)} tone="mid" />
      <Line d={planOutline(insetPlan(base, 4.5), 0, P)} tone="lo" />
      <Line d={screws.map(([x, y]) => ring(x, y, 2.2, 0)).join('')} tone="lo" />
      <Dots points={screws.map(([x, y]) => at([x, y, 0]))} size={0.5} tone="mid" />
      <Solid paths={slabOf(plate, 0, 0.8, P, 4)} tone="lo" crease="none" />
      <Line d={planOutline(insetPlan(plate, 1.6), 0.8, P)} tone="faint" />
      <Line
        d={[0, 1, 2].map((row) => lineOnTop([plate.x + 8, plate.y + 3.6 + row * 2.2], [plate.x + (row === 1 ? 32 : 44), plate.y + 3.6 + row * 2.2], 0.8, P)).join('')}
        tone="lo"
        free
      />
      <Dots points={[at([plate.x + 3.5, plate.y + plate.d / 2, 0.8]), at([plate.x + plate.w - 3.5, plate.y + plate.d / 2, 0.8])]} size={0.45} tone="mid" />
      <Solid paths={slabOf(strip, 0, 0.6, P, 3)} tone="lo" crease="none" />
      <Line d={lineOnTop([strip.x + 4, strip.y + 0.4], [strip.x + strip.w - 4, strip.y + 0.4], 0.6, P)} tone="faint" />
      <Line d={ruler.minor} tone="lo" />
      <Line d={ruler.major} tone="mid" />
    </g>
  )
}

export interface DialSpec {
  x: number
  y: number
  r: number
  z: number
  h: number
  count: number
  every: number
  span: number
  from: number
}

export function dialArt(c: DialSpec, P: Projection) {
  const at = (p: [number, number, number]) => iso(p, P)
  const top = c.z + c.h
  const ring = (r: number, steps = 48) => onTop(circleRing(c.x, c.y, r, steps), top, P, true)
  const t = radialTicks(c.x, c.y, c.r - 3, c.count, c.every, top, [1.3, 2.8], P, c.from, c.span)
  const stand: Plan = { x: c.x - c.r - 4, y: c.y - c.r - 4, w: c.r * 2 + 8, d: c.r * 2 + 8, r: 5 }
  return (
    <g>
      <Solid paths={slabOf(stand, 0, c.z, P, 6, 0.6)} tone="lo" />
      <Dots points={[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => at([c.x + sx * (c.r + 1), c.y + sy * (c.r + 1), c.z]))} size={0.45} tone="mid" />
      <Solid paths={cylinder(c.x, c.y, c.r, c.z, c.h, P, 56, 0.8)} tone="hi" />
      <Line d={sideArc(c.x, c.y, c.r, top - 3.4, P, 32)} tone="faint" />
      <Line d={knurl(c.x, c.y, c.r, top - 3.4, top, 72, P, 0.3)} tone="faint" />
      <Line d={ring(c.r - 2.2, 56)} tone="lo" />
      <Line d={ring(c.r - 8.5, 40)} tone="faint" />
      <Line d={t.minor} tone="lo" />
      <Line d={t.major} tone="mid" />
      <Line d={ring(1.6, 16)} tone="lo" />
    </g>
  )
}

/** A dial needle at `angle` (0 = toward −y, clockwise from above). */
export function needleOf(c: DialSpec, angle: number, P: Projection): string {
  const sx = Math.sin(angle)
  const sy = -Math.cos(angle)
  const top = c.z + c.h
  return lineOnTop([c.x - sx * 3.5, c.y - sy * 3.5], [c.x + sx * (c.r - 5), c.y + sy * (c.r - 5)], top + 0.2, P)
}

/** A transform that lays SVG text flat on a face that looks along +y, centred on (x, z). */
export function frontText(x: number, y: number, z: number, P: Projection): string {
  const o = iso([x, y, z], P)
  const z0 = iso([0, 0, 0], P)
  const ex = iso([1, 0, 0], P)
  const ez = iso([0, 0, 1], P)
  return `matrix(${(ex[0] - z0[0]).toFixed(4)} ${(ex[1] - z0[1]).toFixed(4)} ${(z0[0] - ez[0]).toFixed(4)} ${(z0[1] - ez[1]).toFixed(4)} ${o[0].toFixed(2)} ${o[1].toFixed(2)})`
}

export type { Flat }
