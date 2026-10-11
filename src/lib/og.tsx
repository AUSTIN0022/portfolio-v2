import { ImageResponse } from 'next/og'
import type { Metadata } from 'next'
import { PROJECTS, type LabProject } from '@/content/lab'

/*
 * Link-preview cards (Open Graph images) — the card a chat app, LinkedIn or
 * Slack shows when someone pastes a link. Rendered once at build time by each
 * route's opengraph-image.tsx; this file holds the shared design.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_TYPE = 'image/png'

const PAPER = '#f1efe9'
const INK = '#121212'
const MUTE = '#6d6a63'
const ACCENT = '#ff4f12'

/** A Google font as TTF (what the renderer reads). Without a browser UA, the CSS API serves TTF. */
async function googleFont(query: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${query}`)).text()
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!url) throw new Error(`og: no TTF for ${query}`)
  return (await fetch(url)).arrayBuffer()
}

type Font = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: 'normal' | 'italic' }

/** The site's four faces; any that can't be fetched fall back to the default sans. */
async function fonts(): Promise<Font[]> {
  const want: [string, string, Font['weight'], Font['style']][] = [
    ['Geist', 'Geist:wght@900', 900, 'normal'],
    ['Barlow Condensed', 'Barlow+Condensed:wght@700', 700, 'normal'],
    ['Instrument Serif', 'Instrument+Serif:ital@1', 400, 'italic'],
    ['Instrument Serif', 'Instrument+Serif', 400, 'normal'],
    ['JetBrains Mono', 'JetBrains+Mono:wght@400', 400, 'normal'],
  ]
  const got = await Promise.allSettled(want.map(([, q]) => googleFont(q)))
  return got.flatMap((r, i) =>
    r.status === 'fulfilled' ? [{ name: want[i][0], data: r.value, weight: want[i][2], style: want[i][3] }] : [],
  )
}

/*
 * The hero's Fig. 0 as a still: six plates in isometric, edge at the top,
 * database at the bottom. `hi` lights the layer a card is about.
 */
const LAYERS = ['postgres', 'redis', 'bullmq', 'api', 'alb', 'edge'] as const
type Layer = (typeof LAYERS)[number]

function StackMark({ hi, scale = 1 }: { hi?: Layer; scale?: number }) {
  const W = 120, D = 88, GAP = 44, s = 1.55 * scale
  const pt = (x: number, y: number, z: number) => {
    const sx = (x - y) * 0.866 * s
    const sy = (x + y) * 0.38 * s - z * s
    return [sx, sy] as const
  }
  const ox = D * 0.866 * s + 8
  const oy = (LAYERS.length - 1) * GAP * s + 8
  const P = (x: number, y: number, z: number) => {
    const [a, b] = pt(x, y, z)
    return `${(a + ox).toFixed(1)},${(b + oy).toFixed(1)}`
  }
  const w = (W + D) * 0.866 * s + 16
  const h = (W + D) * 0.38 * s + (LAYERS.length - 1) * GAP * s + 16
  const plate = (z: number) => `M${P(0, 0, z)} L${P(W, 0, z)} L${P(W, D, z)} L${P(0, D, z)} Z`
  const edge = (z: number) => `M${P(W, 0, z)} L${P(W, 0, z - 3)} L${P(W, D, z - 3)} L${P(0, D, z - 3)} L${P(0, D, z)}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {LAYERS.map((name, i) => {
        const z = i * GAP + 3
        const on = name === hi
        const stroke = on ? ACCENT : INK
        return (
          <g key={name}>
            {i > 0 && (
              <path
                d={`M${P(W, 0, z - 3)} L${P(W, 0, z - GAP)} M${P(0, D, z - 3)} L${P(0, D, z - GAP)} M${P(W, D, z - 3)} L${P(W, D, z - GAP)}`}
                stroke={MUTE}
                strokeWidth={1}
                strokeDasharray="3 4"
                fill="none"
              />
            )}
            <path d={edge(z)} stroke={stroke} strokeWidth={on ? 2 : 1.2} fill={PAPER} strokeLinejoin="round" />
            <path d={plate(z)} stroke={stroke} strokeWidth={on ? 2.2 : 1.4} fill={PAPER} strokeLinejoin="round" />
            {name === 'edge' &&
              [0, 1, 2].flatMap((r) =>
                [0, 1, 2, 3].map((c) => {
                  const [cx, cy] = P(22 + c * 25, 20 + r * 24, z).split(',').map(Number)
                  const lit = on && r === 1 && c === 1 // the incoming request, only when the edge is the subject
                  return <circle key={`${r}${c}`} cx={cx} cy={cy} r={lit ? 3.2 : 1.8} fill={lit ? ACCENT : MUTE} />
                }),
              )}
          </g>
        )
      })}
    </svg>
  )
}

