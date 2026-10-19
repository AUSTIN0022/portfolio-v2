'use client'

import { Hub } from '@lucasmarkes/hairline/react'
import { CasePage } from '@/components/CasePage'
import { ReviewSection } from '@/components/anatomy/review/Review'
import { ReviewReplay } from '@/components/ReviewReplay'
import { PRS_JOURNEY } from '@/content/journeys'
import { PRS_DECISIONS } from '@/content/decisions'

/** /prsentinel — the PR Sentinel deep-dive. Facts from the repo README and Backend/docs/DECISIONS.md. */
export default function PrSentinelLab() {
  return (
    <CasePage
      id="prsentinel"
      meta={[
        { k: 'Role', v: 'Solo — backend, agents and dashboard' },
        { k: 'Runs as', v: 'GitHub App · Express API + BullMQ worker · Next.js 16 dashboard' },
        { k: 'Models', v: 'Vercel AI SDK via OpenRouter — a model tier per agent' },
      ]}
      notes={[
        {
          k: 'agents',
          n: '11',
          cap: 'specialised agents around one orchestrator, scheduled into parallel waves by a planner.',
          fig: (r) => <Hub play intensity={0.6} onRead={r} />,
        },
        {
          k: 'tools',
          n: '12',
          cap: 'permission-scoped tools — each agent may only call the ones its role needs.',
        },
        {
          k: 'cache',
          n: '12×',
          cap: 'fewer GitHub calls per review, by caching immutable git data against the commit SHA.',
        },
        {
          k: 'tests',
          n: '7 → 68',
          cap: 'tests, with webhooks verified by HMAC and tokens encrypted with AES-256-GCM.',
        },
      ]}
      journey={PRS_JOURNEY}
      opener={{
        title: 'The life of one pull request.',
        dek: 'One PR, from GitHub’s webhook to a posted review — queued, planned, inspected by two waves of agents, and filtered before it speaks.',
      }}
      mechanism={<ReviewSection />}
      decisions={PRS_DECISIONS}
      next="smartformflow"
      demo={<ReviewReplay />}
    />
  )
}
