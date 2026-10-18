import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Geist, Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google'
import { SmoothScroll } from '@/components/SmoothScroll'
import './globals.css'
import './site.css'

// Variable names match v1's layout so the type system (site.css) reads the same tokens.
const cond = Barlow_Condensed({ weight: '700', subsets: ['latin'], variable: '--font-suisseintlcond-fallback', display: 'swap' })
const mono = JetBrains_Mono({ weight: '400', subsets: ['latin'], variable: '--font-suisseintlmono-fallback', display: 'swap' })
const sans = Inter({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-suisseintl-fallback', display: 'swap' })
const display = Geist({ weight: ['700', '800', '900'], subsets: ['latin'], variable: '--font-hero-display', display: 'swap' })
const serif = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-lab-serif', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f1efe9',
}

export const metadata: Metadata = {
  // The subdomain v2 is deployed to; change here if you pick a different one.
  metadataBase: new URL('https://v2.austinmakasare.site'),
  title: {
    default: 'Austin Makasare — Backend-focused Full-Stack Engineer',
    template: '%s · Austin Makasare',
  },
  description:
    'Backend-focused full-stack engineer: real-time systems for 10,000+ concurrent users, async pipelines, and auto-scaling AWS infrastructure. Case studies: QuizBuzz, SmartFormFlow, PR Sentinel.',
  // v2 is a public test of a redesign; keep it out of search so it doesn't
  // compete with austinmakasare.site. Flip to index once it replaces v1.
  robots: { index: false, follow: false },
  // Link previews (chat apps, LinkedIn, Slack): the image comes from each route's opengraph-image.tsx.
  openGraph: {
    type: 'website',
    siteName: 'Austin Makasare',
    title: 'Austin Makasare — Backend-focused Full-Stack Engineer',
    description:
      'Real-time systems for 10,000+ concurrent users, async pipelines and auto-scaling AWS infrastructure. Case studies: QuizBuzz, PR Sentinel, SmartFormFlow.',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cond.variable} ${mono.variable} ${sans.variable} ${display.variable} ${serif.variable}`}
    >
      <head>
        {/* Before first paint: the saved theme, else the system's, so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;if(t==='dark')document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content='#121211'})}catch(e){}`,
          }}
        />
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
