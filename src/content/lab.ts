import type { IconType } from 'react-icons'
import { FaAws } from 'react-icons/fa'
import {
  LuActivity,
  LuBellRing,
  LuBraces,
  LuDatabase,
  LuFileCode,
  LuGitBranch,
  LuListOrdered,
  LuNetwork,
  LuRadioTower,
  LuRepeat,
  LuWorkflow,
} from 'react-icons/lu'
import {
  SiDocker,
  SiExpress,
  SiFramer,
  SiGithubactions,
  SiJavascript,
  SiK6,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPrisma,
  SiReact,
  SiRedis,
  SiSocketdotio,
  SiTailwindcss,
  SiTerraform,
  SiTypescript,
  SiZod,
} from 'react-icons/si'

/**
 * Content for the v2 site's pages, taken from the résumé and the existing
 * case-study copy. One place to edit the facts both lab pages print.
 */

export const LINKS = {
  email: 'hi.austinmakasare@gmail.com',
  cal: 'https://cal.com/austinmakasare',
  github: 'https://github.com/AUSTIN0022',
  linkedin: 'https://www.linkedin.com/in/austin-makasare/',
  resume: '/austin-makasare-resume.pdf',
  /** Add a handle (e.g. 'https://x.com/yourname') to show X/Twitter in Contact. */
  twitter: '' as string,
}

export const IMPACT = [
  { n: '10,000+', label: 'concurrent users on a real-time exam platform I architected' },
  { n: '70%', label: 'lower infrastructure cost from a dual-mode, auto-scaling AWS design' },
  { n: '6×', label: 'faster deploys — ~30 minutes down to under 5 with CI/CD' },
  { n: '0', label: 'duplicate charges, with idempotent payment webhooks' },
]

export type LabProject = {
  id: 'quizbuzz' | 'smartformflow' | 'prsentinel'
  n: string
  name: string
  kind: string
  years: string
  summary: string
  outcomes: { n: string; label: string }[]
  stack: string[]
  href: string | null
  cta: string
  /** Public source, shown on the case-study cover. */
  repo?: string
}

export const PROJECTS: LabProject[] = [
  {
    id: 'quizbuzz',
    n: '01',
    name: 'QuizBuzz',
    kind: 'Real-time · Multi-tenant · Infra',
    years: '2024 – 2026',
    summary:
      'A multi-tenant platform for large, live, proctored quiz contests — payments, WebSockets, queues and auto-scaling infrastructure, built solo from the first diagram to the load test.',
    outcomes: [
      { n: '7,500', label: 'concurrent sockets, load-tested' },
      { n: '$37', label: 'a month at idle' },
      { n: '< 100 ms', label: 'API at peak' },
    ],
    stack: ['Node.js', 'TypeScript', 'Socket.IO', 'BullMQ', 'Redis', 'PostgreSQL', 'AWS', 'Terraform', 'k6'],
    href: '/quizbuzz',
    cta: 'Read the case study',
  },
  {
    id: 'prsentinel',
    n: '02',
    name: 'PR Sentinel',
    kind: 'AI agents · GitHub App · In progress',
    years: '2026',
    summary:
      'An AI pull-request reviewer, running as a GitHub App. A verified webhook lands on a BullMQ queue; an orchestrator plans the review, runs specialised agents in two parallel waves with 12 permission-scoped tools, filters false positives in a reflection pass, and posts line comments back to the PR.',
    outcomes: [
      { n: '11', label: 'specialised agents, in parallel waves' },
      { n: '12×', label: 'fewer GitHub API calls per review' },
      { n: '7 → 68', label: 'tests' },
    ],
    stack: ['Node.js', 'TypeScript', 'Express', 'BullMQ', 'Redis', 'PostgreSQL', 'Prisma', 'Next.js', 'Vercel AI SDK'],
    href: '/prsentinel',
    cta: 'Read the case study',
    repo: 'https://github.com/AUSTIN0022/PR-Sentinel',
  },
  {
    id: 'smartformflow',
    n: '03',
    name: 'SmartFormFlow',
    kind: 'SaaS · Payments · Async',
    years: '2025 – 2026',
    summary:
      'A multi-tenant event platform that replaced paper, spreadsheets and manual payments for a client — registrations, verified payments, certificates and reminders, run by background workers.',
    outcomes: [
      { n: '−35%', label: 'manual reconciliation' },
      { n: '−40%', label: 'organiser follow-up' },
      { n: '0', label: 'duplicate-charge incidents' },
    ],
    stack: ['Node.js', 'TypeScript', 'Express', 'BullMQ', 'Prisma', 'PostgreSQL', 'Next.js', 'Razorpay', 'Docker'],
    href: '/smartformflow',
    cta: 'Read the case study',
  },
]

