'use client'

import { useMemo, useRef, useState } from 'react'
import type { Decision } from '@/content/decisions'

const CARD_W = 340

/**
 * The decisions as a list, in the manner of an awards index: number, call,
 * area and the one number to keep. On a mouse, hovering a row parks a small
 * card beside the Area column, level with that row; moving to another row
 * glides it there and swaps its contents. Clicking (or Enter) opens the full
 * problem → approach → outcome, which is the whole interaction on touch.
 * Rows are native <details>, one open at a time.
 */
export function Decisions({ items, name }: { items: Decision[]; name: string }) {
  const [area, setArea] = useState<string | null>(null)
  const [hot, setHot] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const areas = useMemo(() => {
    const count = new Map<string, number>()
    for (const d of items) if (d.ref) count.set(d.ref, (count.get(d.ref) ?? 0) + 1)
    const repeated = [...count].filter(([, n]) => n > 1).map(([a]) => a)
    return repeated.length > 1 ? repeated : []
  }, [items])

  /** Park the card beside the Area column, just under the row (or over it, near the end), never on it. */
  const anchor = (row: HTMLElement) => {
    const box = root.current?.getBoundingClientRect()
    const areaCol = root.current?.querySelector('.dt-head > span:nth-child(3)')?.getBoundingClientRect()
    if (!box) return
    const r = row.getBoundingClientRect()
    const h = card.current?.offsetHeight ?? 200
    const x = (areaCol ? areaCol.left - box.left : box.width * 0.62) - CARD_W - 24
    const below = r.bottom - box.top + 8
    const y = below + h <= box.height ? below : Math.max(0, r.top - box.top - h - 8)
    setPos({ x: Math.max(0, x), y })
  }

  // Coming from nowhere, the card appears in place; between rows it glides.
  const show = (i: number) => (hot === null ? requestAnimationFrame(() => setHot(i)) : setHot(i))

  const d = hot === null ? null : items[hot]

  return (
    <div
      className="dt"
      ref={root}
      data-hot={hot !== null ? '' : undefined}
      onPointerLeave={() => setHot(null)}
    >
      {areas.length > 0 && (
        <div className="dt-filter" role="group" aria-label="Filter by area">
          <button type="button" aria-pressed={area === null} onClick={() => setArea(null)}>
            All · {items.length}
          </button>
          {areas.map((a) => (
            <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>
              {a} · {items.filter((x) => x.ref === a).length}
            </button>
          ))}
        </div>
      )}
      <div className="dt-head" aria-hidden>
        <span>#</span>
        <span>The call</span>
        <span>Area</span>
        <span>Worth remembering</span>
        <span />
      </div>
      <ol className="dt-rows">
        {items.map((it, i) =>
          area && it.ref !== area ? null : (
            <li
              key={it.title}
              data-hot={hot === i ? '' : undefined}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return
                anchor(e.currentTarget)
                show(i)
              }}
            >
              <details
                name={`dec-${name}`}
                className="dt-row"
                onToggle={(e) => e.currentTarget.open && setHot(null)}
              >
                <summary
                  onFocus={(e) => {
                    if (e.currentTarget.parentElement?.hasAttribute('open')) return
                    anchor(e.currentTarget.closest('li')!)
                    show(i)
                  }}
                  onBlur={() => setHot(null)}
                >
                  <span className="dt-n">{String(i + 1).padStart(2, '0')}</span>
                  <strong className="dt-title">{it.title}</strong>
                  <span className="dt-area">
                    {it.ref}
                    {it.status === 'designed' && <em>Designed</em>}
                  </span>
                  <span className="dt-metric">{it.metric}</span>
                  <span className="dt-plus" aria-hidden />
                </summary>
                <dl className="dt-body">
                  <div>
                    <dt>Problem</dt>
                    <dd>{it.problem}</dd>
                  </div>
                  <div>
                    <dt>Approach</dt>
                    <dd>{it.approach}</dd>
                  </div>
                  <div>
                    <dt>Outcome</dt>
                    <dd className="dt-outcome">{it.outcome}</dd>
                  </div>
                </dl>
              </details>
            </li>
          ),
        )}
      </ol>

      {/* Hover card (mouse only): one element, parked by the hot row, that swaps its contents. */}
      <div
        ref={card}
        className="dt-card"
        data-on={d ? '' : undefined}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-hidden
      >
        {d && (
          <div key={hot} className="dt-card-in">
            <p className="dt-card-meta">
              <span>{String((hot ?? 0) + 1).padStart(2, '0')}</span>
              {d.ref && <span>{d.ref}</span>}
              <span>{d.status === 'shipped' ? 'Shipped' : 'Designed'}</span>
            </p>
            <p className="dt-card-metric">{d.metric}</p>
            <p className="dt-card-problem">{d.problem}</p>
            <p className="dt-card-outcome">{d.outcome}</p>
          </div>
        )}
      </div>
    </div>
  )
}
