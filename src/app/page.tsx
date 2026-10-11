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

/* Each project is drawn by the figure that acts out what it does. */
function ProjectFigure({ id, onRead }: { id: LabProject['id']; onRead: (t: string) => void }) {
  if (id === 'quizbuzz') return <Relay play intensity={0.6} onRead={onRead} />
  if (id === 'smartformflow') return <CustomFigure name="dedupe" play onRead={onRead} />
  return <Branches play intensity={0.6} onRead={onRead} />
}

const FIG_NAME: Record<LabProject['id'], string> = {
  quizbuzz: 'one request, hop by hop',
  smartformflow: 'contacts, deduplicated',
  prsentinel: 'a branch, reviewed',
}

function ProjectRow({ p }: { p: LabProject }) {
  const [read, setRead] = useState('')
  const external = !!p.href?.startsWith('http')
  const body = (
    <>
      <div className="work-copy">
        <p className="work-meta">
          <span>{p.n}</span>
          <span>{p.kind}</span>
          {p.years && <span>{p.years}</span>}
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
        <ul className="work-stack" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <span className="work-cta" data-soon={p.href ? undefined : ''}>
          {p.cta} {p.href && <span aria-hidden>{external ? '↗' : '→'}</span>}
        </span>
      </div>
      <figure className="work-plate">
        <ProjectFigure id={p.id} onRead={setRead} />
        <figcaption>
          <span>Fig. {p.n} — {FIG_NAME[p.id]}</span>
          <span>{read || 'rest'}</span>
        </figcaption>
      </figure>
    </>
  )
  return (
    <li className="work-item">
      {p.href && external ? (
        <a href={p.href} target="_blank" rel="noopener noreferrer" className="work-row">
          {body}
        </a>
      ) : p.href ? (
        <Link href={p.href} className="work-row">
          {body}
        </Link>
      ) : (
        <div className="work-row">{body}</div>
      )}
    </li>
  )
}

export default function LabHome() {
  const job = EXPERIENCE[0]
  return (
    <main className="lab">
      <LabBar />

      {/* ── Cover: who, what, where, available ─────────────────── */}
      <section className="cover">
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
              <dt>Now</dt>
              <dd>
                {job.role}, {job.org}
              </dd>
              <dt>Experience</dt>
              <dd>1.5+ years in production</dd>
              <dt>Based</dt>
              <dd>India — remote-ready</dd>
            </dl>
            <p className="cover-status">
              <span className="cover-dot" /> Open to SDE-2 &amp; senior backend roles
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

        <LiquidText
          text="I build systems that don’t break."
          as="p"
          trigger="load"
          delay={900}
          stagger={22}
          className="cover-role"
        />
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

      {/* ── Selected work ─────────────────────────────────────── */}
      <section id="work" className="lab-section work" aria-labelledby="work-h">
        <header className="lab-sechead">
          <span className="lab-kicker">Selected work · 03</span>
          <LiquidText text="What I’ve shipped" as="h2" className="lab-h2" />
        </header>
        <ol className="work-list">
          {PROJECTS.map((p) => (
            <ProjectRow key={p.id} p={p} />
          ))}
        </ol>
      </section>

      {/* ── Experience & education ────────────────────────────── */}
      <section id="experience" className="lab-section exp" aria-labelledby="exp-h">
        <header className="exp-head">
          <span className="lab-kicker">Experience</span>
          <LiquidText text="Where I work" as="h2" className="lab-h2" />
        </header>
        <div className="exp-body">
          {EXPERIENCE.map((e) => (
            <article key={e.org} className="exp-job">
              <header>
                <h3>{e.role}</h3>
                <p>
                  <strong>{e.org}</strong> — {e.where}
                </p>
                <span className="exp-when">{e.when}</span>
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
          <div className="exp-edu">
            <span className="lab-kicker">Education</span>
            {EDUCATION.map((ed) => (
              <div key={ed.what} className="exp-edu-row">
                <strong>{ed.what}</strong>
                <span>{ed.where}</span>
                <span className="exp-when">{ed.when}</span>
                <span className="exp-note">{ed.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About & principles ────────────────────────────────── */}
      <section id="about" className="lab-section about">
        <div className="about-copy">
          <span className="lab-kicker">About</span>
          <LiquidText text="Building things that don’t break." as="h2" className="lab-h2" />
          <p className="lab-dek">
            I care about the unglamorous parts — the queue that never loses a job, the lock that never deadlocks.
          </p>
          <p className="lab-body lab-dropcap">
            I&apos;m a backend engineer finishing an MSc in Computer Science, building production-grade systems: from
            distributed job queues to APIs battle-tested under real concurrent load. I ship complete products —
            architecture, infrastructure, CI/CD and deployment — and I&apos;d rather a system be boring and correct than
            clever and fragile.
          </p>
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
      </section>

      {/* ── Capabilities ──────────────────────────────────────── */}
      <Toolkit />

      {/* ── Currently ─────────────────────────────────────────── */}
      <section className="lab-section contributor" aria-labelledby="now-h">
        <VoxelCard />
        <div className="contributor-copy">
          <span className="lab-kicker">Currently</span>
          <LiquidText text="Built block by block." as="h2" className="lab-h2" />
          <dl className="profile-facts">
            <dt>Building</dt>
            <dd>{nowData.building}</dd>
            <dt>Reading</dt>
            <dd>{nowData.learning}</dd>
            <dt>Open to</dt>
            <dd>{nowData.status}</dd>
          </dl>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────── */}
      <section id="contact" className="lab-section contact">
        <div className="contact-copy">
          <span className="lab-kicker">Contact</span>
          <LiquidText text="Send a request." as="h2" className="lab-h2" />
          <p className="lab-dek">Press the key. Every request gets a receipt — and a reply within a day.</p>
          <p className="contact-direct">
            Or directly: <CopyEmail />
          </p>
        </div>
        <Receipt />
      </section>

      <LabFooter />
    </main>
  )
}
