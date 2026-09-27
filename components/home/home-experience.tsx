'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Instagram, Linkedin, Menu, Moon, Sun, Twitter, X } from 'lucide-react'
import { LiveArena } from './live-arena'
import { Configurator, Lineup, PipelineStory, SpecStrip } from './sections'
import './home.css'

const LAUNCH_AT = new Date('2026-09-01T00:00:00Z').getTime()

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/features', label: 'Features' },
  { href: '/contact', label: 'Contact' },
]

const SOCIALS = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/ballknowledge-ai/', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://x.com/AIBallKnowledge', label: 'X' },
  { icon: Instagram, href: 'https://www.instagram.com/ballknowledge.ai?igsh=b2V0ZHZuMXFmNXlw', label: 'Instagram' },
]

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('bk-theme') === 'light' ? 'light' : 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
    document.documentElement.style.colorScheme = saved
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.add('theme-switching')
    setTheme(next)
    localStorage.setItem('bk-theme', next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('theme-switching')))
  }

  return { theme, toggle }
}

export function HomeHeader({ currentPath = '/' }: { currentPath?: string }) {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const accessHref = currentPath === '/' ? '#access' : '/#access'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="matchday-header" data-scrolled={scrolled || open}>
      <Link className="site-brand matchday-header-brand" href="/" aria-label="Ball Knowledge home">
        <i className="brand-logo" aria-hidden="true" />
        <span><b>Ball</b>Knowledge</span>
      </Link>

      <nav className={`matchday-header-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={item.href === currentPath ? 'is-active' : ''} onClick={() => setOpen(false)}>{item.label}</Link>
        ))}
        <a className="matchday-header-cta" href={accessHref} onClick={() => setOpen(false)}>Early access</a>
      </nav>

      <div className="matchday-header-tools">
        <button className="matchday-icon-btn" type="button" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="matchday-icon-btn matchday-menu-btn" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
    </header>
  )
}

function Countdown() {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setLeft(Math.max(0, LAUNCH_AT - Date.now()))
    update()
    const interval = window.setInterval(update, 1000)
    return () => window.clearInterval(interval)
  }, [])

  if (left === null) return <div className="matchday-countdown" aria-hidden="true" />

  // The original launch date has passed; show an open state instead of a row of zeros.
  if (left <= 0) {
    return (
      <div className="matchday-countdown">
        <span className="matchday-kicker"><i className="matchday-live-dot" aria-hidden="true" />Kick-off · the first squad is being picked now</span>
      </div>
    )
  }

  const units = [
    { label: 'Days', value: Math.floor(left / 86400000) },
    { label: 'Hours', value: Math.floor((left / 3600000) % 24) },
    { label: 'Minutes', value: Math.floor((left / 60000) % 60) },
    { label: 'Seconds', value: Math.floor((left / 1000) % 60) },
  ]

  return (
    <div className="matchday-countdown">
      <span className="matchday-eyebrow">Launching in</span>
      <div className="matchday-countdown-units">
        {units.map((unit, index) => (
          <div key={unit.label} data-tone={index >= 2 ? 'green' : 'blue'}>
            <strong>{String(unit.value).padStart(2, '0')}</strong>
            <span>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccessSection() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEmails, setSubmittedEmails] = useState<string[]>([])

  useEffect(() => {
    const savedEmails = localStorage.getItem('bk-waitlist-emails')
    if (!savedEmails) return

    try {
      const parsed = JSON.parse(savedEmails)
      if (Array.isArray(parsed)) {
        setSubmittedEmails(parsed.filter((item): item is string => typeof item === 'string'))
      }
    } catch {
      localStorage.removeItem('bk-waitlist-emails')
    }
  }, [])

  const submitEmail = async (emailToSubmit: string) => {
    setEmailError('')
    setEmailMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSubmit.toLowerCase().trim(), source: 'ballknowledge-coming-soon' }),
      })

      const result = await response.json()

      if (!response.ok || result?.emailSent === false) {
        setEmailError(result?.error || result?.message || 'The play stalled. Try again.')
      } else {
        const normalizedEmail = emailToSubmit.toLowerCase().trim()
        setSubmittedEmails((prev) => {
          if (prev.includes(normalizedEmail)) return prev
          const next = [...prev, normalizedEmail]
          localStorage.setItem('bk-waitlist-emails', JSON.stringify(next))
          return next
        })
        setEmailSuccess(true)
        setEmail('')
        setEmailMessage(result?.emailSent === false ? 'Email did not send.' : result?.message || "Goal! You're on the squad. Check your inbox.")
        setTimeout(() => setEmailSuccess(false), 3000)
      }
    } catch (error) {
      setEmailError('The play stalled. Try again.')
      console.error('Waitlist submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedEmail = email.toLowerCase().trim()

    setEmailError('')
    setEmailMessage('')

    if (!trimmedEmail) {
      setEmailError('Red card! Enter your email first.')
      return
    }

    if (!trimmedEmail.includes('@')) {
      setEmailError('Foul! That email is missing an @.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Offside! Enter a valid email address.')
      return
    }

    if (submittedEmails.includes(trimmedEmail)) {
      setEmailError('Foul! That email is already on the roster.')
      return
    }

    await submitEmail(trimmedEmail)
  }

  return (
    <section className="matchday-section matchday-access" id="access" aria-labelledby="access-title">
      <div className="matchday-access-panel" data-reveal>
        <span className="matchday-access-pitch" aria-hidden="true" />
        <span className="matchday-eyebrow">Early access</span>
        <h2 id="access-title" className="matchday-h2">Take your place <em>in the tunnel</em></h2>
        <p>Join the first squad of coaches and analysts shaping the tactical model before it goes live</p>

        <Countdown />

        <form className="matchday-form" noValidate onSubmit={handleSubmit}>
          <label className="matchday-sr-only" htmlFor="access-email">Email address</label>
          <input
            id="access-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError('')
              setEmailMessage('')
            }}
            placeholder="Enter your email"
            autoComplete="email"
            aria-invalid={Boolean(emailError)}
            aria-describedby="access-status"
            disabled={emailSuccess || isSubmitting}
            data-state={emailError ? 'error' : emailSuccess ? 'success' : undefined}
          />
          <button type="submit" className="matchday-btn matchday-btn-primary" disabled={emailSuccess || isSubmitting}>
            {emailSuccess ? <><Check size={16} strokeWidth={2.6} /> You&apos;re in</> : isSubmitting ? 'Sending…' : <>Get early access <ArrowRight size={16} strokeWidth={2.4} /></>}
          </button>
        </form>

        <div id="access-status" aria-live="polite">
          {emailError ? <p className="matchday-form-msg" data-tone="danger">{emailError}</p> : null}
          {emailSuccess && emailMessage ? <p className="matchday-form-msg" data-tone="green">{emailMessage}</p> : null}
        </div>
      </div>
    </section>
  )
}

export function HomeFooter() {
  return (
    <footer className="matchday-footer">
      <Link className="site-brand" href="/" aria-label="Ball Knowledge home">
        <i className="brand-logo" aria-hidden="true" />
        <span><b>Ball</b>Knowledge</span>
      </Link>
      <nav aria-label="Footer navigation">
        {NAV.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="matchday-footer-socials">
        {SOCIALS.map(({ icon: Icon, href, label }) => (
          <a key={label} className="matchday-icon-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            <Icon size={18} />
          </a>
        ))}
      </div>
      <span className="matchday-footer-line">Football intelligence in motion</span>
    </footer>
  )
}

export function HomeExperience() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.matchday-root [data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="matchday-root">
      <a className="matchday-skip" href="#access">Skip to early access</a>
      <HomeHeader currentPath="/" />
      <main>
        <LiveArena />
        <SpecStrip />
        <Lineup />
        <PipelineStory />
        <Configurator />
        <AccessSection />
      </main>
      <HomeFooter />
    </div>
  )
}
