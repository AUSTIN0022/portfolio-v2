/*
 * Exactly-once, as a pure model. A scroll position u in [0, 1] gives every
 * part's pose; nothing here touches the DOM. True to SmartFormFlow: Razorpay
 * can deliver the same payment webhook more than once, and the handler is
 * idempotent — the first delivery records the payment, the others change
 * nothing — which is why there have been 0 duplicate charges.
 */

export const LANES = [-46, 0, 46] as const;
export const WINNER = 1;

/** x of a blade's nose when it is parked, touching the shuttle, touching a bumper. */
export const TIP_HOME = 40;
export const TIP_SHUTTLE = 10;
export const PAD_FRONT = -18;
export const PAD_TRAVEL = 9;
export const SHUTTLE_FROM = LANES[0];

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const out = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

export interface Pose {
  /** nose x of each blade */
  tips: [number, number, number];
  /** how far each bumper pad is pushed back (≤ 0) */
  pads: [number, number, number];
  shuttleY: number;
  /** how far the held-key indicator pin stands above its collar */
  pin: number;
  /** dial gauge reading: payments recorded, 0 – 1 */
  gauge: number;
}

const loser = (u: number, arrive: [number, number], recoil: number): number => {
  const [a, b] = arrive
  const go = TIP_HOME + (PAD_FRONT - TIP_HOME) * smooth(seg(u, a, b))
  if (u < b) return go
  const squash = PAD_FRONT - PAD_TRAVEL * out(seg(u, b, b + 0.06))
  if (u < recoil) return squash
  const spring = squash + (PAD_FRONT - squash) * out(seg(u, recoil, recoil + 0.04))
  return spring + (TIP_HOME - spring) * smooth(seg(u, recoil + 0.04, recoil + 0.26))
}

export function poseAt(u: number): Pose {
  const winner =
    TIP_HOME + (TIP_SHUTTLE - TIP_HOME) * smooth(seg(u, 0.1, 0.34)) + (TIP_HOME - TIP_SHUTTLE) * smooth(seg(u, 0.88, 0.99))
  const tips: Pose['tips'] = [loser(u, [0.1, 0.42], 0.5), winner, loser(u, [0.14, 0.48], 0.56)]
  const pads = tips.map((t, i) => (i === WINNER ? 0 : Math.min(0, t - PAD_FRONT))) as Pose['pads']
  const shuttleY = SHUTTLE_FROM + (LANES[WINNER] - SHUTTLE_FROM) * smooth(seg(u, 0.16, 0.3)) - (LANES[WINNER] - SHUTTLE_FROM) * smooth(seg(u, 0.9, 1))
  const pin = 7 * out(seg(u, 0.34, 0.39)) - 7 * smooth(seg(u, 0.86, 0.9))
  const gauge = out(seg(u, 0.4, 0.47)) - smooth(seg(u, 0.93, 0.99))
  return { tips, pads, shuttleY, pin, gauge }
}

export const STEPS = [
  { until: 0.1, key: 'three', title: 'One payment, three deliveries', text: 'Razorpay can deliver the same payment webhook more than once — a retry after a timeout, a replay, a duplicate.' },
  { until: 0.38, key: 'race', title: 'Only the first can record it', text: 'Each delivery carries the same payment. Whichever reaches the record first is the one that counts.' },
  { until: 0.88, key: 'held', title: 'One records it, two bounce', text: 'The first delivery records the payment. The others find it already recorded, are acknowledged, and change nothing.' },
  { until: 1.01, key: 'free', title: '0 duplicate charges', text: 'Every payment and payout webhook is handled this way, so a retry can never charge anyone twice.' },
] as const

export const stepAt = (u: number) => STEPS.findIndex((s) => u < s.until)

export function readoutOf(u: number): string {
  if (u < 0.1) return '3 deliveries · 1 payment'
  if (u < 0.34) return 'racing to record it'
  if (u < 0.42) return 'recorded · once'
  if (u < 0.88) return '2 duplicates · no-ops'
  return '0 duplicate charges'
}
