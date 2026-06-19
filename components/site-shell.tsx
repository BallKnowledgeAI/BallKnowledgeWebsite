'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/contact', label: 'Contact' },
]

export function SiteShell({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [menuOpen, setMenuOpen] = useState(false)

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
    <div className="site-shell">
      <div className="tactical-backdrop" aria-hidden="true">
        <div className="pitch-grid" />
        <span className="field-node node-one" />
        <span className="field-node node-two" />
        <span className="field-node node-three" />
        <span className="field-node green node-four" />
        <span className="field-node green node-five" />
        <span className="field-path path-one" />
        <span className="field-path path-two" />
      </div>

      <header className="site-header">
        <Link className="site-brand" href="/" aria-label="Ball Knowledge home">
          <i className="brand-logo" aria-hidden="true" />
          <span><b>Ball</b>Knowledge</span>
        </Link>

        <div className="site-actions">
          <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={currentPath === item.href ? 'active' : ''}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="icon-control" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="icon-control mobile-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <span>Ball Knowledge</span>
        <span>Football intelligence in motion</span>
      </footer>
    </div>
  )
}
