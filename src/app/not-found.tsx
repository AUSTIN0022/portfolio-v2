'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LabBar, LabFooter } from '@/components/Chrome'
import { LiquidText } from '@/components/LiquidText'
import { PROJECTS } from '@/content/lab'

/** Any unknown route: logged like a request that failed fast, in the site's own paper and ink. */
export default function NotFound() {
  const path = usePathname()
  return (
    <main className="lab">
      <title>Not found · Austin Makasare</title>
      <LabBar />
      <section className="screen nf">
        <p className="nf-log">
          <span>GET</span> {path} <span className="nf-arrow">→</span> <strong>404 Not Found</strong>
        </p>
        <LiquidText text="404" as="h1" trigger="load" delay={100} stagger={90} duration={1400} className="nf-code" />
        <p className="lab-dek">
          No route matched this request. It failed fast, as designed — nothing was retried and nothing was lost.
        </p>
        <ul className="nf-links">
          <li>
            <Link href="/">Front page</Link>
          </li>
          {PROJECTS.filter((p) => p.href?.startsWith('/')).map((p) => (
            <li key={p.id}>
              <Link href={p.href!}>{p.name}</Link>
            </li>
          ))}
          <li>
            <Link href="/#contact">Contact</Link>
          </li>
        </ul>
      </section>
      <LabFooter />
    </main>
  )
}
