/**
 * Engineering decisions shown on the v2 case studies. QuizBuzz and
 * SmartFormFlow are condensed from the live case studies
 * (src/app/work/*); PR Sentinel from Backend/docs/DECISIONS.md in the
 * AUSTIN0022/PR-Sentinel repository (entry numbers kept in `ref`).
 */

export type Decision = {
  title: string
  /** The one number or phrase a skimmer should leave with. */
  metric: string
  status: 'shipped' | 'designed'
  problem: string
  approach: string
  outcome: string
  ref?: string
}

// QuizBuzz: from Project-related-docs/Quizbuzz (incident log, decision map,
// ARCHITECTURE.md). `ref` is the category shown on each card.
export const QUIZBUZZ_DECISIONS: Decision[] = [
  {
    title: 'Pay for 10,000 users only on contest day',
    metric: '~70% lower infra cost',
    status: 'shipped',
    ref: 'Architecture',
    problem: 'Contests are scheduled, short and spiky. Running a load balancer, an auto-scaling fleet and a Redis cluster all month for a few hours of peak would be paying for idle capacity.',
    approach: 'One Terraform variable switches modes. Idle is a single EC2 with Redis in Docker; live adds an ALB, an auto-scaling group and an ElastiCache primary + replica — created by go-live and torn down by go-idle.',
    outcome: 'The peak is known before it arrives, so capacity can be decided in advance instead of chased.',
  },
  {
    title: 'One question cache, not ten thousand reads',
    metric: '~2.7 KB per participant',
    status: 'shipped',
    ref: 'Scale',
    problem: 'At the start signal every participant asks for the same questions at once — a thundering herd against Postgres, at the worst possible moment.',
    approach: 'The question set is cached once in Redis for the whole contest; each participant stores only their own shuffled order. The answer key is stripped before anything reaches a client.',
    outcome: 'Share what is identical, store per-user only what actually differs.',
  },
  {
    title: 'Scoring moved off the request path',
    metric: '< 100 ms API at peak',
    status: 'shipped',
    ref: 'Scale',
    problem: 'Scoring answers, ranking a leaderboard and scoring proctoring inline would make every submit as slow as the slowest of them, exactly when everyone submits together.',
    approach: 'A submit only enqueues a BullMQ job. Separate workers score answers (concurrency 50), aggregate proctoring (30), and trigger the leaderboard once every submission is evaluated.',
    outcome: 'The request path records intent; everything heavy happens behind a queue.',
  },
  {
    title: 'Exactly-once submissions across instances',
    metric: '0 answers scored twice',
    status: 'shipped',
    ref: 'Data integrity',
    problem: 'A reconnect, a retry and the contest-end auto-submit can all try to submit the same participant at once — possibly on different instances.',
    approach: 'A Redis SET NX lock per participant (10 s TTL) guards submission; only the holder writes and enqueues scoring. A 5 s lock does the same for the question fetch.',
    outcome: 'When work can arrive twice, make the second arrival a no-op.',
  },
  {
    title: 'Heap exhaustion at 500 sockets an instance',
    metric: '512 MB → 1.5 GB heap',
    status: 'shipped',
    ref: 'Production bug',
    problem: 'Both auto-scaled instances died together at 1,000 and 2,000 users: “JavaScript heap out of memory”. Redis state was only ~18.6 KB a participant — the heap was full of socket objects and closures.',
    approach: 'Raised the heap to 1.5 GB and the container limit to 2 GB in the launch template — then found running instances had booted from the old template and never got the fix.',
    outcome: 'Measure where memory actually lives before raising a limit, and check the fix reached the machines.',
  },
  {
    title: 'A connection pool sized for a quiet day',
    metric: 'pool 5 → 20',
    status: 'shipped',
    ref: 'Production bug',
    problem: '1,000 users arriving in 30 s is ~33 logins a second; a pool of five connections queued instantly and requests timed out.',
    approach: 'Pool raised to 20 (minimum 5) with a 10 s query timeout, and the load ramp slowed to a realistic 120 s — eight arrivals a second.',
    outcome: 'Arrival rate and pool size are one variable, not two.',
  },
  {
    title: 'Redis could silently evict the job queue',
    metric: 'volatile-lru → noeviction',
    status: 'shipped',
    ref: 'Infra',
    problem: 'Workers kept warning about the eviction policy. The no-eviction parameter group was defined in Terraform but never attached, so under pressure Redis could drop BullMQ keys and lose jobs.',
    approach: 'Attached the parameter group to the replication group, so every live cluster is created with noeviction.',
    outcome: 'A resource defined in code is not a resource applied — read the warning.',
  },
  {
    title: 'Rethinking autoscaling for WebSocket load',
    metric: 'CPU ≠ load',
    status: 'designed',
    ref: 'Scale',
    problem: 'Scaling triggered on CPU at 60%, but WebSocket load is memory- and IO-bound: CPU sat at 20% while the heap hit 95%. New instances also took ~7 minutes.',
    approach: 'Weighed a memory alarm, a connection-count metric and pre-warming from the registration count; also designed a /health that returns 503 when saturated.',
    outcome: 'Pre-warming chosen as primary — the peak is known in advance — with CloudWatch as defence in depth.',
  },
  {
    title: 'Closing the auto-submit coverage gap',
    metric: '140 of 1,323 → all',
    status: 'shipped',
    ref: 'Data integrity',
    problem: 'Auto-submit saved 140 of 1,323 live participants: it only read the active set, and an OOM crash had dropped the rest into the disconnected set.',
    approach: 'Union both sets on time expiry, then submit in batches of 50 with Promise.allSettled so one failure can’t abort the rest.',
    outcome: 'Once you find one instance of a failure class, predict its symmetric twin.',
  },
  {
    title: 'Zero job loss across a dual-Redis switch',
    metric: '0 jobs lost',
    status: 'shipped',
    ref: 'Data integrity',
    problem: 'Jobs scheduled before go-live sat in the local Redis; after switching to ElastiCache, workers listened elsewhere and contests never started.',
    approach: 'A DUMP/RESTORE migration that copies every key — types and TTLs intact — both ways, widened from queue keys to all participant state, and run inside the live container by go-live and go-idle.',
    outcome: '“Always remember to do X” is not a control. Move the execution so the system guarantees it.',
  },
  {
    title: 'Late joiners stuck in the waiting room',
    metric: 'START_IMMEDIATELY',
    status: 'shipped',
    ref: 'Production bug',
    problem: 'Anyone joining after the contest went live was parked in the waiting room for a start signal that had already fired once and was gone.',
    approach: 'Joining now checks the contest status; if it is already live, the participant starts the quiz directly instead of waiting.',
    outcome: 'One-shot events need a path for whoever arrives after them.',
  },
  {
    title: 'Login worked, then every request was a 401',
    metric: '200 → 401',
    status: 'shipped',
    ref: 'Production bug',
    problem: 'Admin login returned 200, then /me and /refresh failed. The auto-scaled instances set cookies for the old domain — and the load balancer was routing admin logins to them.',
    approach: 'Fixed the domain in both instance templates, patched the running instances, and traced why the request landed on that fleet at all.',
    outcome: 'Know which machine actually served the request before debugging the one you expected.',
  },
  {
    title: 'Debugging the Socket.IO protocol layer',
    metric: '50% → ~100%',
    status: 'shipped',
    ref: 'Debugging',
    problem: 'The k6 client sent plain JSON over raw WebSockets; Socket.IO speaks Engine.IO v4 on top, so the server ignored everything. Half the sockets “worked”.',
    approach: 'Verified the transport with curl, then rewrote the load client as a state machine speaking the real EIO4 handshake, namespace auth, framing and ping/pong.',
    outcome: 'A clean transport connection says nothing about the protocol above it.',
  },
  {
    title: 'Recovering drifted Terraform without touching live traffic',
    metric: '6 add · 0 destroy',
    status: 'shipped',
    ref: 'Infra',
    problem: 'An interrupted apply left the HTTPS listener and its routing rules out of state — the site timed out — while one DNS record from that run already existed in AWS.',
    approach: 'Read the plan first, imported the existing record instead of recreating it, and applied only once the diff showed six additions and nothing destroyed.',
    outcome: 'Understand the diff before you apply it, especially on infrastructure serving traffic.',
  },
  {
    title: 'Auditing every rate limiter, not just the broken one',
    metric: '600 ms ≠ 600 s',
    status: 'shipped',
    ref: 'Debugging',
    problem: 'An OTP limiter guarded a login route with no OTP; every k6 user shared one IP and exhausted it. The audit found a second limiter missing a ×1000.',
    approach: 'Removed the misplaced limiter, then audited every limiter in the codebase and fixed the unit mismatch in both places.',
    outcome: 'Finding one bug of a class is the moment to look for its siblings.',
  },
]

