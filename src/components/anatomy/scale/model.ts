/*
 * QuizBuzz's capacity, as a pure model. u in [0, 1] is a contest day, from
 * idle to idle. True to the case study: one EC2 instance between contests
 * (about $37 a month); a Terraform switch (go-live) creates the load
 * balancer and auto-scaling group and pre-warms 1 → 8 instances before the
 * start; load-tested at 7,500 concurrent sockets; go-idle tears it down.
 */

export const BAYS = 8
export const PEAK = 7500

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a))
const smooth = (t: number) => t * t * (3 - 2 * t)

export interface Pose {
  /** 0 = pulled out (off), 1 = racked (live), per bay */
  racked: number[]
  /** the go-live switch, 0 idle → 1 live */
  switch: number
  /** connected participants, 0 – PEAK */
  crowd: number
}

export function poseAt(u: number): Pose {
  const racked = Array.from({ length: BAYS }, (_, i) => {
    if (i === 0) return 1
    const inAt = 0.18 + (i - 1) * 0.03
    const outAt = 0.9 + (BAYS - 1 - i) * 0.012
    return smooth(seg(u, inAt, inAt + 0.05)) - smooth(seg(u, outAt, outAt + 0.02))
  })
  const sw = smooth(seg(u, 0.12, 0.17)) - smooth(seg(u, 0.85, 0.89))
  const crowd = PEAK * (smooth(seg(u, 0.42, 0.52)) - smooth(seg(u, 0.74, 0.84)))
  return { racked, switch: sw, crowd }
}

export const liveCount = (p: Pose) => p.racked.filter((r) => r > 0.98).length

export const STEPS = [
  { until: 0.15, key: 'idle', title: 'Idle on one machine', text: 'Between contests QuizBuzz runs on a single EC2 instance with Redis in Docker — about $37 a month.' },
  { until: 0.41, key: 'warm', title: 'Pre-warmed before the peak', text: 'One Terraform switch creates the load balancer, an auto-scaling group and ElastiCache, and scales out to 8 instances before the start. Capacity is decided in advance, not chased.' },
  { until: 0.84, key: 'peak', title: 'Thousands, all at once', text: 'At the start signal every participant connects; the load balancer spreads the sockets across the instances. Load-tested at 7,500 concurrent sockets.' },
  { until: 1.01, key: 'idle-again', title: 'Back to one', text: 'When the contest ends, go-idle tears it all down again. You pay for 10,000 users only on contest day.' },
] as const

export const stepAt = (u: number) => STEPS.findIndex((s) => u < s.until)

export function readoutOf(u: number): string {
  const p = poseAt(u)
  const n = liveCount(p)
  if (u < 0.12) return 'idle · 1 instance · $37/mo'
  if (u < 0.41) return `go-live · ${n} of ${BAYS} warm`
  if (u < 0.84) {
    const c = Math.round(p.crowd / 100) * 100
    return c ? `${c.toLocaleString('en-US')} sockets · ${n} instances · ~${Math.round(c / n)} each` : `${n} instances · waiting for the start`
  }
  if (u < 0.89) return 'contest over · draining'
  return `go-idle · ${Math.max(1, n)} instance${n > 1 ? 's' : ''}`
}