function Frame({ children, top }: { children: React.ReactNode; top: [string, string] }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        color: INK,
        padding: '52px 64px',
        fontFamily: 'Instrument Serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 18,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: MUTE,
          borderBottom: `1px solid ${INK}`,
          paddingBottom: 18,
        }}
      >
        <span style={{ color: ACCENT }}>{top[0]}</span>
        <span>{top[1]}</span>
      </div>
      {children}
    </div>
  )
}

export async function homeCard() {
  return new ImageResponse(
    (
      <Frame top={['Austin Makasare', 'v2.austinmakasare.site']}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <span style={{ fontFamily: 'Geist', fontWeight: 900, fontSize: 196, letterSpacing: -12, lineHeight: 0.85 }}>AUSTIN</span>
              <span style={{ fontStyle: 'italic', fontSize: 74, color: ACCENT, marginTop: -6, marginLeft: 300 }}>Makasare</span>
            </div>
            <span style={{ fontSize: 36, lineHeight: 1.15, marginTop: 22, maxWidth: 640 }}>
              Backend-focused full-stack engineer — queues, real-time systems and cloud infrastructure.
            </span>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 30, fontFamily: 'JetBrains Mono', fontSize: 18, textTransform: 'uppercase' }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: '#22b45e', marginRight: 12 }} />
              Open to SDE-1 full-stack &amp; backend roles
            </div>
          </div>
          <StackMark hi="edge" scale={0.92} />
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

const CASE_LAYER: Record<LabProject['id'], Layer> = { quizbuzz: 'api', prsentinel: 'bullmq', smartformflow: 'postgres' }

export async function caseCard(id: LabProject['id']) {
  const p = PROJECTS.find((x) => x.id === id)!
  const summary = p.summary.length > 150 ? `${p.summary.slice(0, p.summary.lastIndexOf(' ', 147))}…` : p.summary
  return new ImageResponse(
    (
      <Frame top={[`Case study ${p.n} · ${p.kind}`, 'Austin Makasare']}>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <span
              style={{
                fontFamily: 'Barlow Condensed',
                fontWeight: 700,
                fontSize: p.name.length > 11 ? 124 : 150,
                lineHeight: 0.86,
                textTransform: 'uppercase',
                letterSpacing: -1,
              }}
            >
              {p.name}
            </span>
            <span style={{ fontSize: 30, lineHeight: 1.18, marginTop: 18 }}>{summary}</span>
            <div style={{ display: 'flex', marginTop: 30 }}>
              {p.outcomes.map((o) => (
                <div key={o.label} style={{ display: 'flex', flexDirection: 'column', marginRight: 46, maxWidth: 220 }}>
                  <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 54, lineHeight: 1 }}>{o.n}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, color: MUTE, marginTop: 6, textTransform: 'uppercase' }}>
                    {o.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <StackMark hi={CASE_LAYER[id]} scale={0.82} />
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  )
}

/** Title + description for a case-study route; the image comes from its opengraph-image.tsx. */
export function caseMeta(id: LabProject['id']): Metadata {
  const p = PROJECTS.find((x) => x.id === id)!
  const description = p.summary
  return {
    title: `${p.name} — case study`,
    description,
    openGraph: { title: `${p.name} — Austin Makasare`, description, url: p.href!, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${p.name} — Austin Makasare`, description },
  }
}
