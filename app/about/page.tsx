'use client'

import Link from 'next/link'
import { Instagram, Linkedin, Menu, Moon, Sun, Twitter, X } from 'lucide-react'
import '@/components/home/home.css'

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/ballknowledge-ai/', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://x.com/AIBallKnowledge', label: 'X' },
  { icon: Instagram, href: 'https://www.instagram.com/ballknowledge.ai?igsh=b2V0ZHZuMXFmNXlw', label: 'Instagram' },
]
import { useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light'

type RevealProps = {
  children?: React.ReactNode
  delay?: number
  style?: React.CSSProperties
  className?: string
}

const team = [
  {
    name: 'Arshia Yaser',
    role: 'Frontend Engineering',
    description: 'builds the interfaces coaches and analysts actually use',
  },
  {
    name: 'Sabih Ali',
    role: 'Data and Backend',
    description: 'owns the pipeline that turns match events into structured intelligence',
  },
  {
    name: 'Zaid Siddiqui',
    role: 'Product and Systems',
    description: 'shapes what gets built and why it matters',
  },
]

const valueCards = [
  {
    number: '01',
    title: 'Read the pitch',
    description: 'Tactical shifts explained as they happen, not reconstructed at half time',
  },
  {
    number: '02',
    title: 'Think with context',
    description: 'Player movement, team shape, and match momentum connected into one coherent picture',
  },
  {
    number: '03',
    title: 'Support better decisions',
    description: 'Patterns surfaced before they show up on the scoreline',
  },
]

const stats = [
  {
    number: '$200,000+',
    label: 'per year. The upper end of what clubs pay for professional-grade football data access',
    color: 'danger',
    target: 200000,
    prefix: '$',
    suffix: '+',
    fill: '95%',
  },
  {
    number: '3,400+',
    label: 'events captured per match by top-tier platforms like StatsBomb. Most of that data never reaches the touchline',
    color: 'primary',
    target: 3400,
    prefix: '',
    suffix: '+',
    fill: '80%',
  },
  {
    number: '0',
    label: 'of that is accessible to the coaches, analysts, and fans who need it most',
    color: 'ghost',
    target: 0,
    prefix: '',
    suffix: '',
    fill: '0%',
  },
]

function useReveal() {
  const ref = useRef<HTMLDivElement | HTMLSpanElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

function Reveal({ children, delay = 0, style, className }: RevealProps) {
  const { ref, isVisible } = useReveal()

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 600ms ease, transform 600ms ease',
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function RevealSpan({ children, delay = 0, style }: RevealProps) {
  const { ref, isVisible } = useReveal()

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      style={{
        display: 'block',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 600ms ease, transform 600ms ease',
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function useScramble(target: string, trigger: boolean): string {
  const [display, setDisplay] = useState(target.replace(/[^\s]/g, '0'))

  useEffect(() => {
    if (!trigger) return

    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '$', '+', ',']
    let interval = 0
    const timeouts: number[] = []
    const start = performance.now()

    interval = window.setInterval(() => {
      const elapsed = performance.now() - start
      if (elapsed > 600) return

      setDisplay(
        target
          .split('')
          .map((char) => (char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]))
          .join(''),
      )
    }, 40)

    target.split('').forEach((_, index) => {
      const timeout = window.setTimeout(() => {
        setDisplay((current) => {
          const next = current.split('')
          for (let i = 0; i <= index; i += 1) next[i] = target[i]
          return next.join('')
        })
      }, 600 + index * 90)
      timeouts.push(timeout)
    })

    return () => {
      window.clearInterval(interval)
      timeouts.forEach((timeout) => window.clearTimeout(timeout))
    }
  }, [target, trigger])

  return display
}

function ClipWords({
  text,
  delay = 0,
  reverse = false,
  style,
}: {
  text: string
  delay?: number
  reverse?: boolean
  style?: React.CSSProperties
}) {
  const { ref, isVisible } = useReveal()
  const words = text.split(' ')
  const ordered = reverse ? [...words].reverse() : words

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} style={{ display: 'block', ...style }}>
      {ordered.map((word, visualIndex) => {
        const index = reverse ? words.length - 1 - visualIndex : visualIndex
        return (
          <span key={`${word}-${visualIndex}`} style={{ display: 'inline-block', overflow: 'hidden', paddingRight: '0.18em' }}>
            <span
              style={{
                display: 'inline-block',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(110%)',
                transition: 'opacity var(--reveal-duration) var(--reveal-ease), transform var(--reveal-duration) var(--reveal-ease)',
                transitionDelay: `${delay + index * 60}ms`,
              }}
            >
              {word}
            </span>
          </span>
        )
      })}
    </span>
  )
}

function CountStat({
  stat,
  index,
  colors,
}: {
  stat: (typeof stats)[number]
  index: number
  colors: ReturnType<typeof c>
}) {
  const { ref, isVisible } = useReveal()
  const statColor = stat.color === 'danger' ? colors.danger : stat.color === 'primary' ? colors.primary : colors.ghostNumber
  const display = useScramble(stat.number, isVisible)

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="about-stat-row"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '40px',
        padding: '28px 0',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity var(--reveal-duration) var(--reveal-ease), transform var(--reveal-duration) var(--reveal-ease)',
        transitionDelay: `${index * 80}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'end', gap: '18px' }}>
        <div
          style={{
            color: statColor,
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: 'clamp(48px, 8vw, 80px)',
            fontWeight: 900,
            lineHeight: 0.9,
          }}
        >
          {display}
        </div>
        <PriceTicker active={isVisible} collapseTail={stat.target === 0} />
      </div>
      <div style={{ maxWidth: '320px', color: colors.muted, fontSize: '14px', lineHeight: 1.6 }}>
        {stat.label}
      </div>
    </div>
  )
}

function PriceTicker({ active, collapseTail }: { active: boolean; collapseTail?: boolean }) {
  const heights = [95, 88, 80, 60, 35, 15, 6, 2]

  return (
    <div className="about-price-ticker" aria-hidden="true">
      {heights.map((height, index) => (
        <span
          key={index}
          className={collapseTail && index >= 4 ? 'collapse' : ''}
          style={{
            height: `${height}%`,
            transform: active ? 'scaleY(1)' : 'scaleY(0)',
            transitionDelay: `${200 + index * 40}ms`,
          }}
        />
      ))}
    </div>
  )
}

function c(theme: Theme) {
  const dark = theme === 'dark'

  return {
    pageBg: 'var(--bg)',
    text: 'var(--text)',
    primary: 'var(--primary)',
    green: 'var(--green)',
    eyebrow: dark ? 'rgba(59,167,240,0.5)' : 'rgba(31,60,136,0.5)',
    body: dark ? 'rgba(240,246,255,0.65)' : 'rgba(10,15,30,0.6)',
    muted: dark ? 'rgba(240,246,255,0.5)' : 'rgba(10,15,30,0.5)',
    divider: dark ? 'rgba(59,167,240,0.08)' : 'rgba(31,60,136,0.08)',
    heroBlueGlow: dark ? 'rgba(31,60,136,0.18)' : 'rgba(31,60,136,0.07)',
    heroGreenGlow: dark ? 'rgba(46,204,113,0.08)' : 'rgba(46,204,113,0.04)',
    danger: dark ? '#E74C3C' : '#C0392B',
    ghostNumber: dark ? 'rgba(240,246,255,0.2)' : 'rgba(10,15,30,0.2)',
    pitchStroke: dark ? '#3BA7F0' : '#1F3C88',
    pitchOpacity: dark ? 0.06 : 0.04,
    scrollLine: dark ? 'rgba(59,167,240,0.3)' : 'rgba(31,60,136,0.25)',
    navBg: 'var(--surface)',
    navBorder: 'var(--border)',
    cardBg: 'var(--surface)',
    cardBorder: 'var(--border)',
    cardHoverBorder: dark ? 'rgba(59,167,240,0.28)' : 'rgba(31,60,136,0.25)',
    cardShadow: dark ? 'none' : '0 4px 24px rgba(31,60,136,0.06)',
    cardHoverShadow: dark ? 'none' : '0 8px 32px rgba(31,60,136,0.1)',
    ghostCardNumber: dark ? 'rgba(59,167,240,0.03)' : 'rgba(31,60,136,0.04)',
    roleDescription: dark ? 'rgba(138,154,181,0.7)' : 'rgba(60,80,120,0.6)',
    clockCircle: dark ? 'rgba(59,167,240,0.15)' : 'rgba(31,60,136,0.12)',
    clockGlow: dark ? 'drop-shadow(0 0 8px rgba(59,167,240,0.8))' : 'drop-shadow(0 0 6px rgba(31,60,136,0.4))',
    clockCaption: dark ? 'rgba(138,154,181,0.5)' : 'rgba(60,80,120,0.5)',
    accessBg: dark ? 'rgba(6,14,30,0.9)' : 'rgba(255,255,255,0.92)',
    accessBorder: dark ? 'rgba(46,204,113,0.25)' : 'rgba(39,174,96,0.3)',
    accessShadow: dark ? '0 0 60px rgba(46,204,113,0.06)' : '0 8px 40px rgba(39,174,96,0.1)',
    tagBg: 'var(--primary-dim)',
    tagBorder: 'var(--border)',
    valueBg: 'var(--surface)',
    valueShadow: dark ? 'none' : '0 4px 20px rgba(31,60,136,0.06)',
    valueHoverShadow: dark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 20px 40px rgba(31,60,136,0.1)',
    thirdAccent: dark ? 'rgba(240,246,255,0.15)' : 'rgba(10,15,30,0.12)',
    thirdLabel: dark ? 'rgba(240,246,255,0.15)' : 'rgba(10,15,30,0.3)',
    closingGlow: dark ? 'rgba(31,60,136,0.15)' : 'rgba(31,60,136,0.06)',
    ctaHover: dark ? 'rgba(31,60,136,0.8)' : '#162d6a',
  }
}

function HeatmapCanvas({ theme }: { theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let running = true
    const start = performance.now()
    const colors = ['rgba(31,60,136,0.3)', 'rgba(59,167,240,0.15)', 'rgba(46,204,113,0.1)']
    const zones = Array.from({ length: 54 }, (_, index) => {
      const cluster = index % 3
      const baseX = cluster === 0 ? 0.24 : cluster === 1 ? 0.5 : 0.76
      return {
        x: baseX + (Math.random() - 0.5) * 0.22,
        y: 0.2 + Math.random() * 0.62,
        rx: 60 + Math.random() * 120,
        ry: 42 + Math.random() * 92,
        opacity: 0.08 + Math.random() * 0.17,
        color: index === 0 ? colors[0] : index % 7 === 0 ? colors[2] : colors[1],
        delay: index * 42,
        live: index === 8 || index === 27 || index === 43,
      }
    })

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    }

    const draw = (now: number) => {
      if (!running) return
      const elapsed = now - start
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)

      zones.forEach((zone) => {
        const appear = Math.min(Math.max((elapsed - zone.delay) / 300, 0), 1)
        if (appear <= 0) return
        const pulse = zone.live && elapsed > 2400 ? 0.94 + Math.sin(elapsed / 480) * 0.06 : 1
        const x = zone.x * window.innerWidth
        const y = zone.y * window.innerHeight
        const gradient = context.createRadialGradient(x, y, 0, x, y, zone.rx)
        gradient.addColorStop(0, zone.color)
        gradient.addColorStop(1, 'transparent')
        context.globalAlpha = appear * zone.opacity * pulse
        context.save()
        context.translate(x, y)
        context.scale(1, zone.ry / zone.rx)
        context.fillStyle = gradient
        context.beginPath()
        context.arc(0, 0, zone.rx, 0, Math.PI * 2)
        context.fill()
        context.restore()
      })

      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const formations = [
  {
    name: '4-3-3',
    points: [[12, 50], [28, 20], [28, 40], [28, 60], [28, 80], [48, 32], [48, 50], [48, 68], [70, 22], [76, 50], [70, 78]],
  },
  {
    name: '4-2-3-1',
    points: [[12, 50], [28, 20], [28, 40], [28, 60], [28, 80], [46, 42], [46, 58], [64, 26], [64, 50], [64, 74], [82, 50]],
  },
  {
    name: '3-5-2',
    points: [[12, 50], [30, 28], [30, 50], [30, 72], [50, 14], [50, 36], [50, 50], [50, 64], [50, 86], [76, 38], [76, 62]],
  },
  {
    name: '4-4-2',
    points: [[12, 50], [28, 20], [28, 40], [28, 60], [28, 80], [54, 20], [54, 40], [54, 60], [54, 80], [78, 38], [78, 62]],
  },
]

function FormationMorph({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const [index, setIndex] = useState(0)
  const label = useScramble(formations[index].name, true)

  useEffect(() => {
    const interval = window.setInterval(() => setIndex((current) => (current + 1) % formations.length), 3000)
    return () => window.clearInterval(interval)
  }, [])

  const points = formations[index].points
  const links = [[0, 2], [1, 2], [2, 3], [3, 4], [2, 6], [5, 6], [6, 7], [6, 9], [8, 9], [9, 10]]

  return (
    <div className="about-formation-morph" aria-label="Formation intelligence visual">
      <span>FORMATION INTELLIGENCE</span>
      <svg viewBox="0 0 100 100" role="img" aria-label={formations[index].name}>
        {links.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={points[from][0]}
            y1={points[from][1]}
            x2={points[to][0]}
            y2={points[to][1]}
            stroke={colors.divider}
            strokeWidth="0.55"
          />
        ))}
        {points.map((point, playerIndex) => (
          <circle
            key={playerIndex}
            cx={point[0]}
            cy={point[1]}
            r={playerIndex === 9 || playerIndex === 10 ? 2.9 : 2.35}
            fill={playerIndex === 9 ? colors.green : playerIndex === 10 ? colors.primary : colors.primary}
            opacity={playerIndex === 9 || playerIndex === 10 ? 1 : 0.62}
            className={playerIndex === 9 || playerIndex === 10 ? 'about-key-player' : ''}
          />
        ))}
      </svg>
      <strong>{label}</strong>
    </div>
  )
}

const diffLines = [
  { sign: '-', text: 'StatsBomb license: $180,000/year', tone: 'bad' },
  { sign: '-', text: 'Opta feed: $95,000/year', tone: 'bad' },
  { sign: '-', text: 'Analyst team: 3 FTE required', tone: 'bad' },
  { sign: '-', text: 'Time to insight: post-match', tone: 'bad' },
  { sign: '+', text: 'BallKnowledge: real-time', tone: 'good' },
  { sign: '+', text: 'Coaching cues: live', tone: 'good' },
  { sign: '+', text: 'Access level: every club', tone: 'good' },
  { sign: '+', text: 'Time to insight: before next phase', tone: 'good' },
]

function DiffPanel() {
  const { ref, isVisible } = useReveal()
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (!isVisible) return
    const timers: number[] = []
    let cursor = 0

    diffLines.forEach((line, lineIndex) => {
      const pause = lineIndex >= 4 ? 400 : 0
      const start = lineIndex * 360 + pause
      const full = `${line.sign} ${line.text}`

      full.split('').forEach((_, charIndex) => {
        timers.push(window.setTimeout(() => {
          setVisibleLines((current) => {
            const next = [...current]
            next[lineIndex] = full.slice(0, charIndex + 1)
            return next
          })
        }, start + charIndex * 18))
        cursor = Math.max(cursor, start + charIndex * 18)
      })
    })

    timers.push(window.setTimeout(() => setClosed(true), cursor + 2000))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [isVisible])

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="about-diff-panel">
      <div className="about-diff-title">diff --access before.json after.json</div>
      {diffLines.map((line, index) => (
        <div key={index} className={`about-diff-line ${line.tone}`}>
          {visibleLines[index] || ''}
        </div>
      ))}
      {closed && <div className="about-diff-line terminal">&gt; access gap closed<span className="about-diff-cursor" /></div>}
    </div>
  )
}

function PitchTexture({ stroke, opacity, rotated = false }: { stroke: string; opacity: number; rotated?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 760"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: rotated ? '-12% -18%' : 0,
        width: rotated ? '136%' : '100%',
        height: rotated ? '124%' : '100%',
        opacity,
        transform: rotated ? 'rotate(8deg)' : 'none',
        pointerEvents: 'none',
      }}
    >
      <rect className="about-pitch-draw draw-outline" x="100" y="80" width="1000" height="600" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <line className="about-pitch-draw draw-half" x1="600" y1="80" x2="600" y2="680" stroke={stroke} strokeWidth="1" pathLength="1" />
      <circle className="about-pitch-draw draw-circle" cx="600" cy="380" r="96" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <rect className="about-pitch-draw draw-box" x="100" y="230" width="170" height="300" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <rect className="about-pitch-draw draw-box" x="930" y="230" width="170" height="300" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <rect className="about-pitch-draw draw-box" x="100" y="300" width="62" height="160" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <rect className="about-pitch-draw draw-box" x="1038" y="300" width="62" height="160" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <path className="about-pitch-draw draw-corner" d="M 100 112 A 32 32 0 0 0 132 80" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <path className="about-pitch-draw draw-corner" d="M 1068 80 A 32 32 0 0 0 1100 112" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <path className="about-pitch-draw draw-corner" d="M 132 680 A 32 32 0 0 0 100 648" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
      <path className="about-pitch-draw draw-corner" d="M 1100 648 A 32 32 0 0 0 1068 680" fill="none" stroke={stroke} strokeWidth="1" pathLength="1" />
    </svg>
  )
}

function RadarSweep({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const fill = theme === 'dark' ? 'rgba(59,167,240,0.12)' : 'rgba(31,60,136,0.08)'

  return (
    <div className="about-radar-wrap" aria-hidden="true">
      <svg viewBox="0 0 1200 760" className="about-radar-sweep trail">
        <path d="M600 380 L600 96 A284 284 0 0 1 674 106 Z" fill={fill} />
      </svg>
      <svg viewBox="0 0 1200 760" className="about-radar-sweep">
        <path d="M600 380 L600 96 A284 284 0 0 1 674 106 Z" fill={fill} />
      </svg>
      <span className="about-radar-node node-a" style={{ borderColor: colors.primary, background: colors.primary }} />
      <span className="about-radar-node node-b" style={{ borderColor: colors.green, background: colors.green }} />
      <span className="about-radar-link" />
    </div>
  )
}

function ScrollTimeline({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="about-timeline" aria-hidden="true">
      <span className="about-timeline-line" style={{ transform: `scaleY(${progress})` }} />
      <span className="about-timeline-traveler" style={{ top: `${progress * 100}%`, background: colors.primary }} />
      {[8, 24, 40, 56, 74, 91].map((top, index) => (
        <span
          key={top}
          className="about-timeline-dot"
          style={{
            top: `${top}%`,
            background: index === 2 ? colors.green : index === 3 ? colors.primary : colors.muted,
          }}
        />
      ))}
    </div>
  )
}

function TacticalSignalGraphic({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const mutedLine = theme === 'dark' ? 'rgba(59,167,240,0.18)' : 'rgba(31,60,136,0.12)'
  const panelBg = theme === 'dark' ? 'rgba(10,16,32,0.42)' : 'rgba(255,255,255,0.58)'
  const panelBorder = theme === 'dark' ? 'rgba(59,167,240,0.16)' : 'rgba(31,60,136,0.12)'

  return (
    <div
      className="about-tactical-signal"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '7%',
        bottom: '9%',
        width: 'min(440px, 42vw)',
        minHeight: '260px',
        border: `1px solid ${panelBorder}`,
        borderRadius: '24px',
        background: panelBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <svg viewBox="0 0 440 260" style={{ width: '100%', height: '260px', display: 'block' }}>
        <rect x="34" y="30" width="372" height="200" rx="12" fill="none" stroke={mutedLine} strokeWidth="1.5" />
        <line x1="220" y1="30" x2="220" y2="230" stroke={mutedLine} strokeWidth="1" />
        <circle cx="220" cy="130" r="38" fill="none" stroke={mutedLine} strokeWidth="1" />
        <path className="about-signal-route route-one" d="M78 168 C130 120 172 112 220 130 C264 146 306 110 360 88" fill="none" stroke={colors.primary} strokeWidth="2" strokeDasharray="7 8" />
        <path className="about-signal-route route-two" d="M92 92 C142 72 186 82 220 130 C244 164 296 178 356 164" fill="none" stroke={colors.green} strokeWidth="2" strokeDasharray="6 9" />
        {[
          { x: 78, y: 168, fill: colors.primary },
          { x: 154, y: 112, fill: colors.primary },
          { x: 220, y: 130, fill: colors.green },
          { x: 306, y: 110, fill: colors.primary },
          { x: 360, y: 88, fill: colors.green },
          { x: 92, y: 92, fill: colors.green },
          { x: 356, y: 164, fill: colors.primary },
        ].map((node, index) => (
          <circle key={index} cx={node.x} cy={node.y} r="7" fill={node.fill} opacity="0.9" />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '18px',
          top: '16px',
          color: colors.primary,
          fontFamily: 'var(--font-barlow-condensed)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.16em',
        }}
      >
        LIVE PATTERN MAP
      </div>
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.muted,
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors.green }} />
        Press trigger detected
      </div>
    </div>
  )
}

function AccessGapGraphic({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const rail = theme === 'dark' ? 'rgba(59,167,240,0.12)' : 'rgba(31,60,136,0.1)'
  const card = theme === 'dark' ? 'rgba(10,16,32,0.38)' : 'rgba(255,255,255,0.55)'

  return (
    <div
      className="about-access-gap-graphic"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '-80px',
        top: '50%',
        width: '300px',
        height: '420px',
        transform: 'translateY(-50%)',
        opacity: theme === 'dark' ? 0.72 : 0.5,
        pointerEvents: 'none',
      }}
    >
      <svg viewBox="0 0 300 420" style={{ width: '100%', height: '100%' }}>
        <path d="M150 22 V398" stroke={rail} strokeWidth="1.5" strokeDasharray="5 9" />
        {[54, 126, 198, 270, 342].map((y, index) => (
          <g key={y}>
            <rect x={index % 2 === 0 ? 38 : 132} y={y - 24} width="130" height="48" rx="12" fill={card} stroke={rail} />
            <circle cx="150" cy={y} r="7" fill={index === 3 ? colors.green : colors.primary} />
            <path
              className="about-data-packet"
              d={index % 2 === 0 ? `M150 ${y} C124 ${y - 14} 102 ${y - 14} 76 ${y}` : `M150 ${y} C176 ${y + 14} 198 ${y + 14} 224 ${y}`}
              fill="none"
              stroke={index === 3 ? colors.green : colors.primary}
              strokeWidth="1.5"
              strokeDasharray="4 7"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

function AccessCard({ theme }: { theme: Theme }) {
  const colors = c(theme)

  return (
    <div
      className="about-access-card"
      style={{
        position: 'absolute',
        right: '11%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 'min(320px, calc(100% - 40px))',
        padding: '24px',
        border: `1px solid ${colors.accessBorder}`,
        borderRadius: '16px',
        background: colors.accessBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: colors.accessShadow,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '18px' }}>
        <span
          className="about-pulse-dot"
          style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.green }}
        />
        <span
          style={{
            color: colors.green,
            fontFamily: 'var(--font-barlow-condensed)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.2em',
          }}
        >
          ACCESS UNLOCKED
        </span>
      </div>
      <div
        style={{
          color: theme === 'dark' ? 'rgba(240,246,255,0.7)' : 'rgba(10,15,30,0.7)',
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '18px',
        }}
      >
        Coaching intelligence
      </div>
      <svg viewBox="0 0 90 90" style={{ width: '90px', height: '90px', display: 'block', marginBottom: '18px' }}>
        <circle cx="45" cy="45" r="36" fill="none" stroke={colors.tagBorder} strokeWidth="7" />
        <circle
          cx="45"
          cy="45"
          r="36"
          fill="none"
          stroke={colors.green}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="194 226"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="50" textAnchor="middle" fill={colors.green} fontFamily="var(--font-barlow-condensed)" fontSize="20" fontWeight="900">
          86%
        </text>
      </svg>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['Coach', 'Analyst', 'Fan'].map((tag) => (
          <span
            key={tag}
            style={{
              padding: '5px 10px',
              border: `1px solid ${colors.tagBorder}`,
              borderRadius: '999px',
              background: colors.tagBg,
              color: colors.primary,
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gap: '7px', marginTop: '18px' }}>
        {[
          { label: 'Shape', width: '82%', color: colors.primary },
          { label: 'Press', width: '64%', color: colors.green },
          { label: 'Tempo', width: '72%', color: colors.primary },
        ].map((item) => (
          <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '52px 1fr', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: colors.muted, fontSize: '10px', fontWeight: 700 }}>{item.label}</span>
            <span style={{ height: '5px', borderRadius: '999px', background: colors.tagBg, overflow: 'hidden' }}>
              <span style={{ display: 'block', width: item.width, height: '100%', borderRadius: '999px', background: item.color }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClockVisual({ theme }: { theme: Theme }) {
  const colors = c(theme)
  const [handAngle, setHandAngle] = useState(0)
  const [remaining, setRemaining] = useState(6)

  useEffect(() => {
    let frame = 0
    let running = true
    const start = performance.now()

    const tick = (now: number) => {
      if (!running) return
      const elapsed = (now - start) / 1000
      setHandAngle((elapsed * 6 * 60) % 360)
      setRemaining(Math.max(0, 6 - (elapsed % 6)))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frame)
    }
  }, [])

  const circumference = 2 * Math.PI * 132
  const progress = remaining / 6
  const warningColor = progress > 0.55 ? colors.danger : progress > 0.22 ? '#F39C12' : colors.primary
  const orbit = [0, -14, -28, -42].map((offset) => {
    const angle = ((handAngle + offset - 90) * Math.PI) / 180
    return {
      x: 180 + Math.cos(angle) * 132,
      y: 180 + Math.sin(angle) * 132,
    }
  })

  return (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', minHeight: '420px' }}>
      <svg viewBox="0 0 360 360" style={{ width: 'min(360px, 78vw)', height: 'min(360px, 78vw)' }} aria-hidden="true">
        <circle cx="180" cy="180" r="150" fill="none" stroke={colors.clockCircle} strokeWidth="2" />
        <circle cx="180" cy="180" r="112" fill="none" stroke={colors.clockCircle} strokeWidth="2" opacity="0.75" />
        <circle cx="180" cy="180" r="74" fill="none" stroke={colors.clockCircle} strokeWidth="2" opacity="0.55" />
        <circle
          cx="180"
          cy="180"
          r="132"
          fill="none"
          stroke={warningColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 180 180)"
        />
        <circle cx="180" cy="180" r="6" fill={colors.primary} />
        <line x1="180" y1="180" x2="128" y2="110" stroke={colors.clockCircle} strokeWidth="8" strokeLinecap="round" />
        <line
          x1="180"
          y1="180"
          x2="171"
          y2="42"
          stroke={colors.primary}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${handAngle} 180 180)`}
          style={{ filter: colors.clockGlow }}
        />
        {orbit.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={index === 0 ? 5 : 4} fill={colors.primary} opacity={[1, 0.4, 0.2, 0.08][index]} />
        ))}
        {[
          { label: 'BALL WON', x: 180, y: 22, x2: 180, y2: 48, anchor: 'middle' },
          { label: 'PRESS TRIGGER', x: 320, y: 184, x2: 304, y2: 180, anchor: 'middle' },
          { label: 'SHAPE SHIFTS', x: 180, y: 344, x2: 180, y2: 312, anchor: 'middle' },
          { label: 'WINDOW CLOSES', x: 40, y: 184, x2: 56, y2: 180, anchor: 'middle' },
        ].map((item, index) => (
          <g key={item.label} className="about-clock-label" style={{ animationDelay: `${index * 100}ms` }}>
            <line x1={item.x} y1={item.y} x2={item.x2} y2={item.y2} stroke={colors.clockCircle} strokeWidth="1" pathLength="1" />
            <text x={item.x} y={item.y} textAnchor={item.anchor as React.SVGProps<SVGTextElement>['textAnchor']} fill={colors.muted} fontFamily="var(--font-dm-sans)" fontSize="8" fontWeight="700">{item.label}</text>
          </g>
        ))}
      </svg>
      <span
        className={remaining < 0.2 ? 'about-clock-flash' : ''}
        style={{
          marginTop: '-28px',
          color: remaining < 0.8 ? colors.danger : colors.clockCaption,
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '12px',
          fontWeight: 800,
          textAlign: 'center',
        }}
      >
        Window: {remaining.toFixed(1)}s remaining
      </span>
    </div>
  )
}

