'use client'

import { useEffect, useState } from 'react'
import { LuCheck, LuCopy } from 'react-icons/lu'
import { LINKS } from '@/content/lab'

/**
 * The email address as a mailto link with an icon-only copy button that
 * appears on hover (always visible on touch). Clicking copies it and the icon
 * turns into a check.
 */
export function CopyEmail({ label, className }: { label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(LINKS.email)
      setCopied(true)
      return
    } catch {
      // Clipboard API refused (permissions, unfocused document, insecure context) — fall back below.
    }
    const ta = document.createElement('textarea')
    ta.value = LINKS.email
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    if (ok) setCopied(true)
  }

  return (
    <span className={`copy-email ${className ?? ''}`}>
      <a href={`mailto:${LINKS.email}`}>{label ?? LINKS.email}</a>
      <button
        type="button"
        onClick={copy}
        className="copy-email-btn"
        data-copied={copied ? '' : undefined}
        aria-label={copied ? 'Email copied' : 'Copy email address'}
      >
        {copied ? <LuCheck aria-hidden /> : <LuCopy aria-hidden />}
      </button>
    </span>
  )
}
