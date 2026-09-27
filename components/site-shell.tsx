'use client'

import { useEffect } from 'react'
import { HomeFooter, HomeHeader } from './home/home-experience'

type SiteShellProps = {
  children: React.ReactNode
  currentPath: string
  /** Pages that manage their own full-bleed sections skip the boxed content well. */
  fullBleed?: boolean
}

/**
 * Wraps every non-home page in the exact same header/footer the homepage
 * uses (HomeHeader/HomeFooter from components/home/home-experience.tsx),
 * so navigating between pages never swaps to a differently-laid-out header —
 * that mismatch was what looked like the header "shifting" on click.
 */
export function SiteShell({ children, currentPath, fullBleed = false }: SiteShellProps) {
  // Reveal-on-scroll for `.reveal` and `[data-reveal]` — covers both this
  // repo's older marketing pages and the matchday design system's own markers.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = document.querySelectorAll('.reveal:not(.is-visible), [data-reveal]:not(.is-visible)')
    if (!targets.length) return

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [currentPath])

  return (
    <div className="matchday-root site-shell">
      <div className="tactical-backdrop" aria-hidden="true">
        <div className="pitch-grid" />
        <div className="ambient-glow" />
        <span className="beam-sweep beam-left" />
        <span className="beam-sweep beam-right" />
        <div className="rising-particles">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ ['--p' as string]: i + 1 } as React.CSSProperties} />
          ))}
        </div>
        <span className="field-node node-one" />
        <span className="field-node node-two" />
        <span className="field-node node-three" />
        <span className="field-node green node-four" />
        <span className="field-node green node-five" />
        <span className="field-path path-one" />
        <span className="field-path path-two" />
      </div>

      <HomeHeader currentPath={currentPath} />

      <main className={fullBleed ? 'site-main site-main--full' : 'site-main'}>{children}</main>

      <HomeFooter />
    </div>
  )
}
