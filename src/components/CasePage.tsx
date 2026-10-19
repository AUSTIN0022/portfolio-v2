'use client'

import { Fragment, ViewTransition } from 'react'
import Link from 'next/link'
import { LiquidText, settleNext } from './LiquidText'
import { SystemJourney } from './SystemJourney'
import { FieldNotes, type FieldNote } from './FieldNotes'
import { Decisions } from './Decisions'
import { LabBar, LabFooter } from './Chrome'
import { PROJECTS, type LabProject } from '@/content/lab'
import type { Journey } from '@/content/journeys'
import type { Decision } from '@/content/decisions'

/**
 * The shared shape of a case study: cover → field notes → the dark
 * scroll-driven architecture film → the decisions and challenges → the
 * next case study. Each project page only supplies its data.
 */
export function CasePage({
  id,
  meta,
  notes,
  journey,
  opener,
  decisions,
  next,
  demo,
  mechanism,
}: {
  id: LabProject['id']
  meta: { k: string; v: string }[]
  notes: FieldNote[]
  journey: Journey
  opener: { title: string; dek: string }
  decisions: Decision[]
  next: LabProject['id']
  /** An optional interactive piece shown right after the cover. */
  demo?: React.ReactNode
  /** An optional scroll-driven Anatomy figure, shown between the architecture film and the decisions. */
  mechanism?: React.ReactNode
}) {
  const p = PROJECTS.find((x) => x.id === id)!
  const nx = PROJECTS.find((x) => x.id === next)!
  const nextExternal = !!nx.href?.startsWith('http')

  return (
    <main className="lab">
      <LabBar />

      <section className="case-cover">
        <Link href="/#work" className="case-back">
          ← All work
        </Link>
        <p className="work-meta">
          <span>Case study {p.n}</span>
          <span>{p.kind}</span>
          {p.years && <span>{p.years}</span>}
        </p>
        <ViewTransition name={`title-${p.id}`} share="morph">
          <LiquidText
            text={p.name.toUpperCase()}
            settleKey={p.id}
            as="h1"
            trigger="load"
            delay={100}
            stagger={55}
            duration={1500}
            className="case-name"
            // Fit the full name on one line: Geist Black runs ~0.66em per capital at this tracking.
            style={{ fontSize: `clamp(28px, ${Math.min(19, 88 / (p.name.length * 0.66)).toFixed(2)}vw, 320px)` }}
          />
        </ViewTransition>
        <div className="case-grid">
          <p className="cover-intro">{p.summary}</p>
          <div className="cover-meta">
            <dl>
              {meta.map((m) => (
                <Fragment key={m.k}>
                  <dt>{m.k}</dt>
                  <dd>{m.v}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
        {p.repo && (
          <a href={p.repo} target="_blank" rel="noopener noreferrer" className="case-repo">
            Source on GitHub <span aria-hidden>↗</span>
          </a>
        )}
        <dl className="case-outcomes work-outcomes">
          {p.outcomes.map((o) => (
            <div key={o.label}>
              <dt>{o.n}</dt>
              <dd>{o.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {demo}

      <FieldNotes notes={notes} label={p.name} />

      <section id="journey" className="feature-open">
        <span className="lab-kicker lab-kicker--dark">The architecture</span>
        <LiquidText text={opener.title} as="h2" className="feature-h" />
        <p className="feature-dek">{opener.dek}</p>
        <span className="feature-hint" aria-hidden>
          Scroll ↓
        </span>
      </section>
      <SystemJourney journey={journey} />

      {mechanism}

      <section className="lab-section decisions" aria-label="Engineering decisions">
        <header className="lab-sechead">
          <span className="lab-kicker">Decisions &amp; challenges · {String(decisions.length).padStart(2, '0')}</span>
          <LiquidText text="The calls that mattered" as="h2" className="lab-h2" />
        </header>
        <Decisions items={decisions} name={id} />
      </section>

      <section className="lab-section case-next">
        <span className="lab-kicker">Next case study</span>
        {nextExternal ? (
          <a href={nx.href!} target="_blank" rel="noopener noreferrer" className="case-next-link">
            <span className="case-next-name">{nx.name}</span>
            <span className="case-next-dek">{nx.summary}</span>
            <span className="work-cta">
              {nx.cta} <span aria-hidden>↗</span>
            </span>
          </a>
        ) : (
          <Link href={nx.href!} className="case-next-link" onClick={() => settleNext(nx.id)}>
            <ViewTransition name={`title-${nx.id}`} share="morph">
              <span className="case-next-name">{nx.name}</span>
            </ViewTransition>
            <span className="case-next-dek">{nx.summary}</span>
            <span className="work-cta">
              {nx.cta} <span aria-hidden>→</span>
            </span>
          </Link>
        )}
      </section>

      <LabFooter />
    </main>
  )
}
