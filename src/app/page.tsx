'use client'

import { ViewTransition } from 'react'
import Link from 'next/link'
import { LiquidText, settleNext } from '@/components/LiquidText'
import { ScaleFigure } from '@/components/anatomy/scale/Scale'
import { GateFigure } from '@/components/anatomy/gate/Gate'
import { ReviewFigure } from '@/components/anatomy/review/Review'
import { Receipt } from '@/components/Receipt'
import { VoxelCard } from '@/components/VoxelCard'
import { LabBar, LabFooter } from '@/components/Chrome'
import { EDUCATION, EXPERIENCE, IMPACT, LINKS, PRINCIPLES, PROJECTS, type LabProject } from '@/content/lab'
import { Toolkit } from '@/components/Toolkit'
import { CopyEmail } from '@/components/CopyEmail'
import { Odometer } from '@/components/Odometer'
import { ScrollWords } from '@/components/ScrollWords'
import { nowData } from '@/content/now'

/*
 * Every top-level section is a `.screen`: it fills exactly one viewport below
 * the nav bar and its content is sized to fit there — down to a 13" laptop at
 * 100% (~1470 × 650 usable) — so each section reads as one composed page.
 */

/* Each project has its own bench: the rack, the review gantry, the lockbox. */
const FIGURES: Record<LabProject['id'], { fig: React.ReactNode; cap: string }> = {
  quizbuzz: { fig: <ScaleFigure still={0.6} bare />, cap: '8 servers, 7,500 sockets' },
  prsentinel: { fig: <ReviewFigure still={0.3} bare />, cap: 'wave 1 of 2' },
  smartformflow: { fig: <GateFigure still={0.5} bare />, cap: 'recorded once' },
}

function ProjectCard({ p }: { p: LabProject }) {
  return (
    <li className="work-card">
      <Link href={p.href!} className="work-card-link" onClick={() => settleNext(p.id)}>
        <figure className="work-card-fig">
          {FIGURES[p.id].fig}
          <figcaption>
            <span>Fig. {p.n}</span>
            <span>{FIGURES[p.id].cap}</span>
          </figcaption>
        </figure>
        <p className="work-meta">
          <span>{p.n}</span>
          <span>{p.kind}</span>
        </p>
        {/* Morphs into the case-study cover title on navigation. */}
        <ViewTransition name={`title-${p.id}`} share="morph">
          <h3 className="work-title">{p.name}</h3>
        </ViewTransition>
        <p className="work-summary">{p.summary}</p>
        <dl className="work-outcomes">
          {p.outcomes.map((o) => (
            <div key={o.label}>
              <dt>{o.n}</dt>
              <dd>{o.label}</dd>
            </div>
          ))}
        </dl>
        <span className="work-cta">
          {p.cta} <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  )
}

