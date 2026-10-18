# Austin Makasare — Portfolio v2

An editorial redesign of [austinmakasare.site](https://austinmakasare.site): a magazine-style landing page and three case studies, each with a scroll-driven architecture film that follows one request through the system.

- `/` — landing: who, impact, selected work, experience, about, toolkit, contact
- `/quizbuzz` — real-time quiz platform (WebSockets, BullMQ, auto-scaling AWS)
- `/smartformflow` — multi-tenant event SaaS (dedup, BYOK payments, async workers)
- `/prsentinel` — AI pull-request reviewer (agent waves, commit-keyed cache)

Built with Next.js 16, React 19, Lenis, react-icons and [Hairline](https://github.com/lucasmarkes/hairline) line figures. The site is `noindex` while it's being tested alongside v1.

## Develop

```bash
npm install
npm run dev   # http://localhost:3002
```

## Where things live

- `src/content/` — every fact on the site: `lab.ts` (profile, projects, experience, toolkit), `journeys.ts` (architecture films), `decisions.ts` (engineering decisions).
- `src/components/SystemJourney.tsx` — the scroll-driven architecture engine; renders any `Journey` from `journeys.ts`.
- `src/components/CasePage.tsx` — the shared case-study template.
- `public/figures/` — custom Hairline figures (`autoscale`, `dedupe`) and the unmodified Hairline kernel they run on.

## Contact form

`POST /api/contact` sends through [Resend](https://resend.com). Put these in `.env.local` (and in the host's environment):

```
RESEND_API_KEY=re_...                       # required; without it the receipt prints a 503
CONTACT_TO=you@example.com                  # optional, defaults to the email in src/content/lab.ts
CONTACT_FROM="Portfolio <hi@yourdomain>"    # optional; default onboarding@resend.dev only delivers to your own Resend account email
```

Each send carries an `Idempotency-Key`; a retry of a delivered message is replayed, not re-sent.

## Measuring

Lighthouse scores on `/status` and `/colophon` are dated, not live. Re-measure with
`npx lighthouse@13.5.0 http://localhost:3002/ --output=json` against a production build, then update `LIGHTHOUSE` in `src/content/site.ts`.
