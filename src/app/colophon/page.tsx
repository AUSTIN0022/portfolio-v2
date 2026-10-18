import type { Metadata } from 'next'
import Link from 'next/link'
import { LabBar, LabFooter } from '@/components/Chrome'
import { LiquidText } from '@/components/LiquidText'
import { BUILD, CHANGELOG, STACK, TYPE } from '@/content/site'

export const metadata: Metadata = {
  title: 'Colophon & changelog',
  description: 'How this site is made, what it is set in, and its release notes.',
}

/** Inline `code` spans in changelog lines. */
function Line({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}
    </>
  )
}

export default function Colophon() {
  return (
    <main className="lab">
      <LabBar />
      <section className="screen doc">
        <span className="lab-kicker">Colophon &amp; changelog</span>
        <LiquidText text="How it’s made." as="h1" trigger="load" className="lab-h2 doc-title" />
        <p className="lab-dek">
          A newspaper prints its colophon on the last page. This one also keeps its release notes — currently v
          {BUILD.version}. Live numbers are on <Link href="/status">/status</Link>.
        </p>

        <div className="doc-cols">
          <div>
            <section className="doc-block">
              <header className="doc-block-head">
                <h2>Built with</h2>
              </header>
              <dl className="doc-kv doc-kv--wide">
                {STACK.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="doc-block">
              <header className="doc-block-head">
                <h2>Set in</h2>
              </header>
              <dl className="doc-kv doc-kv--wide">
                {TYPE.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="doc-block" aria-labelledby="log-h">
            <header className="doc-block-head">
              <h2 id="log-h">Release notes</h2>
            </header>
            <ol className="doc-log">
              {CHANGELOG.map((r) => (
                <li key={r.v}>
                  <p className="doc-log-head">
                    <strong>v{r.v}</strong>
                    <time dateTime={r.d}>{r.d}</time>
                  </p>
                  <h3>{r.t}</h3>
                  <ul>
                    {r.n.map((line) => (
                      <li key={line}>
                        <Line text={line} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
      <LabFooter />
    </main>
  )
}
