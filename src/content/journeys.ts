import type { IconType } from 'react-icons'
import {
  LuActivity,
  LuAward,
  LuBoxes,
  LuBuilding2,
  LuChartColumn,
  LuCog,
  LuCreditCard,
  LuDatabase,
  LuFileCheck,
  LuFileText,
  LuFlaskConical,
  LuGitPullRequest,
  LuKeyRound,
  LuLayers,
  LuLibrary,
  LuListChecks,
  LuListOrdered,
  LuMail,
  LuMedal,
  LuMessageCircle,
  LuMessageSquare,
  LuMonitor,
  LuMousePointerClick,
  LuRadio,
  LuRadioTower,
  LuReceipt,
  LuRefreshCcw,
  LuScanSearch,
  LuSend,
  LuShieldCheck,
  LuSparkles,
  LuTrophy,
  LuUser,
  LuUsers,
  LuWebhook,
  LuWorkflow,
  LuZap,
} from 'react-icons/lu'
import { REQUEST_LABELS, REQUEST_PATH, STAGES } from './quizbuzzArchitecture'

/**
 * Data for the scroll-driven architecture films on the v2 case-study pages.
 * One engine (components/SystemJourney) renders any of these.
 *
 * World units are roomy on purpose (~350 between ranks, ~420 between
 * columns). Cameras are framed against a 1440×900 screen whose left third is
 * the reading column, so nodes live roughly in x ∈ [1000, 2200].
 */

export type JourneyNode = {
  id: string
  label: string
  sub: string
  x: number
  y: number
  kind: 'hub' | 'tile'
  icon: IconType
  appear: number
}
export type JourneyStage = {
  key: string
  index: string
  title: string
  subtitle: string
  why?: string
  active: string[] | 'ALL'
}
type Cam = { x: number; y: number; s: number }
export type Journey = {
  name: string
  traceId: string
  nodes: JourneyNode[]
  edges: { from: string; to: string; appear: number; traffic?: boolean }[]
  stages: JourneyStage[]
  /** One camera per stage except the last; the last stage pans `pan.from → pan.to`. */
  cams: Cam[]
  pan: { from: Cam; to: Cam }
  /** The one request the orange packet follows; consecutive ids must be joined by an edge. */
  requestPath: string[]
  /** What the chip says after each hop (requestPath.length - 1 entries). */
  requestLabels: string[]
  /** The trace waterfall, one span per hop. */
  spans: { name: string; ms: number }[]
}

