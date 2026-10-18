import type { Metadata } from 'next'
import { LabBar, LabFooter } from '@/components/Chrome'
import { LiquidText } from '@/components/LiquidText'
import { StatusLive } from '@/components/StatusLive'
import { BUILD, LIGHTHOUSE } from '@/content/site'

export const metadata: Metadata = {
  title: 'Status',
  description: 'The build running this site, how fast it answers you right now, and its Lighthouse scores.',
}

/** The site's own status page — observability by default, applied to the portfolio. */
export default function Status() {
  return (
    <main className="lab">
      <LabBar />
      <section className="screen doc">
        <span className="lab-kicker">Status</span>
        <LiquidText text="How this site is doing." as="h1" trigger="load" className="lab-h2 doc-title" />
        <p className="lab-dek">
          I write about observability, so the portfolio reports on itself. Two things here are live; the rest is a
          dated measurement and says so.
        </p>

        <div className="doc-grid">
          <StatusLive />

          <section className="doc-block" aria-labelledby="build-h">
            <header className="doc-block-head">
              <h2 id="build-h">Build — baked in at deploy</h2>
            </header>
            <dl className="doc-kv">
              <dt>Version</dt>
              <dd>v{BUILD.version}</dd>
              <dt>Commit</dt>
              <dd>{BUILD.commit}</dd>
              <dt>Built</dt>
              <dd>{BUILD.builtAt ? BUILD.builtAt.replace('T', ' ').slice(0, 16) + ' UTC' : 'unknown'}</dd>
              <dt>Machine-readable</dt>
              <dd>
                <a href="/api/status">/api/status</a> · or <code>curl</code> the home page
              </dd>
            </dl>
          </section>

          <section className="doc-block" aria-labelledby="lh-h">
            <header className="doc-block-head">
              <h2 id="lh-h">Lighthouse — measured, not live</h2>
            </header>
            {LIGHTHOUSE.scores.length ? (
              <>
                <ul className="doc-scores">
                  {LIGHTHOUSE.scores.map((s) => (
                    <li key={s.k} data-grade={s.v >= 90 ? 'good' : s.v >= 50 ? 'mid' : 'bad'}>
                      <strong>{s.v}</strong>
                      <span>{s.k}</span>
                    </li>
                  ))}
                </ul>
                <p className="doc-foot">
                  {LIGHTHOUSE.target} · {LIGHTHOUSE.measured}. SEO reads lower on purpose while this site is marked
                  noindex.
                </p>
              </>
            ) : (
              <p className="doc-foot">Not measured yet.</p>
            )}
          </section>
        </div>
      </section>
      <LabFooter />
    </main>
  )
}
