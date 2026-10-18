/**
 * Facts about the site itself, shared by /status and /colophon.
 * LIGHTHOUSE is a dated measurement, not a live feed: re-run it (see
 * README) and update the numbers when the page changes.
 */

/** Where this deployment lives; update when v2 replaces v1 on the main domain. */
export const SITE_HOST = 'v2.austinmakasare.site'

export const BUILD = {
  version: process.env.NEXT_PUBLIC_VERSION || '2.x',
  commit: process.env.NEXT_PUBLIC_COMMIT || 'local',
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT || '',
}

export const LIGHTHOUSE = {
  measured: 'measured 2026-10-18',
  target: 'Home page · local production build · mobile emulation',
  scores: [
    { k: 'Performance', v: 89 },
    { k: 'Accessibility', v: 97 },
    { k: 'Best practices', v: 100 },
    { k: 'SEO', v: 63 },
  ] as { k: string; v: number }[],
}

export const STACK = [
  ['Framework', 'Next.js 16 (App Router, Turbopack), React 19, TypeScript'],
  ['Motion', 'React <ViewTransition>, CSS scroll-driven animation, the Web Animations API, Lenis for smooth scroll'],
  ['Figures', 'Hairline kernel — the project figures are SVG drawn by a small runtime, not images'],
  ['Native first', 'Popover API for the menu, <dialog> for ⌘K, @starting-style for entrances'],
  ['Link previews', 'next/og renders one card per page at build time'],
  ['Mail', 'A route handler posts to Resend with an idempotency key'],
] as const

export const TYPE = [
  ['Geist', 'Display — the AUSTIN mast'],
  ['Barlow Condensed', 'Case-study titles'],
  ['Instrument Serif', 'Voice — italics and decks'],
  ['JetBrains Mono', 'Labels, receipts, anything that is a system speaking'],
] as const

export const CHANGELOG = [
  {
    v: '2.4.0',
    d: '2026-10-18',
    t: 'The site shows its working',
    n: [
      '`curl` this site and you get a plain-text card with an ASCII portrait.',
      '/status: build, live round-trip times measured from your browser, and dated Lighthouse scores.',
      'The contact form sends. The receipt prints the real request ID, idempotency key, status and latency.',
      'Light and dark, with a circle-reveal switch.',
      'This page.',
    ],
  },
  {
    v: '2.3.0',
    d: '2026-10-17',
    t: 'Nanites',
    n: ['The halftone portrait dissolves into the photograph dot by dot from the cursor, and re-forms from the edges.'],
  },
  {
    v: '2.2.0',
    d: '2026-10-12',
    t: 'Link previews and QuizBuzz in depth',
    n: [
      'A preview card per page, rendered at build time.',
      'QuizBuzz: fifteen real decisions and bugs, from heap exhaustion to a drifted Terraform state.',
    ],
  },
  {
    v: '2.1.0',
    d: '2026-10-12',
    t: 'Polish and accessibility',
    n: [
      'Project titles morph into the case-study cover on navigation.',
      '⌘K command menu, skip link, focus rings, a native popover menu on small screens.',
      'Odometer numbers, scroll-lit paragraph, outlined wordmark, an illustrative PR Sentinel review replay.',
      'A 404 that reads like a failed request.',
    ],
  },
  {
    v: '2.0.1',
    d: '2026-10-11',
    t: 'One screen per section',
    n: ['Every section was recomposed to fit one laptop viewport, and the facts were checked against the résumé.'],
  },
  {
    v: '2.0.0',
    d: '2026-10-11',
    t: 'First cut',
    n: ['Editorial redesign: newspaper type, hairline figures, receipt printer, scroll-driven architecture films.'],
  },
] as const