export const QUIZBUZZ_JOURNEY: Journey = {
  name: 'QuizBuzz',
  traceId: 'req_7f3a2c',
  nodes: [
    { id: 'org', label: 'Organization', sub: 'tenant · host', x: 1100, y: 200, kind: 'tile', icon: LuBuilding2, appear: 0 },
    { id: 'questionBank', label: 'Question bank', sub: 'randomised pool', x: 1520, y: 200, kind: 'tile', icon: LuLibrary, appear: 1 },
    { id: 'contest', label: 'Contest', sub: 'the core entity', x: 1100, y: 540, kind: 'hub', icon: LuTrophy, appear: 0 },
    { id: 'payment', label: 'Payment', sub: 'razorpay webhook', x: 1960, y: 470, kind: 'tile', icon: LuCreditCard, appear: 1 },
    { id: 'participant', label: 'Participant', sub: 'paid registration', x: 1960, y: 860, kind: 'tile', icon: LuUser, appear: 1 },
    { id: 'gateway', label: 'Socket.IO gateway', sub: 'EIO4 · 10k sockets', x: 1500, y: 1200, kind: 'hub', icon: LuRadioTower, appear: 2 },
    { id: 'liveq', label: 'Live questions', sub: 'synchronised delivery', x: 1020, y: 1200, kind: 'tile', icon: LuRadio, appear: 2 },
    { id: 'redis', label: 'Redis', sub: 'live state · pub/sub', x: 1500, y: 1580, kind: 'tile', icon: LuZap, appear: 2 },
    { id: 'submission', label: 'Submission', sub: 'locked · idempotent', x: 1980, y: 1440, kind: 'tile', icon: LuSend, appear: 3 },
    { id: 'bullmq', label: 'BullMQ', sub: '6 queues', x: 1980, y: 1820, kind: 'hub', icon: LuListOrdered, appear: 3 },
    { id: 'worker', label: 'Worker', sub: 'evaluation · certs', x: 1500, y: 2160, kind: 'hub', icon: LuCog, appear: 3 },
    { id: 'postgres', label: 'PostgreSQL', sub: 'durable store', x: 1020, y: 2160, kind: 'tile', icon: LuDatabase, appear: 4 },
    { id: 'leaderboard', label: 'Leaderboard', sub: 'live ranking', x: 1180, y: 2600, kind: 'tile', icon: LuMedal, appear: 5 },
    { id: 'certificate', label: 'Certificate', sub: 'pdf → s3', x: 1500, y: 2600, kind: 'tile', icon: LuAward, appear: 5 },
    { id: 'analytics', label: 'Analytics', sub: 'daily rollups', x: 1820, y: 2600, kind: 'tile', icon: LuChartColumn, appear: 5 },
    { id: 'messaging', label: 'Messaging', sub: 'sms · email', x: 2140, y: 2600, kind: 'tile', icon: LuMail, appear: 5 },
  ],
  edges: [
    { from: 'org', to: 'contest', appear: 0, traffic: true },
    { from: 'questionBank', to: 'contest', appear: 1, traffic: true },
    { from: 'payment', to: 'participant', appear: 1, traffic: true },
    { from: 'participant', to: 'contest', appear: 1 },
    { from: 'participant', to: 'gateway', appear: 2, traffic: true },
    { from: 'gateway', to: 'liveq', appear: 2, traffic: true },
    { from: 'gateway', to: 'redis', appear: 2, traffic: true },
    { from: 'gateway', to: 'submission', appear: 3, traffic: true },
    { from: 'submission', to: 'bullmq', appear: 3, traffic: true },
    { from: 'redis', to: 'bullmq', appear: 4, traffic: true },
    { from: 'bullmq', to: 'worker', appear: 3, traffic: true },
    { from: 'worker', to: 'postgres', appear: 4, traffic: true },
    { from: 'worker', to: 'leaderboard', appear: 5, traffic: true },
    { from: 'worker', to: 'certificate', appear: 5, traffic: true },
    { from: 'worker', to: 'analytics', appear: 5, traffic: true },
    { from: 'worker', to: 'messaging', appear: 5, traffic: true },
  ],
  stages: STAGES,
  cams: [
    { x: 1180, y: 400, s: 1.25 },
    { x: 1530, y: 540, s: 0.95 },
    { x: 1490, y: 1220, s: 0.9 },
    { x: 1700, y: 1680, s: 0.75 },
    { x: 1560, y: 1960, s: 0.8 },
    { x: 1660, y: 2380, s: 0.85 },
  ],
  pan: { from: { x: 1580, y: 560, s: 0.62 }, to: { x: 1580, y: 2300, s: 0.62 } },
  requestPath: REQUEST_PATH,
  requestLabels: REQUEST_LABELS,
  spans: [
    { name: 'POST /contests/:id/register', ms: 38 },
    { name: 'ws.connect', ms: 12 },
    { name: 'answer.submit', ms: 9 },
    { name: 'queue.add(evaluate)', ms: 2 },
    { name: 'worker.evaluate', ms: 140 },
    { name: 'certificate.render → s3', ms: 820 },
  ],
}

/**
 * SmartFormFlow: one registration, from an anonymous visitor to an issued
 * certificate — dedup, BYOK payments, the signed webhook, and the isolated
 * worker container. Facts from Project-related-docs/smartflow.
 */
