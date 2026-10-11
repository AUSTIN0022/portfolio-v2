'use client'

import { useState } from 'react'
import { PROJECTS, STACK } from '@/content/lab'
import { LiquidText } from './LiquidText'

const SHORT: Record<string, string> = { quizbuzz: 'QB', smartformflow: 'SFF', prsentinel: 'PRS' }

/** Which shipped projects list this tool in their stack ("AWS — EC2…" matches "AWS"). */
function usedIn(name: string) {
  const key = name.split(' — ')[0]
  return PROJECTS.filter((p) => p.stack.includes(key))
}

/**
 * The toolkit, with each technology's mark. "Colour" shows marks in their
 * official brand colours; "Ink" redraws every mark in the page's ink so the
 * section matches the two-tone system. Concepts (BullMQ, idempotency…) have
 * no brand mark and are always drawn in ink. Hovering a tool shows which of
 * the case studies use it.
 */
export function Toolkit() {
  const [mode, setMode] = useState<'colour' | 'ink'>('colour')
  return (
    <section className="lab-section stack" aria-labelledby="stack-h">
      <header className="lab-sechead">
        <span className="lab-kicker">Capabilities</span>
        <LiquidText text="The toolkit" as="h2" className="lab-h2" />
      </header>
      <div className="stack-bar">
        <span className="seg seg--sm" role="group" aria-label="Logo colours">
          {(['colour', 'ink'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </span>
      </div>
      <dl className="stack-grid" data-mode={mode}>
        {STACK.map((g) => (
          <div key={g.group}>
            <dt>{g.group}</dt>
            {g.items.map(({ name, icon: Icon, color }) => {
              const used = usedIn(name)
              return (
                <dd key={name}>
                  <span className="stack-mark" style={color && mode === 'colour' ? { color } : undefined} aria-hidden>
                    <Icon />
                  </span>
                  {name}
                  {used.length > 0 && (
                    <span className="stack-used" title={`Used in ${used.map((p) => p.name).join(', ')}`}>
                      {used.map((p) => SHORT[p.id]).join(' · ')}
                    </span>
                  )}
                </dd>
              )
            })}
          </div>
        ))}
      </dl>
    </section>
  )
}