export const SFF_DECISIONS: Decision[] = [
  {
    title: 'Closing three cross-tenant data leaks',
    metric: '404, not 403',
    status: 'shipped',
    problem: 'The multi-tenancy migration exposed three leaks: forms filtered by userId, and two lookups with no organisation check at all.',
    approach: 'A manual audit of every backend system; organizationId on every where-clause; isolation tests that expect 404 so another org’s data looks like it doesn’t exist.',
    outcome: 'Zero leaks in audited endpoints, with the isolation test as a pre-deploy gate.',
  },
  {
    title: 'Normalising real-world contact fields',
    metric: '1 contact / person',
    status: 'shipped',
    problem: 'Dedup only matched fields literally named “phone” or “email” — “Mobile Number” or “WhatsApp No.” quietly created duplicate people.',
    approach: 'A field-alias registry mapping dozens of real label variants to canonical phone and email, with near-miss logging to grow it from real usage.',
    outcome: 'Deduplication that works on how people actually label forms.',
  },
  {
    title: 'A silent Razorpay receipt-limit failure',
    metric: '40 chars',
    status: 'shipped',
    problem: 'Order creation failed for some organisations with no error at all: the receipt field has a 40-character limit that prefixed UUIDs exceeded.',
    approach: 'Strip dashes, keep 30 characters, prefix “rcpt_” — once, at the API boundary. Amounts stay in display units everywhere else; paise only at the call.',
    outcome: 'Reliable orders across orgs, and one place for unit conversion.',
  },
  {
    title: 'Three silent failures, three standing rules',
    metric: '3 rules',
    status: 'shipped',
    problem: 'SMTP broke when Compose read “$” as a variable, Nodemailer bound before env vars loaded, and certificate jobs died on a dynamic import.',
    approach: 'Quote “$” in .env; build the transporter lazily on first use; static top-level imports across the worker layer.',
    outcome: 'Each incident became a rule instead of a patch — the quoting rule alone has prevented several repeats.',
  },
  {
    title: 'Two-phase migrations on live client data',
    metric: '0 data lost',
    status: 'shipped',
    problem: 'Schema changes had to land on a live client’s data, where migrate-dev or hand-edited migrations could corrupt history or rows.',
    approach: 'Phase 1: additive, nullable columns applied directly and marked resolved. Phase 2: constraints and indexes only after deploy and backfill.',
    outcome: 'No data loss across every migration since — now the standing protocol.',
  },
]