export const EXPERIENCE = [
  {
    role: 'Software Engineer',
    org: 'YSM Infosolution',
    where: 'Nashik, India · Hybrid',
    when: 'Jan 2025 — Present',
    points: [
      { k: '10,000+', t: 'concurrent users on a real-time examination platform, across two major versions — Socket.IO with a Redis pub/sub adapter behind ALB sticky sessions.' },
      { k: '−70%', t: 'infrastructure cost: a ~$37/month idle mode that auto-scales into a full load-balanced cluster within 10 minutes of a live contest.' },
      { k: 'hours → min', t: 'to investigate payment and subscription issues, with a multi-tenant SaaS and a central operations dashboard.' },
      { k: '0', t: 'duplicate charges — idempotent Razorpay webhooks for every payment and payout, and BullMQ workers issuing certificates to 10,000+ participants.' },
      { k: '6×', t: 'faster deploys (~30 → < 5 min) with GitHub Actions, Docker, ECR and EC2, plus CloudWatch / SNS alerting.' },
    ],
  },
]

export const EDUCATION = [
  { what: 'MSc Computer Science', where: 'KK Wagh Education Society, SPPU', when: '2024 — 2026', note: 'CGPA 8.91' },
  { what: 'BSc Computer Science', where: 'KK Wagh Education Society, SPPU', when: '2021 — 2024', note: 'CGPA 8.0' },
]

export const PRINCIPLES = [
  { t: 'Reliability over features.', d: 'A feature that fails silently is worse than one that never shipped.' },
  { t: 'Design for failure.', d: 'Networks partition, disks fill, processes die — every system assumes the worst path.' },
  { t: 'Idempotency is non-negotiable.', d: 'An operation is safe to run twice, or it does not ship.' },
  { t: 'Observability by default.', d: 'Logs, metrics and traces ship with the feature, not after the incident.' },
  { t: 'Simple scales.', d: 'The most scalable system is the one you can still reason about at 3am.' },
]

export type Tool = { name: string; icon: IconType; color: string | null }

// color: the mark's official brand colour (Simple Icons); null = a concept, drawn in ink.
export const STACK: { group: string; items: Tool[] }[] = [
  {
    group: 'Languages',
    items: [
      { name: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
      { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
      { name: 'SQL', icon: LuDatabase, color: null },
    ],
  },
  {
    group: 'Backend',
    items: [
      { name: 'Node.js', icon: SiNodedotjs, color: '#5FA04E' },
      { name: 'Express', icon: SiExpress, color: '#000000' },
      { name: 'REST APIs', icon: LuBraces, color: null },
      { name: 'Socket.IO', icon: SiSocketdotio, color: '#010101' },
      { name: 'Zod', icon: SiZod, color: '#3E67B1' },
    ],
  },
  {
    group: 'Data',
    items: [
      { name: 'PostgreSQL', icon: SiPostgresql, color: '#4169E1' },
      { name: 'Prisma', icon: SiPrisma, color: '#2D3748' },
      { name: 'Redis', icon: SiRedis, color: '#FF4438' },
    ],
  },
  {
    group: 'Async & distributed',
    items: [
      { name: 'BullMQ', icon: LuListOrdered, color: null },
      { name: 'Redis pub/sub', icon: LuRadioTower, color: null },
      { name: 'Event-driven design', icon: LuWorkflow, color: null },
      { name: 'Idempotency', icon: LuRepeat, color: null },
    ],
  },
  {
    group: 'Cloud & DevOps',
    items: [
      { name: 'AWS — EC2, ALB, ASG, ElastiCache', icon: FaAws, color: '#FF9900' },
      { name: 'Terraform', icon: SiTerraform, color: '#844FBA' },
      { name: 'Docker', icon: SiDocker, color: '#2496ED' },
      { name: 'GitHub Actions', icon: SiGithubactions, color: '#2088FF' },
      { name: 'CloudWatch', icon: LuActivity, color: null },
    ],
  },
  {
    group: 'Practices',
    items: [
      { name: 'Load testing (k6)', icon: SiK6, color: '#7D64FF' },
      { name: 'Infrastructure as code', icon: LuFileCode, color: null },
      { name: 'CI/CD on every merge', icon: LuGitBranch, color: null },
      { name: 'Alerting before users notice', icon: LuBellRing, color: null },
      { name: 'System design', icon: LuNetwork, color: null },
    ],
  },
  {
    group: 'Frontend',
    items: [
      { name: 'Next.js', icon: SiNextdotjs, color: '#000000' },
      { name: 'React', icon: SiReact, color: '#61DAFB' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06B6D4' },
      { name: 'Framer Motion', icon: SiFramer, color: '#0055FF' },
    ],
  },
]
