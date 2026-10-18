import { ASCII_PORTRAIT } from '@/content/ascii'
import { LINKS } from '@/content/lab'

/*
 * The terminal's version of the home page: `curl <this site>` is rewritten here
 * (see next.config.ts) and gets a plain-text card. No ANSI codes, so it pipes
 * and pastes cleanly.
 */

const W = 78 // inner width; fits an 80-column terminal with the box border
const SIDE = 36 // portrait column

const INFO = [
  'AUSTIN MAKASARE',
  'Backend-focused full-stack engineer',
  'queues · real-time · cloud infra',
  '',
  '* Open to SDE-1 full-stack & backend',
  '  roles · India, remote-ready',
  '',
  'WORK',
  '  QuizBuzz      10,000+ live users',
  '  PR Sentinel   AI reviewer, building',
  '  SmartFormFlow 0 duplicate charges',
  '',
  'NOW',
  '  Building PR Sentinel — parallel',
  '  agent waves, commit-keyed cache',
]

const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length))

export function GET(req: Request) {
  const host = new URL(req.url).host
  const base = `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`
  const rule = '─'.repeat(W)
  const body = ASCII_PORTRAIT.map((art, i) => `│${pad(art, SIDE)}  ${pad(INFO[i] ?? '', W - SIDE - 2)}│`)
  const text = [
    `┌${rule}┐`,
    ...body,
    `├${rule}┤`,
    `│${pad(`  web      ${base}`, W)}│`,
    `│${pad(`  github   ${LINKS.github}`, W)}│`,
    `│${pad(`  linkedin ${LINKS.linkedin}`, W)}│`,
    `│${pad(`  email    ${LINKS.email}`, W)}│`,
    `│${pad(`  resume   ${base}${LINKS.resume}`, W)}│`,
    `└${rule}┘`,
    '',
    `  $ curl ${base}/api/status   # how this site is doing right now`,
    '',
  ].join('\n')
  return new Response(text, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' },
  })
}
