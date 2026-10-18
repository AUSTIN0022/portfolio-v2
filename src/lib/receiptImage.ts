import { LINKS } from '@/content/lab'

/** Everything the receipt says, so the paper on the page and the saved image can't drift apart. */
export type ReceiptModel = {
  stamp: string
  ok: boolean
  why?: string
  items: [string, string][]
  kv: [string, string][]
  total: string
  thanks: string
}

const W = 360
const PAD = 24
const LH = 19
const SCALE = 3
const TOOTH = 12
const C = { paper: '#fffefb', ink: '#222222', dim: '#8a867e', rule: '#bdb9b0', ok: '#12923f', bad: '#c83805' }

/** Barcode bars as [width, gap]; derived from a fixed string so it is the same everywhere. */
export const BARS: [number, number][] = (() => {
  const w = Array.from('AUSTIN-MAKASARE-200-OK-POST-HIRE').map((c) => 1 + (c.charCodeAt(0) % 4))
  return w.map((x, i) => [x, (w[(i + 3) % w.length] % 3) + 1] as [number, number])
})()

/** Draws the receipt on a canvas and returns it as a PNG data URL (transparent outside the paper). */
export function renderReceipt(m: ReceiptModel, family: string): string {
  const paint = (ctx: CanvasRenderingContext2D, height: number) => {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.clearRect(0, 0, W, height || 1)
    if (height) {
      ctx.fillStyle = C.paper
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(W, 0)
      ctx.lineTo(W, height - TOOTH / 2)
      for (let x = W; x > 0; x -= TOOTH) {
        ctx.lineTo(x - TOOTH / 2, height)
        ctx.lineTo(x - TOOTH, height - TOOTH / 2)
      }
      ctx.closePath()
      ctx.fill()
    }
    ctx.textBaseline = 'alphabetic'
    let y = PAD + 14
    const font = (px: number) => (ctx.font = `${px}px ${family}`)
    const spaced = (px: string) => 'letterSpacing' in ctx && ((ctx as { letterSpacing: string }).letterSpacing = px)
    const center = (t: string, color: string, px = 12, ls = '0px') => {
      font(px)
      spaced(ls)
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText(t, W / 2, y)
      spaced('0px')
      y += LH
    }
    const row = (l: string, r: string, color = C.ink, rightColor = C.dim, px = 12) => {
      font(px)
      ctx.fillStyle = color
      ctx.textAlign = 'left'
      ctx.fillText(l, PAD, y)
      ctx.fillStyle = rightColor
      ctx.textAlign = 'right'
      ctx.fillText(r, W - PAD, y)
      y += LH
    }
    const rule = () => {
      y -= 5
      ctx.strokeStyle = C.rule
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(PAD, y)
      ctx.lineTo(W - PAD, y)
      ctx.stroke()
      ctx.setLineDash([])
      y += 18
    }

    center('AUSTIN MAKASARE', C.ink, 15, '2px')
    center('Backend-focused full-stack engineer', C.dim)
    center(m.stamp, C.dim)
    rule()
    font(12)
    ctx.fillStyle = C.ink
    ctx.textAlign = 'left'
    ctx.fillText('POST /api/contact HTTP/1.1', PAD, y)
    y += LH
    rule()
    if (m.why) {
      font(12)
      ctx.fillStyle = C.ink
      ctx.textAlign = 'left'
      let line = ''
      for (const word of m.why.split(' ')) {
        const next = line ? `${line} ${word}` : word
        if (ctx.measureText(next).width > W - PAD * 2 && line) {
          ctx.fillText(line, PAD, y)
          y += LH
          line = word
        } else line = next
      }
      ctx.fillText(line, PAD, y)
      y += LH
    } else {
      for (const [dt, dd] of m.items) {
        font(12)
        ctx.fillStyle = C.ink
        ctx.textAlign = 'left'
        ctx.fillText(dt, PAD, y)
        y += LH - 2
        ctx.fillStyle = C.dim
        ctx.fillText(dd, PAD + 19, y)
        y += LH + 3
      }
      y -= 3
    }
    rule()
    m.kv.forEach(([k, v], i) => row(k, v, C.ink, i === 0 ? (m.ok ? C.ok : C.bad) : C.dim))
    rule()
    row('TOTAL', m.total.toUpperCase(), C.ink, C.ink, 13)
    y += 6
    const barsW = BARS.reduce((n, [w, g]) => n + w + g, 0) - BARS[BARS.length - 1][1]
    let x = (W - barsW) / 2
    ctx.fillStyle = '#1a1a1a'
    for (const [w, g] of BARS) {
      ctx.fillRect(x, y, w, 34)
      x += w + g
    }
    y += 34 + 24
    center(LINKS.email, C.ink)
    center(m.thanks, C.dim)
    return y + PAD - 6 + TOOTH / 2
  }

  const scratch = document.createElement('canvas')
  const height = Math.ceil(paint(scratch.getContext('2d')!, 0))
  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = height * SCALE
  paint(canvas.getContext('2d')!, height)
  return canvas.toDataURL('image/png')
}
