'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { LINKS, PROJECTS } from '@/content/lab'
import { settleNext } from './LiquidText'

type Item = { group: string; label: string; hint: string; href?: string; external?: boolean; copy?: boolean; id?: string }

const ITEMS: Item[] = [
  { group: 'Go to', label: 'Front page', hint: '/', href: '/' },
  { group: 'Go to', label: 'About', hint: '01', href: '/#about' },
  { group: 'Go to', label: 'Work', hint: '02', href: '/#work' },
  { group: 'Go to', label: 'Experience', hint: '03', href: '/#experience' },
  { group: 'Go to', label: 'Contact', hint: '04', href: '/#contact' },
  ...PROJECTS.filter((p) => p.href?.startsWith('/')).map((p) => ({
    group: 'Case studies',
    label: p.name,
    hint: p.kind,
    href: p.href!,
    id: p.id,
  })),
  { group: 'Reach me', label: 'Copy email address', hint: LINKS.email, copy: true },
  { group: 'Reach me', label: 'Book a call', hint: 'cal.com', href: LINKS.cal, external: true },
  { group: 'Reach me', label: 'Résumé', hint: 'PDF', href: LINKS.resume, external: true },
  { group: 'Reach me', label: 'GitHub', hint: 'AUSTIN0022', href: LINKS.github, external: true },
  { group: 'Reach me', label: 'LinkedIn', hint: 'in/austin-makasare', href: LINKS.linkedin, external: true },
  { group: 'Reach me', label: 'Version 1 of this site', hint: 'austinmakasare.site', href: 'https://austinmakasare.site', external: true },
]

/**
 * ⌘K / Ctrl+K — jump anywhere, copy the email, open a link. A native modal
 * <dialog> (focus trap, Esc, backdrop) with a filter box; arrows move,
 * Enter follows. Items are real links, so smooth scroll and the page
 * transitions behave exactly as they do from the page itself.
 */
export function CommandPalette() {
  const dialog = useRef<HTMLDialogElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  const items = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? ITEMS.filter((it) => `${it.label} ${it.hint} ${it.group}`.toLowerCase().includes(s)) : ITEMS
  }, [q])

  const open = () => {
    setQ('')
    setActive(0)
    setCopied(false)
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (dialog.current?.open) close()
        else open()
      }
    }
    const onOpen = () => open()
    window.addEventListener('keydown', onKey)
    window.addEventListener('palette:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('palette:open', onOpen)
    }
  }, [])

  useEffect(() => {
    list.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LINKS.email)
      setCopied(true)
      setTimeout(close, 700)
    } catch {
      window.location.href = `mailto:${LINKS.email}`
    }
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const d = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + d + items.length) % Math.max(items.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      list.current?.querySelector<HTMLElement>('[data-active]')?.click()
    }
  }

  let lastGroup = ''
  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label="Command menu"
      data-lenis-prevent
      onClick={(e) => e.target === dialog.current && close()}
    >
      <div className="palette-box">
        <input
          className="palette-input"
          placeholder="Jump to a section, a case study, or a link…"
          value={q}
          autoFocus
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={onInputKey}
          aria-label="Filter commands"
        />
        <ul ref={list} className="palette-list">
          {items.length === 0 && <li className="palette-empty">No match — try “work”, “email” or a project name.</li>}
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? (lastGroup = it.group) : null
            const props = {
              className: 'palette-item',
              'data-active': i === active ? '' : undefined,
              onMouseEnter: () => setActive(i),
            }
            const body = (
              <>
                <span>{it.copy && copied ? 'Copied ✓' : it.label}</span>
                <span className="palette-hint">
                  {it.hint}
                  {it.external ? ' ↗' : ''}
                </span>
              </>
            )
            return (
              <li key={it.label}>
                {head && <p className="palette-group">{head}</p>}
                {it.copy ? (
                  <button type="button" {...props} onClick={copy}>
                    {body}
                  </button>
                ) : it.external ? (
                  <a {...props} href={it.href} target="_blank" rel="noopener noreferrer" onClick={close}>
                    {body}
                  </a>
                ) : (
                  <Link
                    {...props}
                    href={it.href!}
                    onClick={() => {
                      if (it.id) settleNext(it.id)
                      close()
                    }}
                  >
                    {body}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
        <p className="palette-foot">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
        </p>
      </div>
    </dialog>
  )
}