export const PRS_DECISIONS: Decision[] = [
  {
    title: 'Never fetch what an agent already has',
    metric: 'up to 12× fewer calls',
    status: 'shipped',
    problem: 'Six agents were each allowed to read the same PR comments and reviews, so one review could make a dozen near-identical GitHub calls before reading a file.',
    approach: 'Immutable git data cached by commit SHA, fetched once ever; mutable PR data served from webhook-synced tables. Code search stays live — its index moves.',
    outcome: 'Cache hits are byte-identical to a live call, so review quality isn’t traded for budget.',
    ref: 'D6',
  },
  {
    title: 'Pause and resume, instead of finding the ceiling in production',
    metric: 'soft + hard floor',
    status: 'shipped',
    problem: 'Even after caching, a busy installation could run its shared GitHub budget down in the middle of a review.',
    approach: 'A Redis-backed budget tracker from GitHub’s own headers. Below a soft floor no new wave starts; the review checkpoints and re-enqueues itself for the reset.',
    outcome: 'The UI says “paused — resuming in ~12m” instead of looking stuck or failed.',
    ref: 'D7',
  },
  {
    title: 'A rate-limit floor that could deadlock a review',
    metric: '9 / 10 left, still paused',
    status: 'shipped',
    problem: 'A review paused and re-paused forever with 90% of its budget left: a hard-coded minimum floor of 50 was larger than a category whose whole limit was 10.',
    approach: 'Floors became pure ratios of the reported limit, and the rate-limit category now goes into the log so the next surprise is diagnosable.',
    outcome: 'Found live in end-to-end testing — exactly what the design doc promised the code already did.',
    ref: 'D18',
  },
  {
    title: 'One revoked token took down the whole server',
    metric: '500 → 401',
    status: 'shipped',
    problem: 'Express 4 doesn’t forward rejected promises from async handlers, so a single expired OAuth token crashed the entire process.',
    approach: 'An async-handler wrapper on every uncovered route, and a specific 401 telling the user to sign in again.',
    outcome: 'One bad request now fails one request.',
    ref: 'D19',
  },
  {
    title: 'A circuit breaker — and a dashboard that stopped lying',
    metric: '3 fails → 60 s open',
    status: 'shipped',
    problem: 'When the model provider degraded, seven agents each burned three retries back to back — and an all-failed run showed as a “confirmed clean pass”.',
    approach: 'A process-wide breaker that opens after three consecutive full failures; the empty state now checks agent executions, not just finding count.',
    outcome: 'No retry storms during outages, and “inconclusive” is reported as inconclusive.',
    ref: 'D23',
  },
]