export const SFF_JOURNEY: Journey = {
  name: 'SmartFormFlow',
  traceId: 'reg_41c9e0',
  nodes: [
    { id: 'visitor', label: 'Visitor', sub: 'anonymous · cookie id', x: 1100, y: 200, kind: 'tile', icon: LuMousePointerClick, appear: 0 },
    { id: 'dropoff', label: 'Drop-off stats', sub: 'last field touched', x: 1560, y: 380, kind: 'tile', icon: LuChartColumn, appear: 0 },
    { id: 'form', label: 'Public form', sub: 'multi-step · typed fields', x: 1100, y: 560, kind: 'hub', icon: LuFileText, appear: 0 },
    { id: 'submission', label: 'Submission', sub: 'typed answers', x: 1500, y: 900, kind: 'hub', icon: LuSend, appear: 1 },
    { id: 'contact', label: 'Contact', sub: 'one per person', x: 1020, y: 1100, kind: 'tile', icon: LuUsers, appear: 1 },
    { id: 'orgkeys', label: 'Org keys', sub: 'BYOK · encrypted', x: 1960, y: 860, kind: 'tile', icon: LuKeyRound, appear: 2 },
    { id: 'payment', label: 'Razorpay order', sub: 'rcpt_ · ≤ 40 chars', x: 1960, y: 1220, kind: 'tile', icon: LuReceipt, appear: 2 },
    { id: 'webhook', label: 'Webhook', sub: 'raw body · HMAC', x: 1500, y: 1500, kind: 'hub', icon: LuShieldCheck, appear: 3 },
    { id: 'postgres', label: 'PostgreSQL', sub: 'org-scoped writes', x: 1020, y: 1500, kind: 'tile', icon: LuDatabase, appear: 3 },
    { id: 'queue', label: 'BullMQ', sub: 'fire-and-forget', x: 1960, y: 1840, kind: 'hub', icon: LuListOrdered, appear: 4 },
    { id: 'worker', label: 'Worker', sub: 'its own container', x: 1500, y: 2160, kind: 'hub', icon: LuCog, appear: 4 },
    { id: 'certificate', label: 'Certificate', sub: 'pdf → s3', x: 1180, y: 2600, kind: 'tile', icon: LuAward, appear: 5 },
    { id: 'email', label: 'Email', sub: 'smtp · templates', x: 1500, y: 2600, kind: 'tile', icon: LuMail, appear: 5 },
    { id: 'whatsapp', label: 'WhatsApp', sub: 'https api', x: 1820, y: 2600, kind: 'tile', icon: LuMessageCircle, appear: 5 },
    { id: 'analytics', label: 'Analytics', sub: 'daily rollups', x: 2140, y: 2600, kind: 'tile', icon: LuChartColumn, appear: 5 },
  ],
  edges: [
    { from: 'visitor', to: 'form', appear: 0, traffic: true },
    { from: 'form', to: 'dropoff', appear: 0, traffic: true },
    { from: 'form', to: 'submission', appear: 1, traffic: true },
    { from: 'submission', to: 'contact', appear: 1, traffic: true },
    { from: 'orgkeys', to: 'payment', appear: 2, traffic: true },
    { from: 'submission', to: 'payment', appear: 2, traffic: true },
    { from: 'payment', to: 'webhook', appear: 3, traffic: true },
    { from: 'webhook', to: 'postgres', appear: 3, traffic: true },
    { from: 'webhook', to: 'queue', appear: 4, traffic: true },
    { from: 'queue', to: 'worker', appear: 4, traffic: true },
    { from: 'worker', to: 'certificate', appear: 5, traffic: true },
    { from: 'worker', to: 'email', appear: 5, traffic: true },
    { from: 'worker', to: 'whatsapp', appear: 5, traffic: true },
    { from: 'worker', to: 'analytics', appear: 5, traffic: true },
  ],
  stages: [
    {
      key: 'visit',
      index: '01',
      title: 'A visitor opens a form',
      subtitle: 'Public, unauthenticated, multi-step — and every field they touch is tracked.',
      why: 'Drop-off is recorded per field, so the funnel shows where people quit, not just how many.',
      active: ['visitor', 'form', 'dropoff'],
    },
    {
      key: 'dedupe',
      index: '02',
      title: 'One person, one contact',
      subtitle: 'The submission resolves to a single canonical contact, across every event they ever join.',
      why: 'An alias registry maps “Mobile No.”, “WhatsApp Number” and dozens more to one phone field — the fix for a contact list that had quietly fragmented.',
      active: ['form', 'submission', 'contact'],
    },
    {
      key: 'pay',
      index: '03',
      title: 'Payment, on their own keys',
      subtitle: 'Each organisation brings its own Razorpay account, so money never passes through the platform.',
      why: 'Receipt IDs are trimmed under Razorpay’s silent 40-character limit: rcpt_ plus 30.',
      active: ['submission', 'orgkeys', 'payment'],
    },
    {
      key: 'webhook',
      index: '04',
      title: 'The webhook is the truth',
      subtitle: 'A payment is only real once Razorpay’s signed webhook says so.',
      why: 'The body stays a raw buffer until the HMAC is checked against that org’s own secret — and replays are idempotent.',
      active: ['payment', 'webhook', 'postgres'],
    },
    {
      key: 'async',
      index: '05',
      title: 'Slow work leaves the request',
      subtitle: 'Certificates, messages and exports are enqueued and answered at once; the browser polls.',
      why: 'The worker runs in its own container, so a burst of certificates during a live event can’t starve the API.',
      active: ['webhook', 'queue', 'worker'],
    },
    {
      key: 'fanout',
      index: '06',
      title: 'Certificates and messages, automatically',
      subtitle: 'One worker fans out: a PDF certificate to S3, email and WhatsApp, and the analytics rollup.',
      active: ['worker', 'certificate', 'email', 'whatsapp', 'analytics'],
    },
    {
      key: 'tenancy',
      index: '07',
      title: 'Every query, scoped to its org',
      subtitle: 'organizationId on every where-clause — and a test that expects 404, not 403, across tenants.',
      active: 'ALL',
    },
  ],
  cams: [
    { x: 1260, y: 400, s: 1.15 },
    { x: 1300, y: 840, s: 0.95 },
    { x: 1720, y: 1020, s: 1.0 },
    { x: 1500, y: 1360, s: 0.85 },
    { x: 1720, y: 1830, s: 0.85 },
    { x: 1660, y: 2380, s: 0.85 },
  ],
  pan: { from: { x: 1580, y: 560, s: 0.62 }, to: { x: 1580, y: 2300, s: 0.62 } },
  requestPath: ['visitor', 'form', 'submission', 'payment', 'webhook', 'queue', 'worker', 'certificate'],
  requestLabels: [
    'form opened',
    'answers submitted',
    'order created',
    'payment verified ✓',
    'job enqueued',
    'worker picked it up',
    'certificate issued ✓',
  ],
  spans: [
    { name: 'GET /f/:slug', ms: 24 },
    { name: 'POST /submissions', ms: 41 },
    { name: 'razorpay.orders.create', ms: 180 },
    { name: 'POST /webhooks/razorpay', ms: 12 },
    { name: 'queue.add(certificate)', ms: 2 },
    { name: 'worker.pickup', ms: 30 },
    { name: 'pdf.render → s3', ms: 640 },
  ],
}

