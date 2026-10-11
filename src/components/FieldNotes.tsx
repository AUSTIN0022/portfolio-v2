'use client'

import { useState } from 'react'
import { LiquidText } from './LiquidText'

export type FieldNote = {
  k: string
  n: string
  cap: string
  /** Renders the figure; pass `onRead` through so its live read-out shows under the note. */
  fig: (onRead: (t: string) => void) => React.ReactNode
}

/** Field notes: a project's key numbers, each drawn as a figure that answers the pointer. */
export function FieldNotes({ notes, label }: { notes: FieldNote[]; label: string }) {
  const [reads, setReads] = useState<Record<string, string>>({})
  const onRead = (k: string) => (t: string) => setReads((r) => (r[k] === t ? r : { ...r, [k]: t }))
  return (
    <section className="lab-section notes" aria-label={`${label} by the numbers`}>
      <header className="lab-sechead">
        <span className="lab-kicker">Field notes</span>
        <LiquidText text="By the numbers" as="h2" className="lab-h2" />
      </header>
      <div className="notes-grid">
        {notes.map((n) => (
          <figure key={n.k} className="note">
            <div className="note-fig">{n.fig(onRead(n.k))}</div>
            <figcaption>
              <span className="note-n">{n.n}</span>
              <span className="note-cap">{n.cap}</span>
              <span className="note-read">{reads[n.k] || 'rest'}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
