/**
 * ScrollWords — a paragraph that reads itself in: each word brightens from
 * faint to full ink as it scrolls up the screen. Pure CSS scroll-driven
 * animation (site.css → .scroll-words); browsers without it, and reduced
 * motion, show the paragraph as-is.
 */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  return (
    <p className={`scroll-words ${className ?? ''}`}>
      {text.split(' ').map((w, i) => (
        <span key={i}>{w} </span>
      ))}
    </p>
  )
}
