'use client'

import { Cabinet, Format, Lockers } from '@lucasmarkes/hairline/react'
import { CasePage } from '@/components/CasePage'
import { CustomFigure } from '@/components/CustomFigure'
import { SFF_JOURNEY } from '@/content/journeys'
import { SFF_DECISIONS } from '@/content/decisions'

/** /smartformflow — the SmartFormFlow deep-dive. Facts from Project-related-docs/smartflow. */
export default function SmartFormFlowLab() {
  return (
    <CasePage
      id="smartformflow"
      meta={[
        { k: 'Role', v: 'Architecture, backend, infra & product calls' },
        { k: 'Team', v: 'Two people, one live paying client' },
        { k: 'Runs on', v: 'One VPS · 5-container Docker Compose · GitHub Actions → GHCR' },
      ]}
      notes={[
        {
          k: 'dedupe',
          n: '1',
          cap: 'contact per person, across every event — matched on email and phone through dozens of field-name aliases.',
          fig: (r) => <CustomFigure name="dedupe" play onRead={r} />,
        },
        {
          k: 'tenancy',
          n: '404',
          cap: 'not 403. The cross-tenant test proves Org B can’t even tell Org A’s data exists — after an audit that found and closed three leaks.',
          fig: (r) => <Lockers play intensity={0.6} onRead={r} />,
        },
        {
          k: 'containers',
          n: '5',
          cap: 'containers on one VPS. The worker runs alone, so a certificate burst can’t starve the API.',
          fig: (r) => <Cabinet play intensity={0.6} onRead={r} />,
        },
        {
          k: 'incidents',
          n: '10',
          cap: 'production incidents, each root-caused and turned into a standing rule rather than a one-off patch.',
          fig: (r) => <Format play intensity={0.6} onRead={r} />,
        },
      ]}
      journey={SFF_JOURNEY}
      opener={{
        title: 'The life of one registration.',
        dek: 'One attendee, from an anonymous visit to an issued certificate — through dedup, their organiser’s own payment keys, a signed webhook and a worker that never blocks the request.',
      }}
      decisions={SFF_DECISIONS}
      next="quizbuzz"
    />
  )
}