/**
 * PR Sentinel: one pull request, from GitHub's webhook to a posted review —
 * queued, planned, reviewed by two parallel waves of agents reading from a
 * commit-keyed cache, filtered by a reflection pass. Facts from the repo's
 * README and Backend/docs/DECISIONS.md.
 */
export const PRS_JOURNEY: Journey = {
  name: 'PR Sentinel',
  traceId: 'rev_9b2e71',
  nodes: [
    { id: 'pr', label: 'Pull request', sub: 'opened · synchronize', x: 1100, y: 200, kind: 'tile', icon: LuGitPullRequest, appear: 0 },
    { id: 'webhook', label: 'Webhook', sub: 'signature verified', x: 1100, y: 540, kind: 'hub', icon: LuWebhook, appear: 0 },
    { id: 'queue', label: 'BullMQ', sub: 'review jobs', x: 1560, y: 880, kind: 'hub', icon: LuListOrdered, appear: 1 },
    { id: 'redis', label: 'Redis', sub: 'checkpoints · budget', x: 2000, y: 880, kind: 'tile', icon: LuZap, appear: 1 },
    { id: 'orchestrator', label: 'Orchestrator', sub: 'plan · waves · resume', x: 1560, y: 1220, kind: 'hub', icon: LuWorkflow, appear: 2 },
    { id: 'understanding', label: 'PR understanding', sub: 'intent · scope · risk', x: 1140, y: 1120, kind: 'tile', icon: LuScanSearch, appear: 2 },
    { id: 'planner', label: 'Planner', sub: 'schedules the waves', x: 1140, y: 1400, kind: 'tile', icon: LuListChecks, appear: 2 },
    { id: 'wave1', label: 'Wave one', sub: 'three agents in parallel', x: 1560, y: 1600, kind: 'hub', icon: LuLayers, appear: 3 },
    { id: 'security', label: 'Security', sub: 'owasp · secrets · auth', x: 2020, y: 1440, kind: 'tile', icon: LuShieldCheck, appear: 3 },
    { id: 'architecture', label: 'Architecture', sub: 'boundaries · patterns', x: 2020, y: 1620, kind: 'tile', icon: LuBoxes, appear: 3 },
    { id: 'reliability', label: 'Reliability', sub: 'async · errors · leaks', x: 2020, y: 1800, kind: 'tile', icon: LuActivity, appear: 3 },
    { id: 'wave2', label: 'Wave two', sub: 'three agents in parallel', x: 1560, y: 2000, kind: 'hub', icon: LuLayers, appear: 4 },
    { id: 'testing', label: 'Testing', sub: 'coverage · edge cases', x: 1140, y: 1860, kind: 'tile', icon: LuFlaskConical, appear: 4 },
    { id: 'quality', label: 'Code quality', sub: 'standards · complexity', x: 1140, y: 2040, kind: 'tile', icon: LuSparkles, appear: 4 },
    { id: 'requirement', label: 'Requirement', sub: 'linked issue check', x: 1140, y: 2220, kind: 'tile', icon: LuFileCheck, appear: 4 },
    { id: 'cache', label: 'Content cache', sub: 'keyed by commit sha', x: 2020, y: 2140, kind: 'tile', icon: LuDatabase, appear: 4 },
    { id: 'reflection', label: 'Reflection', sub: 'drops false positives', x: 1560, y: 2380, kind: 'hub', icon: LuRefreshCcw, appear: 5 },
    { id: 'comments', label: 'Line comments', sub: 'posted to the pr', x: 1240, y: 2780, kind: 'tile', icon: LuMessageSquare, appear: 5 },
    { id: 'summary', label: 'Summary', sub: 'risk · verdict', x: 1560, y: 2780, kind: 'tile', icon: LuFileText, appear: 5 },
    { id: 'dashboard', label: 'Live dashboard', sub: 'sse stream', x: 1880, y: 2780, kind: 'tile', icon: LuMonitor, appear: 5 },
  ],
  edges: [
    { from: 'pr', to: 'webhook', appear: 0, traffic: true },
    { from: 'webhook', to: 'queue', appear: 1, traffic: true },
    { from: 'queue', to: 'redis', appear: 1, traffic: true },
    { from: 'queue', to: 'orchestrator', appear: 2, traffic: true },
    { from: 'orchestrator', to: 'understanding', appear: 2, traffic: true },
    { from: 'orchestrator', to: 'planner', appear: 2, traffic: true },
    { from: 'orchestrator', to: 'wave1', appear: 3, traffic: true },
    { from: 'wave1', to: 'security', appear: 3, traffic: true },
    { from: 'wave1', to: 'architecture', appear: 3, traffic: true },
    { from: 'wave1', to: 'reliability', appear: 3, traffic: true },
    { from: 'wave1', to: 'wave2', appear: 4, traffic: true },
    { from: 'wave2', to: 'testing', appear: 4, traffic: true },
    { from: 'wave2', to: 'quality', appear: 4, traffic: true },
    { from: 'wave2', to: 'requirement', appear: 4, traffic: true },
    { from: 'wave2', to: 'cache', appear: 4, traffic: true },
    { from: 'wave2', to: 'reflection', appear: 5, traffic: true },
    { from: 'reflection', to: 'comments', appear: 5, traffic: true },
    { from: 'reflection', to: 'summary', appear: 5, traffic: true },
    { from: 'reflection', to: 'dashboard', appear: 5, traffic: true },
  ],
  stages: [
    {
      key: 'open',
      index: '01',
      title: 'A pull request opens',
      subtitle: 'GitHub fires a webhook, and its signature is verified before anything else runs.',
      why: 'HMAC over the raw body; tokens and secrets are encrypted at rest with AES-256-GCM.',
      active: ['pr', 'webhook'],
    },
    {
      key: 'queue',
      index: '02',
      title: 'Queued, not processed inline',
      subtitle: 'The webhook answers at once; a BullMQ worker picks the review up.',
      why: 'Every step checkpoints to Redis, so a restarted worker resumes the review instead of starting over.',
      active: ['webhook', 'queue', 'redis'],
    },
    {
      key: 'plan',
      index: '03',
      title: 'It reads before it judges',
      subtitle: 'One agent establishes intent, scope and risk; a planner schedules the specialists into waves.',
      active: ['queue', 'orchestrator', 'understanding', 'planner'],
    },
    {
      key: 'wave1',
      index: '04',
      title: 'Wave one, in parallel',
      subtitle: 'Security, architecture and reliability agents inspect the change at the same time.',
      why: 'Each runs a tool loop capped at eight steps, with only the tools its role is permitted.',
      active: ['orchestrator', 'wave1', 'security', 'architecture', 'reliability'],
    },
    {
      key: 'wave2',
      index: '05',
      title: 'Wave two — nothing fetched twice',
      subtitle: 'Testing, code-quality and requirement agents follow, reading from a cache keyed by commit SHA.',
      why: 'Six agents used to fetch the same comments independently; caching immutable git data cut GitHub calls up to 12× per review.',
      active: ['wave1', 'wave2', 'testing', 'quality', 'requirement', 'cache'],
    },
    {
      key: 'write',
      index: '06',
      title: 'Reflect, then write',
      subtitle: 'A reflection pass removes false positives; the review lands on the PR as line comments and a summary.',
      active: ['wave2', 'reflection', 'comments', 'summary', 'dashboard'],
    },
    {
      key: 'whole',
      index: '07',
      title: 'That’s the whole reviewer.',
      subtitle: 'Webhook to review — resumable at every step, and honest about rate limits.',
      active: 'ALL',
    },
  ],
  cams: [
    { x: 1240, y: 380, s: 1.2 },
    { x: 1560, y: 720, s: 0.95 },
    { x: 1420, y: 1200, s: 0.95 },
    { x: 1720, y: 1520, s: 0.85 },
    { x: 1600, y: 1980, s: 0.75 },
    { x: 1580, y: 2560, s: 0.9 },
  ],
  pan: { from: { x: 1580, y: 560, s: 0.62 }, to: { x: 1580, y: 2480, s: 0.62 } },
  requestPath: ['pr', 'webhook', 'queue', 'orchestrator', 'wave1', 'wave2', 'reflection', 'comments'],
  requestLabels: [
    'signature verified ✓',
    'review queued',
    'plan ready',
    'wave one done',
    'wave two done',
    'findings filtered',
    'review posted ✓',
  ],
  spans: [
    { name: 'POST /webhooks/github', ms: 8 },
    { name: 'queue.add(review)', ms: 2 },
    { name: 'understand + plan', ms: 2400 },
    { name: 'wave 1 · 3 agents ∥', ms: 41000 },
    { name: 'wave 2 · 3 agents ∥', ms: 36000 },
    { name: 'reflection', ms: 9000 },
    { name: 'github.createReview', ms: 600 },
  ],
}
