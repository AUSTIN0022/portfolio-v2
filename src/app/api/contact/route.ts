import { LINKS } from '@/content/lab'

/*
 * POST /api/contact — the Send-request key's real endpoint.
 *
 * Safe to retry: the client sends an Idempotency-Key and keeps it until a send
 * succeeds. A repeat of a delivered key replays the first response instead of
 * sending again, and the same key goes to Resend, which de-duplicates on its
 * side too. Env: RESEND_API_KEY (required), CONTACT_TO, CONTACT_FROM.
 */

const RESEND_URL = process.env.RESEND_API_URL ?? 'https://api.resend.com/emails'
const DAY = 24 * 60 * 60 * 1000

type Delivered = { id: string; requestId: string }
// ponytail: per-instance memory. Resend's own key de-duplication covers the cross-instance case; add Redis if replay must be exact.
const delivered = new Map<string, { at: number; body: Delivered }>()
const attempts = new Map<string, number[]>()

function limited(ip: string) {
  const now = Date.now()
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  recent.push(now)
  attempts.set(ip, recent)
  if (attempts.size > 500) attempts.clear()
  return recent.length > 6
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()
const fail = (status: number, error: string, requestId: string, extra?: Record<string, unknown>) =>
  Response.json({ error, requestId, ...extra }, { status, headers: { 'x-request-id': requestId } })

export async function POST(req: Request) {
  const requestId = `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  const key = req.headers.get('idempotency-key') ?? ''
  if (key.length < 8 || key.length > 80) return fail(400, 'missing_idempotency_key', requestId)

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return fail(400, 'invalid_json', requestId)
  }
  const name = oneLine(String(data.name ?? ''))
  const email = oneLine(String(data.email ?? ''))
  const message = String(data.message ?? '').trim()
  const topic = oneLine(String(data.topic ?? '')).slice(0, 40)
  if (name.length < 1 || name.length > 80) return fail(422, 'name_required', requestId)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return fail(422, 'email_invalid', requestId)
  if (message.length < 10 || message.length > 2000) return fail(422, 'message_length', requestId)

  // Bot trap: a hidden field humans never fill. Pretend it worked.
  if (data.website) return Response.json({ id: 'dropped', requestId }, { headers: { 'x-request-id': requestId } })

  const prior = delivered.get(key)
  if (prior) {
    return Response.json(
      { ...prior.body, replay: true },
      { headers: { 'x-request-id': prior.body.requestId, 'idempotent-replay': 'true' } },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
  if (limited(ip)) return fail(429, 'too_many_requests', requestId)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return fail(503, 'mail_not_configured', requestId)

  let res: Response
  try {
    res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'idempotency-key': key },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>',
        to: [process.env.CONTACT_TO ?? LINKS.email],
        reply_to: email,
        subject: `Portfolio message from ${name}${topic ? ` — ${topic}` : ''}`.slice(0, 120),
        text: `${message}\n\n— ${name} <${email}>\n${topic ? `topic: ${topic}\n` : ''}request ${requestId}`,
      }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return fail(504, 'mail_unreachable', requestId)
  }
  if (!res.ok) return fail(502, 'mail_rejected', requestId)

  const { id } = (await res.json().catch(() => ({}))) as { id?: string }
  const body: Delivered = { id: id ?? 'queued', requestId }
  const now = Date.now()
  for (const [k, v] of delivered) if (now - v.at > DAY) delivered.delete(k)
  delivered.set(key, { at: now, body })
  return Response.json(body, { headers: { 'x-request-id': requestId } })
}
