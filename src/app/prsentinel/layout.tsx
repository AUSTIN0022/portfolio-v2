import { caseMeta } from '@/lib/og'

// The page is a client component, so its title, description and link-preview text live here.
export const metadata = caseMeta('prsentinel')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
