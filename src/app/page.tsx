'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Branches, Relay } from '@lucasmarkes/hairline/react'
import { LiquidText } from '@/components/LiquidText'
import { Receipt } from '@/components/Receipt'
import { CustomFigure } from '@/components/CustomFigure'
import { VoxelCard } from '@/components/VoxelCard'
import { LabBar, LabFooter } from '@/components/Chrome'
import { EDUCATION, EXPERIENCE, IMPACT, LINKS, PRINCIPLES, PROJECTS, type LabProject } from '@/content/lab'
import { Toolkit } from '@/components/Toolkit'
import { CopyEmail } from '@/components/CopyEmail'
import { nowData } from '@/content/now'

/*
 * Every top-level section is a `.screen`: it fills exactly one viewport below
 * the nav bar and its content is sized to fit there — down to a 13" laptop at
 * 100% (~1470 × 650 usable) — so each section reads as one composed page.
 */

/* Each project is drawn by the figure that acts out what it does. */
function ProjectFigure({ id, onRead }: { id: LabProject['id']; onRead: (t: string) => void }) {
  if (id === 'quizbuzz') return <Relay play intensity={0.6} onRead={onRead} />
  if (id === 'smartformflow') return <CustomFigure name="dedupe" play onRead={onRead} />
  return <Branches play intensity={0.6} onRead={onRead} />
}

function ProjectCard({ p }: { p: LabProject }) {
  const [read, setRead] = useState('')
  return (
    <li className="work-card">
      <Link href={p.href!} className="work-card-link">
        <figure className="work-card-fig">
          <ProjectFigure id={p.id} onRead={setRead} />
          <figcaption>
            <span>Fig. {p.n}</span>
            <span>{read || 'rest'}</span>
          </figcaption>
        </figure>
        <p className="work-meta">
          <span>{p.n}</span>
          <span>{p.kind}</span>
        </p>
        <h3 className="work-title">{p.name}</h3>
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
      </section>

      {/* ── The short version ─────────────────────────────────── */}
      <section className="impact" aria-label="Impact in numbers">
        <p className="lab-kicker">The short version — from production, not side projects</p>
        <dl className="impact-grid">
          {IMPACT.map((m) => (
            <div key={m.label}>
              <dt>{m.n}</dt>
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
            <p className="about-body">
              I&apos;m a backend-focused full-stack engineer with an MSc and BSc in Computer Science. I build production
              systems — job queues, real-time APIs, auto-scaling infrastructure — and I&apos;d rather a system be boring and
              correct than clever and fragile.
            </p>
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
        <div className="contact-copy">
          <span className="lab-kicker">Contact</span>
          <LiquidText text="Send a request." as="h2" className="lab-h2" />
          <p className="lab-dek">Hiring for backend or full-stack? Press the key for a receipt — or reach me directly.</p>
          <ul className="contact-list">
            <li>
              <span className="contact-k">Email</span>
              <CopyEmail />
            </li>
            <li>
              <span className="contact-k">Talk</span>
              <a href={LINKS.cal} target="_blank" rel="noopener noreferrer">
                Book a call <span aria-hidden>↗</span>
              </a>
            </li>
            <li>
              <span className="contact-k">LinkedIn</span>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
                in/austin-makasare <span aria-hidden>↗</span>
              </a>
            </li>
            <li>
              <span className="contact-k">GitHub</span>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer">
                AUSTIN0022 <span aria-hidden>↗</span>
              </a>
            </li>
            {LINKS.twitter && (
              <li>
                <span className="contact-k">X</span>
                <a href={LINKS.twitter} target="_blank" rel="noopener noreferrer">
                  {LINKS.twitter.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '@')} <span aria-hidden>↗</span>
                </a>
              </li>
            )}
            <li>
              <span className="contact-k">Résumé</span>
              <a href={LINKS.resume} target="_blank" rel="noopener noreferrer">
                One page, PDF <span aria-hidden>↗</span>
              </a>
            </li>
          </ul>
          <p className="contact-note">
            <span className="cover-dot" /> Replies within a day · IST (UTC+5:30) · open to remote
          </p>
        </div>
        <Receipt />
      </section>

      <LabFooter />
    </main>
  )
}
