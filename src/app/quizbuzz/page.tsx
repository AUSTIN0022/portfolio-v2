'use client'

import { CasePage } from '@/components/CasePage'
import { ScaleSection } from '@/components/anatomy/scale/Scale'
import { QUIZBUZZ_JOURNEY } from '@/content/journeys'
import { QUIZBUZZ_DECISIONS } from '@/content/decisions'

/** /quizbuzz — the QuizBuzz deep-dive. */
export default function QuizBuzzLab() {
  return (
    <CasePage
      id="quizbuzz"
      meta={[
        { k: 'Role', v: 'Solo — architecture to load test' },
        { k: 'Target', v: '10,000 concurrent participants' },
        { k: 'Infra', v: 'AWS · ALB · Auto Scaling · ElastiCache · Terraform' },
      ]}
      notes={[
        { k: 'sockets', n: '7,500', cap: 'concurrent WebSocket users, load-tested against a 10K architecture.' },
        { k: 'scale', n: '1 → 8', cap: 'instances behind the load balancer, pre-warmed before the peak.' },
        { k: 'lock', n: '0', cap: 'answers scored twice. Every submission takes an idempotent Redis lock.' },
        { k: 'queue', n: '6', cap: 'BullMQ queues keep heavy work off the request path — the API stays under 100 ms.' },
      ]}
      journey={QUIZBUZZ_JOURNEY}
      opener={{
        title: 'The life of one answer.',
        dek: 'One participant, one answer — followed from payment to certificate through every service it touches. Scroll to move the camera.',
      }}
      mechanism={<ScaleSection />}
      decisions={QUIZBUZZ_DECISIONS}
      next="prsentinel"
    />
  )
}
