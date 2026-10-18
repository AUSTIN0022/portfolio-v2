import { BUILD } from '@/content/site'

export const dynamic = 'force-dynamic'

/** What /status pings. Also fine to `curl`. */
export function GET(req: Request) {
  const region = process.env.VERCEL_REGION ?? req.headers.get('x-vercel-id')?.split('::')[0] ?? 'local'
  return Response.json(
    { status: 'ok', version: BUILD.version, commit: BUILD.commit, builtAt: BUILD.builtAt, region, time: new Date().toISOString() },
    { headers: { 'cache-control': 'no-store' } },
  )
}