export default function Home() {
  return (
    <main className="lab">
      <LabBar />

      {/* ── Cover: who and what ───────────────────────────────── */}
      <section className="screen cover">
        <div className="cover-mast">
          <LiquidText text="AUSTIN" as="h1" trigger="load" delay={150} stagger={70} duration={1600} className="cover-name" />
          <span className="cover-serif">Makasare</span>
        </div>

        <div className="cover-grid">
          <p className="cover-intro">
            <em>Backend-focused full-stack engineer.</em> I design, build and ship complete products — and the
            unglamorous systems underneath them: queues that never lose a job, locks that never deadlock, infrastructure
            that holds at 3am.
          </p>

          <div className="cover-meta">
            <dl>
              <dt>Builds</dt>
              <dd>Backends, real-time systems &amp; cloud infrastructure</dd>
              <dt>Ships</dt>
              <dd>End to end — architecture, CI/CD, deploy, load test</dd>
              <dt>Based</dt>
              <dd>India — remote-ready</dd>
            </dl>
            <p className="cover-status">
              <span className="cover-dot" /> Open to SDE-1 full-stack &amp; backend roles
            </p>
            <div className="cover-ctas">
              <a href="#work" className="cover-cta">
                See the work <span aria-hidden>↓</span>
              </a>
              <a href={LINKS.resume} target="_blank" rel="noopener noreferrer" className="cover-cta cover-cta--ghost">
                Résumé ↗
              </a>
            </div>
          </div>
        </div>

        {/* Anchors the bottom of the first screen. */}
        <div className="cover-rail">
          <a href="#about" className="cover-scroll">
            <span className="cover-scroll-line" aria-hidden />
            Scroll
          </a>
          <Link href="/prsentinel" className="cover-now" onClick={() => settleNext('prsentinel')}>
            <span className="cover-dot" /> Now building <strong>PR Sentinel</strong> — an AI pull-request reviewer{' '}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* ── The short version ─────────────────────────────────── */}
      <section className="impact" aria-label="Impact in numbers">
        <p className="lab-kicker">The short version — from production, not side projects</p>
        <dl className="impact-grid">
          {IMPACT.map((m) => (
            <div key={m.label}>
              <dt>
                <Odometer value={m.n} />
              </dt>
              <dd>{m.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── About: who I am, and how I build ──────────────────── */}
      <section id="about" className="screen about">
        <span className="lab-kicker screen-kicker">About</span>
        <div className="about-grid">
          <VoxelCard />
          <div className="about-copy">
            <LiquidText text="Building things that don’t break." as="h2" className="lab-h2" />
            <ScrollWords
              className="about-body"
              text="I’m a backend-focused full-stack engineer with an MSc and BSc in Computer Science. I build production systems — job queues, real-time APIs, auto-scaling infrastructure — and I’d rather a system be boring and correct than clever and fragile."
            />
            <dl className="profile-facts">
              <dt>Building</dt>
              <dd>{nowData.building}</dd>
              <dt>Reading</dt>
              <dd>{nowData.learning}</dd>
            </dl>
          </div>
          <ol className="principles">
            {PRINCIPLES.map((p, i) => (
              <li key={p.t}>
                <span className="principles-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Selected work: all three on one screen ────────────── */}
      <section id="work" className="screen work" aria-labelledby="work-h">
        <header className="screen-head">
          <span className="lab-kicker">Selected work · 03</span>
          <LiquidText text="What I’ve shipped" as="h2" className="lab-h2" />
        </header>
        <ol className="work-grid">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </ol>
      </section>

      {/* ── Experience & education ────────────────────────────── */}
      <section id="experience" className="screen exp" aria-labelledby="exp-h">
        <span className="lab-kicker screen-kicker">Experience</span>
        <div className="exp-grid">
          <div className="exp-side">
            <LiquidText text="Where I work" as="h2" className="lab-h2" />
            <div className="exp-edu">
              <span className="lab-kicker">Education</span>
              {EDUCATION.map((ed) => (
                <div key={ed.what} className="exp-edu-row">
                  <strong>{ed.what}</strong>
                  <span>
                    {ed.where} · {ed.when}
                  </span>
                  <span className="exp-note">{ed.note}</span>
                </div>
              ))}
            </div>
          </div>
          {EXPERIENCE.map((e) => (
            <article key={e.org} className="exp-job">
              <header>
                <h3>{e.role}</h3>
                <span className="exp-when">{e.when}</span>
                <p>
                  <strong>{e.org}</strong> — {e.where}
                </p>
              </header>
              <ul>
                {e.points.map((pt) => (
                  <li key={pt.k}>
                    <span className="exp-k">{pt.k}</span>
                    <span>{pt.t}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Capabilities ──────────────────────────────────────── */}
      <Toolkit />

      {/* ── Contact ───────────────────────────────────────────── */}
      <section id="contact" className="screen contact">
        <Receipt
          head={
            <>
              <span className="lab-kicker">Contact</span>
              <LiquidText text="Send a request." as="h2" className="lab-h2" />
              <p className="lab-dek">Hiring or building something? Pick a message, add your name and email, press the key.</p>
            </>
          }
          foot={
            <>
              <ul className="contact-inline">
                <li>
                  <CopyEmail />
                </li>
                <li>
                  <a href={LINKS.cal} target="_blank" rel="noopener noreferrer">
                    Book a call <span aria-hidden>↗</span>
                  </a>
                </li>
                <li>
                  <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn <span aria-hidden>↗</span>
                  </a>
                </li>
                <li>
                  <a href={LINKS.github} target="_blank" rel="noopener noreferrer">
                    GitHub <span aria-hidden>↗</span>
                  </a>
                </li>
                {LINKS.twitter && (
                  <li>
                    <a href={LINKS.twitter} target="_blank" rel="noopener noreferrer">
                      X <span aria-hidden>↗</span>
                    </a>
                  </li>
                )}
                <li>
                  <a href={LINKS.resume} target="_blank" rel="noopener noreferrer">
                    Résumé <span aria-hidden>↗</span>
                  </a>
                </li>
              </ul>
              <p className="contact-note">
                <span className="cover-dot" /> Replies within a day · IST (UTC+5:30) · open to remote
              </p>
            </>
          }
        />
      </section>

      <LabFooter />
    </main>
  )
}
