'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LINKS } from '@/content/lab'
import { SITE_HOST } from '@/content/site'
import { CommandPalette } from './CommandPalette'
import { ThemeToggle } from './ThemeToggle'
import { DotName } from './DotName'

function Clock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
    setT(fmt())
    const id = setInterval(() => setT(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>IST {t}</span>
}

const NAV = [
  { label: 'About', href: '/#about' },
  { label: 'Work', href: '/#work' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Contact', href: '/#contact' },
]

/** The running bar shared by every page. */
export function LabBar() {
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <div className="lab-bar">
        <Link href="/" className="lab-bar-mark">
          A·M
        </Link>
        <nav className="lab-bar-nav" aria-label="Sections">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="lab-bar-right">
          <Clock />
          <ThemeToggle />
          <a href={LINKS.resume} target="_blank" rel="noopener noreferrer">
            Résumé ↗
          </a>
          {/* Below 900px the section links fold into a native popover menu. */}
          <button type="button" className="lab-menu-btn" popoverTarget="lab-menu" aria-label="Open menu">
            Menu
          </button>
        </span>
      </div>
      <nav id="lab-menu" popover="auto" className="lab-menu" aria-label="Menu">
        <button type="button" className="lab-menu-close" popoverTarget="lab-menu" popoverTargetAction="hide">
          Close
        </button>
        <ol>
          {NAV.map((n, i) => (
            <li key={n.label}>
              <Link href={n.href} onClick={() => document.getElementById('lab-menu')?.hidePopover()}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {n.label}
              </Link>
            </li>
          ))}
        </ol>
        <p>
          <a href={LINKS.resume} target="_blank" rel="noopener noreferrer">Résumé ↗</a>
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </p>
      </nav>
      <CommandPalette />
      {/* Skip-link target: focus lands just past the bar. */}
      <span id="content" tabIndex={-1} />
    </>
  )
}

export function LabFooter() {
  return (
    <footer className="lab-foot">
      <DotName text="AUSTIN" />      <div className="lab-foot-row">
        <span>© 2026 Austin Makasare</span>
        <span>
          <Link href="/status">Status</Link> · <Link href="/colophon">Colophon &amp; changelog</Link> · try{' '}
          <code>curl {SITE_HOST}</code>
        </span>
        <span>
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub</a> ·{' '}
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> ·{' '}
          <a href="https://austinmakasare.site">v1 ↗</a>
        </span>
      </div>
    </footer>
  )
}
