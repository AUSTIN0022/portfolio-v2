import type { NextConfig } from "next";
import { execSync } from 'node:child_process'

// Stamped into the build so /status and the colophon can say what is running.
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return 'local'
    }
  })()

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT: commit,
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString(),
    NEXT_PUBLIC_VERSION: process.env.npm_package_version ?? '',
  },
  // Route navigations run as React view transitions: project titles morph
  // from the landing card into the case-study cover (see ProjectCard/CasePage).
  experimental: { viewTransition: true },
  // `curl <site>` and friends get a plain-text card instead of HTML (app/api/card).
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'header', key: 'user-agent', value: '(curl|Wget|HTTPie|xh)/.*' }],
          destination: '/api/card',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
};

export default nextConfig;