export default function AboutPage() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [menuOpen, setMenuOpen] = useState(false)
  const colors = c(theme)

  useEffect(() => {
    const savedTheme = localStorage.getItem('bk-theme')
    const nextTheme = savedTheme === 'light' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.style.colorScheme = nextTheme
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.add('theme-switching')
    setTheme(nextTheme)
    localStorage.setItem('bk-theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.style.colorScheme = nextTheme
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('theme-switching')))
  }

  return (
    <main
      className="matchday-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: colors.pageBg,
        color: colors.text,
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
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
      <ScrollTimeline theme={theme} />

      <header className="matchday-header" data-scrolled={menuOpen}>
        <Link className="site-brand matchday-header-brand" href="/" aria-label="Ball Knowledge home">
          <i className="brand-logo" aria-hidden="true" />
          <span><b>Ball</b>Knowledge</span>
        </Link>

        <nav className={`matchday-header-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'About' },
            { href: '/features', label: 'Features' },
            { href: '/contact', label: 'Contact' },
          ].map((item) => (
            <Link
              key={item.href}
              className={item.href === '/about' ? 'is-active' : ''}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a className="matchday-header-cta" href="/#access" onClick={() => setMenuOpen(false)}>Early access</a>
        </nav>

        <div className="matchday-header-tools">
          <button
            className="matchday-icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="matchday-icon-btn matchday-menu-btn" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 2 }}>

      <section className="about-hero-section" style={{ position: 'relative', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '80px 40px' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 600px 400px at 0% 0%, ${colors.heroBlueGlow} 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 500px 400px at 100% 100%, ${colors.heroGreenGlow} 0%, transparent 70%)` }} />
        <HeatmapCanvas theme={theme} />
        <Reveal style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ color: colors.eyebrow, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.25em', marginBottom: '18px' }}>
            APP/ABOUT
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: 'clamp(64px, 10vw, 120px)', letterSpacing: 0, lineHeight: 0.9 }}>
            <span style={{ display: 'block', color: colors.text }}>THE GAME</span>
            <span style={{ display: 'block', color: colors.primary }}>HAS A TELL</span>
          </h1>
          <p style={{ maxWidth: '480px', margin: '22px auto 34px', color: colors.muted, fontSize: '16px', lineHeight: 1.7 }}>
            Football intelligence has always existed. Access to it has not.
          </p>
          <div style={{ width: '1px', height: '40px', margin: '0 auto', background: colors.scrollLine, position: 'relative' }}>
            <span className="about-scroll-dot" style={{ position: 'absolute', left: '-3px', top: 0, width: '7px', height: '7px', borderRadius: '50%', background: colors.primary }} />
          </div>
        </Reveal>
      </section>

      <section className="about-full-section" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '900px', margin: '0 auto', padding: '80px 40px' }}>
        <div className="about-access-formation contact-formation" aria-hidden="true">
          <span className="formation-line line-one" />
          <span className="formation-line line-two" />
          <i className="formation-player fp-one" />
          <i className="formation-player fp-two" />
          <i className="formation-player fp-three" />
          <i className="formation-player fp-four" />
          <strong>ACCESS GAP</strong>
        </div>
        <div style={{ position: 'relative', zIndex: 1, color: colors.eyebrow, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '32px' }}>
          THE ACCESS GAP
        </div>
        {stats.map((stat, index) => (
          <div key={stat.number} style={{ position: 'relative', zIndex: 1 }}>
            <CountStat stat={stat} index={index} colors={colors} />
            {index < stats.length - 1 && <div style={{ height: '1px', width: '100%', background: colors.divider }} />}
          </div>
        ))}
        <Reveal style={{ marginTop: '48px', textAlign: 'center', color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontSize: '28px', fontWeight: 700 }}>
          This is not a data problem. It is an <span className="about-access-word">access</span> problem.
        </Reveal>
      </section>

      <section className="about-split-section about-split-vision" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div className="about-content-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px 80px 80px' }}>
          <div style={{ color: colors.green, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '18px' }}>
            VISION
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, letterSpacing: 0, color: colors.text }}>
            {['ELITE INTELLIGENCE', 'FOR EVERY', 'LEVEL'].map((line, index) => (
              <RevealSpan key={line} delay={index * 80}>{line}</RevealSpan>
            ))}
          </h2>
          <Reveal delay={240} style={{ width: '48px', height: '2px', background: colors.green, margin: '24px 0' }} />
          <Reveal delay={300} style={{ maxWidth: '440px', margin: 0, color: colors.body, fontSize: '15px', lineHeight: 1.8 }}>
            Football intelligence has always existed. For decades it just came with a price tag that only the biggest clubs could pay. Platforms like StatsBomb and Opta charge anywhere from $10,000 to over $200,000 a year for professional-grade data access, built exclusively for clubs with dedicated data science departments, full analyst teams, and enterprise budgets. The gap between what the elite know and what everyone else can access is not a technical problem anymore. It is an access problem. BallKnowledge exists to close that gap.
          </Reveal>
          <Reveal delay={380} style={{ maxWidth: '400px', marginTop: '26px', color: colors.green, fontFamily: 'var(--font-barlow-condensed)', fontSize: '20px', fontWeight: 700, lineHeight: 1.3 }}>
            Make elite football intelligence available to every ambitious coach, analyst, player, and fan
          </Reveal>
        </div>
        <div className="about-visual-panel" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
          <Reveal delay={160} style={{ display: 'grid', placeItems: 'center', minHeight: '100%' }}>
            <FormationMorph theme={theme} />
          </Reveal>
        </div>
      </section>

      <section className="about-split-section about-split-mission" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <Reveal className="about-visual-panel" delay={120} style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '80px 40px' }}>
          <ClockVisual theme={theme} />
        </Reveal>
        <div className="about-content-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 80px 60px' }}>
          <div style={{ color: colors.primary, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '18px' }}>
            MISSION
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, letterSpacing: 0 }}>
            {[
              { text: 'DECODE THE MATCH', color: colors.text },
              { text: 'WHILE IT', color: colors.primary },
              { text: 'MOVES', color: colors.text },
            ].map((line, index) => (
              <RevealSpan key={line.text} delay={index * 80} style={{ color: line.color }}>{line.text}</RevealSpan>
            ))}
          </h2>
          <Reveal delay={240} style={{ width: '48px', height: '2px', background: colors.primary, margin: '24px 0' }} />
          <Reveal delay={300} style={{ maxWidth: '440px', margin: 0, color: colors.body, fontSize: '15px', lineHeight: 1.8 }}>
            The problem with existing tools is not only cost. It is timing. Football analysis has transformed how professional teams approach tactical preparation and performance review, but almost all of it still happens after the fact. Post-match reports. Half-time summaries. Analyst reviews the morning after. The game moves in real time. The intelligence does not. BallKnowledge decodes the game as it happens. We turn match data, tactical context, and AI reasoning into clear decisions before the next phase of play, not after the final whistle.
          </Reveal>
          <Reveal delay={380} style={{ marginTop: '26px', color: colors.primary, fontFamily: 'var(--font-barlow-condensed)', fontSize: '20px', fontWeight: 700, lineHeight: 1.3 }}>
            Clear decisions. Before the next phase of play
          </Reveal>
        </div>
      </section>

      <section className="about-team-section" style={{ minHeight: '100vh', padding: '80px 40px' }}>
        <div className="about-origin-layout">
          <div>
            <Reveal style={{ color: colors.eyebrow, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em' }}>
              THE TEAM
            </Reveal>
            <Reveal delay={90} style={{ maxWidth: '800px', margin: '18px 0 26px', color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: 0 }}>
              BUILT BY PEOPLE WHO WANTED THE SMARTER CONVERSATION
            </Reveal>
            <Reveal delay={180} style={{ maxWidth: '680px', color: theme === 'dark' ? 'rgba(240,246,255,0.6)' : 'rgba(10,15,30,0.6)', fontSize: '16px', lineHeight: 1.9, textAlign: 'left' }}>
              Three final year software engineering students at NUST sat through too many matches thinking the same thing: somewhere between what was happening on the pitch and what the commentators were saying, there was a smarter conversation nobody was having. Arshia Yaser, Sabih Ali, and Zaid Siddiqui from SE-14 at SEECS built BallKnowledge as a final year project and kept going because the problem was too real to walk away from. Not a research lab. Not a data company. Just people who love football and know how to build things.
            </Reveal>
          </div>
          <Reveal delay={260}>
            <DiffPanel />
          </Reveal>
        </div>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div className="about-team-grid" style={{ display: 'flex', gap: '16px', marginTop: '42px' }}>
            {team.map((person, index) => (
              <Reveal key={person.name} delay={index * 80} style={{ flex: 1 }}>
                <article
                  style={{
                    minHeight: '245px',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '28px 24px',
                    border: `1px solid ${colors.cardBorder}`,
                    borderRadius: '14px',
                    background: colors.cardBg,
                    boxShadow: colors.cardShadow,
                    transform: 'translateY(0)',
                    transition: 'transform 250ms ease, box-shadow 250ms ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = colors.cardHoverBorder
                    event.currentTarget.style.boxShadow = colors.cardHoverShadow
                    event.currentTarget.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = colors.cardBorder
                    event.currentTarget.style.boxShadow = colors.cardShadow
                    event.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <svg className={`about-role-icon role-${index + 1}`} viewBox="0 0 28 28" aria-hidden="true">
                    {index === 0 && (
                      <>
                        <rect x="4" y="5" width="20" height="18" rx="3" />
                        <line x1="8" y1="11" x2="20" y2="11" />
                        <line x1="8" y1="15" x2="17" y2="15" />
                        <line x1="8" y1="19" x2="14" y2="19" />
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <circle cx="7" cy="14" r="3" />
                        <circle cx="14" cy="14" r="3" />
                        <circle cx="21" cy="14" r="3" />
                        <line x1="10" y1="14" x2="11" y2="14" />
                        <line x1="17" y1="14" x2="18" y2="14" />
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <path d="M14 4 L23 14 L14 24 L5 14 Z" />
                        <line x1="14" y1="8" x2="14" y2="20" />
                        <line x1="8" y1="14" x2="20" y2="14" />
                      </>
                    )}
                  </svg>
                  <div style={{ position: 'absolute', right: '12px', bottom: '-20px', color: colors.ghostCardNumber, fontFamily: 'var(--font-barlow-condensed)', fontSize: '120px', fontWeight: 900, lineHeight: 1, pointerEvents: 'none' }}>
                    0{index + 1}
                  </div>
                  <h3 style={{ position: 'relative', margin: 0, color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontSize: '22px', fontWeight: 700 }}>
                    {person.name}
                  </h3>
                  <div style={{ position: 'relative', marginTop: '4px', color: colors.primary, fontSize: '12px', fontWeight: 700 }}>
                    {person.role}
                  </div>
                  <div style={{ position: 'relative', width: '32px', height: '1px', margin: '12px 0', background: theme === 'dark' ? 'rgba(59,167,240,0.2)' : 'rgba(31,60,136,0.12)' }} />
                  <p style={{ position: 'relative', margin: 0, color: colors.roleDescription, fontSize: '12px', lineHeight: 1.7 }}>
                    {person.description}
                  </p>
                  <div
                    style={{
                      position: 'absolute',
                      left: '24px',
                      bottom: '24px',
                      padding: '3px 10px',
                      border: `1px solid ${theme === 'dark' ? 'rgba(59,167,240,0.12)' : 'rgba(31,60,136,0.12)'}`,
                      borderRadius: '20px',
                      background: theme === 'dark' ? 'rgba(59,167,240,0.06)' : 'rgba(31,60,136,0.05)',
                      color: theme === 'dark' ? 'rgba(59,167,240,0.5)' : 'rgba(31,60,136,0.6)',
                      fontFamily: 'var(--font-barlow-condensed)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                    }}
                  >
                    SE-14, NUST SEECS
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="about-value-grid" style={{ maxWidth: '1040px', margin: '40px auto 80px', display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
          {valueCards.map((card, index) => {
            const accent = index === 0 ? '#3BA7F0' : index === 1 ? '#2ECC71' : colors.thirdAccent
            const labelColor = index === 2 ? colors.thirdLabel : accent
            return (
              <Reveal key={card.number} delay={index * 80} className="about-value-reveal" style={{ flex: 1 }}>
                <div className="about-value-offset" style={{ transform: `translateY(${index === 0 ? 0 : index === 1 ? -24 : -12}px)` }}>
                  <article
                    className="about-value-card"
                    style={{
                      minHeight: '230px',
                      padding: '32px 28px',
                      position: 'relative',
                      overflow: 'hidden',
                      borderLeft: `4px solid ${accent}`,
                      borderRadius: '16px',
                      background: colors.valueBg,
                      boxShadow: colors.valueShadow,
                      transform: 'translateY(0)',
                      transition: 'transform 250ms ease, box-shadow 250ms ease',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.boxShadow = colors.valueHoverShadow
                      event.currentTarget.style.transform = 'translateY(-4px)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.boxShadow = colors.valueShadow
                      event.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <svg className={`about-value-texture texture-${index + 1}`} viewBox="0 0 90 90" aria-hidden="true">
                      {index === 0 && (
                        <>
                          <rect x="12" y="18" width="66" height="48" rx="4" />
                          <line x1="45" y1="18" x2="45" y2="66" />
                          <circle cx="45" cy="42" r="12" />
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <circle cx="24" cy="30" r="6" />
                          <circle cx="52" cy="44" r="6" />
                          <circle cx="68" cy="24" r="6" />
                          <line x1="30" y1="33" x2="46" y2="41" />
                          <line x1="57" y1="39" x2="64" y2="29" />
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <polyline points="14,62 34,48 50,52 72,28" />
                          <circle cx="14" cy="62" r="4" />
                          <circle cx="34" cy="48" r="4" />
                          <circle cx="50" cy="52" r="4" />
                          <circle cx="72" cy="28" r="4" />
                        </>
                      )}
                    </svg>
                    <div style={{ marginBottom: '16px', color: labelColor, fontFamily: 'var(--font-barlow-condensed)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em' }}>
                      {card.number}
                    </div>
                    <h3 style={{ margin: 0, color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontSize: '24px', fontWeight: 700, lineHeight: 1.2 }}>
                      {card.title}
                    </h3>
                    <div style={{ width: '100%', height: '1px', margin: '16px 0', background: colors.divider }} />
                    <p style={{ margin: 0, color: theme === 'dark' ? 'rgba(138,154,181,0.8)' : 'rgba(60,80,120,0.65)', fontSize: '13px', lineHeight: 1.7 }}>
                      {card.description}
                    </p>
                  </article>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      <section style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '1fr 1fr' }}>
        <div className="about-why-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '56px', padding: '80px 40px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
          <Reveal>
            <div style={{ color: colors.eyebrow, fontFamily: 'var(--font-barlow-condensed)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '20px' }}>
              WHY NOW
            </div>
            <div style={{ maxWidth: '500px', color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontSize: '32px', fontWeight: 700, lineHeight: 1.2 }}>
              Football generates more data than ever before. Most of it never reaches the people making decisions on the touchline.
            </div>
          </Reveal>
          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              { number: '190+', label: 'competitions tracked by StatsBomb alone', color: colors.primary },
              { number: '3,400+', label: 'events per match captured in real time', color: colors.green },
              { number: '$0', label: 'of that accessible to most coaches', color: theme === 'dark' ? 'rgba(240,246,255,0.25)' : 'rgba(10,15,30,0.25)' },
            ].map((stat, index) => (
              <Reveal key={stat.number} delay={index * 90} style={{ display: 'flex', gap: '10px', alignItems: 'baseline', borderLeft: `1px solid ${theme === 'dark' ? 'rgba(59,167,240,0.2)' : 'rgba(31,60,136,0.15)'}`, paddingLeft: '16px' }}>
                <svg className="about-spark" viewBox="0 0 18 18" aria-hidden="true" style={{ color: stat.color, animationDelay: `${index * 400}ms` }}>
                  <circle cx="9" cy="9" r="3" />
                  <line x1="9" y1="1.5" x2="9" y2="4.5" />
                  <line x1="14.3" y1="3.7" x2="12.2" y2="5.8" />
                </svg>
                <strong style={{ color: stat.color, fontFamily: 'var(--font-barlow-condensed)', fontSize: '22px', fontWeight: 700 }}>{stat.number}</strong>
                <span style={{ color: colors.muted, fontSize: '13px', lineHeight: 1.5 }}>{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', placeItems: 'center', padding: '80px 40px', background: `radial-gradient(ellipse 800px 300px at 50% 100%, ${colors.closingGlow} 0%, transparent 70%)` }}>
          <Reveal style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: colors.text, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.05 }}>
              <ClipWords text="The technology to change that exists right now" />
              <ClipWords text="We are building it" reverse delay={700} style={{ color: colors.primary }} />
              <span className="about-terminal-cursor" style={{ color: colors.primary }} />
            </h2>
            <div className="about-cta-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Link
                className="about-primary-cta"
                href="/#waitlist"
                style={{
                  padding: '12px 28px',
                  border: `1px solid ${theme === 'dark' ? 'rgba(59,167,240,0.3)' : 'rgba(31,60,136,0.4)'}`,
                  borderRadius: '8px',
                  background: '#1F3C88',
                  color: theme === 'dark' ? '#F0F6FF' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = colors.ctaHover
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = '#1F3C88'
                }}
              >
                Join the waitlist
              </Link>
              <Link
                href="/"
                style={{
                  padding: '12px 28px',
                  border: `1px solid ${theme === 'dark' ? 'rgba(59,167,240,0.15)' : 'rgba(31,60,136,0.2)'}`,
                  borderRadius: '8px',
                  background: 'transparent',
                  color: colors.muted,
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(59,167,240,0.3)' : 'rgba(31,60,136,0.4)'
                  event.currentTarget.style.color = colors.text
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(59,167,240,0.15)' : 'rgba(31,60,136,0.2)'
                  event.currentTarget.style.color = colors.muted
                }}
              >
                Back to home
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      </div>

      <footer className="matchday-footer">
        <Link className="site-brand" href="/" aria-label="Ball Knowledge home">
          <i className="brand-logo" aria-hidden="true" />
          <span><b>Ball</b>Knowledge</span>
        </Link>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/features">Features</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="matchday-footer-socials">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
              <Icon size={18} />
            </a>
          ))}
        </div>
        <span className="matchday-footer-line">Football intelligence in motion</span>
      </footer>
    </main>
  )
}
