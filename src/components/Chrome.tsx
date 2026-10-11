'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LINKS } from '@/content/lab'

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
  { label: 'Work', href: '/#work' },
  { label: 'Experience', href: '/#experience' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

/** The running bar shared by every page. */
export function LabBar() {
  return (
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
        <a href={LINKS.resume} target="_blank" rel="noopener noreferrer">
          Résumé ↗
        </a>
      </span>
    </div>
  )
}

export function LabFooter() {
  return (
    <footer className="lab-foot">
      <p className="lab-foot-name" aria-hidden>
        MAKASARE
      </p>
      <div className="lab-foot-row">
        <span>© 2026 Austin Makasare</span>
        <span>Set in Geist, Barlow Condensed, Instrument Serif &amp; JetBrains Mono</span>
        <span>
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub</a> ·{' '}
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> ·{' '}
          <a href="https://austinmakasare.site">v1 ↗</a>
        </span>
      </div>
    </footer>
  )
}
