'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Github, Linkedin, Eye, Brain, Zap } from 'lucide-react'

const BallKnowledge = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastAutoSubmittedEmail, setLastAutoSubmittedEmail] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [draggedDot, setDraggedDot] = useState<string | null>(null)
  const [dotOffsets, setDotOffsets] = useState<{ [key: string]: { x: number; y: number } }>({})
  const [hoveredDot, setHoveredDot] = useState<string | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('bk-theme')
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
      // Keep legacy data-theme but also toggle the `.dark` class so CSS variables update immediately
      document.documentElement.setAttribute('data-theme', savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      document.documentElement.style.colorScheme = savedTheme
    } else {
      setTheme('dark')
      // default to dark mode
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date('2026-09-01T00:00:00Z').getTime()
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('bk-theme', newTheme)
    // Update both attribute and `.dark` class so all styles (CSS variables and inline theme checks) update together
    document.documentElement.setAttribute('data-theme', newTheme)
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    }
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

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

      if (!response.ok) {
        setEmailError(result?.error || result?.message || 'The play stalled. Try again.')
      } else {
        setEmailSuccess(true)
        setEmail('')
        setLastAutoSubmittedEmail(emailToSubmit.toLowerCase().trim())
        setEmailMessage(result?.message || 'Goal! You’ve been added to the prototype testers roster. Check your inbox for kickoff details.')
        setTimeout(() => setEmailSuccess(false), 3000)
      }
    } catch (error) {
      setEmailError('The play stalled. Try again.')
      console.error('Waitlist submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.toLowerCase().trim()

    setEmailError('')
    setEmailMessage('')

    if (!trimmedEmail) {
      setEmailError('Red card! No pass received — enter your email before you take the shot.')
      return
    }

    if (!trimmedEmail.includes('@')) {
      setEmailError('Foul! That address is missing an @ — it can’t score without it.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError('Offside! That email is off-target — deliver a valid address.')
      return
    }

    await submitEmail(trimmedEmail)
  }

  useEffect(() => {
    const trimmedEmail = email.toLowerCase().trim()
    if (
      trimmedEmail &&
      validateEmail(trimmedEmail) &&
      !isSubmitting &&
      !emailSuccess &&
      trimmedEmail !== lastAutoSubmittedEmail
    ) {
      const timer = window.setTimeout(() => {
        submitEmail(trimmedEmail)
      }, 800)

      return () => window.clearTimeout(timer)
    }
  }, [email, emailSuccess, isSubmitting, lastAutoSubmittedEmail])

  const handleDotPointerDown = (dotId: string, e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const svg = e.currentTarget.ownerSVGElement
    if (!svg) return
    
    const circleElement = e.currentTarget
    
    // Capture pointer on the circle to ensure events continue
    try {
      circleElement.setPointerCapture(e.pointerId)
    } catch (err) {
      // Silently handle if capture is not available
    }
    
    setDraggedDot(dotId)
    
    // Get SVG bounding rect for coordinate transformation
    const svgRect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    
    // Calculate scale factors
    const scaleX = viewBox.width / svgRect.width
    const scaleY = viewBox.height / svgRect.height
    
    // Get initial mouse position in SVG coordinates
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startSvgX = (startClientX - svgRect.left) * scaleX
    const startSvgY = (startClientY - svgRect.top) * scaleY

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Convert current mouse position to SVG coordinates
      const currentSvgX = (moveEvent.clientX - svgRect.left) * scaleX
      const currentSvgY = (moveEvent.clientY - svgRect.top) * scaleY
      
      // Calculate delta in SVG coordinate space
      const deltaX = currentSvgX - startSvgX
      const deltaY = currentSvgY - startSvgY
      
      setDotOffsets((prev) => ({
        ...prev,
        [dotId]: { x: deltaX, y: deltaY },
      }))
    }

    const handlePointerUp = () => {
      try {
        // Release pointer capture using the pointerId from the original event
        circleElement.releasePointerCapture(e.pointerId)
      } catch (err) {
        // Silently handle if release is not available
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.removeEventListener('mousemove', handlePointerMove)
      document.removeEventListener('mouseup', handlePointerUp)
      
      // Animate back to original position with spring effect
      setDraggedDot(null)
      setTimeout(() => {
        setDotOffsets((prev) => ({
          ...prev,
          [dotId]: { x: 0, y: 0 },
        }))
      }, 50)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    
    // Fallback for mouse events
    document.addEventListener('mousemove', handlePointerMove, { passive: false })
    document.addEventListener('mouseup', handlePointerUp)
  }

  if (!mounted) return null

  // Pitch formations
  const teamA = [
    { x: 120, y: 375 }, // GK
    { x: 240, y: 200 }, // Defenders
    { x: 240, y: 320 },
    { x: 240, y: 430 },
    { x: 240, y: 550 },
    { x: 420, y: 240 }, // Midfielders
    { x: 420, y: 375 },
    { x: 420, y: 510 },
    { x: 560, y: 180 }, // Forwards
    { x: 560, y: 375 },
    { x: 560, y: 570 },
  ]

  const teamB = [
    { x: 1080, y: 375 }, // GK
    { x: 960, y: 200 }, // Defenders
    { x: 960, y: 320 },
    { x: 960, y: 430 },
    { x: 960, y: 550 },
    { x: 780, y: 160 }, // Midfielders
    { x: 780, y: 320 },
    { x: 780, y: 430 },
    { x: 780, y: 590 },
    { x: 640, y: 310 }, // Strikers
    { x: 640, y: 440 },
  ]

  const passLines = [
    { from: { team: 'A', index: 1 }, to: { team: 'A', index: 5 }, id: 'p1' },
    { from: { team: 'A', index: 6 }, to: { team: 'A', index: 9 }, id: 'p2' },
    { from: { team: 'A', index: 4 }, to: { team: 'A', index: 7 }, id: 'p3' },
    { from: { team: 'A', index: 8 }, to: { team: 'B', index: 5 }, id: 'p4' },
    { from: { team: 'A', index: 5 }, to: { team: 'A', index: 8 }, id: 'p5' },
    { from: { team: 'A', index: 10 }, to: { team: 'B', index: 8 }, id: 'p6' },
  ]

  const getDotOffset = (team: 'A' | 'B', index: number) => {
    const dotId = `${team === 'A' ? 'a' : 'b'}-${index}`
    return dotOffsets[dotId] || { x: 0, y: 0 }
  }

  const weightOffset = (offset: { x: number; y: number }, factor = 1) => ({
    x: offset.x * factor,
    y: offset.y * factor,
  })

  const getConnectionLine = (from: { team: 'A' | 'B'; index: number }, to: { team: 'A' | 'B'; index: number }) => {
    const fromOffset = weightOffset(getDotOffset(from.team, from.index))
    const toOffset = weightOffset(getDotOffset(to.team, to.index))
    const fromPos = from.team === 'A' ? teamA[from.index] : teamB[from.index]
    const toPos = to.team === 'A' ? teamA[to.index] : teamB[to.index]

    return {
      x1: fromPos.x + fromOffset.x,
      y1: fromPos.y + fromOffset.y,
      x2: toPos.x + toOffset.x,
      y2: toPos.y + toOffset.y,
    }
  }

  const connectionLines = [
    {
      from: { team: 'A', index: 1 },
      to: { team: 'A', index: 5 },
      stroke: 'var(--primary-glow)',
    },
    {
      from: { team: 'A', index: 6 },
      to: { team: 'A', index: 9 },
      stroke: 'var(--primary-glow)',
    },
    {
      from: { team: 'B', index: 1 },
      to: { team: 'B', index: 5 },
      stroke: 'var(--green)',
    },
    {
      from: { team: 'B', index: 6 },
      to: { team: 'B', index: 9 },
      stroke: 'var(--green)',
    },
  ]

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-dm-sans)',
      zIndex: 1,
      }}
      >
      {/* Background gradients */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '60vw',
            height: '60vh',
            left: '30%',
            top: '40%',
            background: `radial-gradient(ellipse, var(--primary-glow) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '50vw',
            height: '50vh',
            left: '70%',
            top: '60%',
            background: `radial-gradient(ellipse, var(--primary-glow) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '40vw',
            height: '40vh',
            left: '50%',
            top: '25%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse, var(--green) 0%, transparent 70%)',
            filter: 'blur(40px)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Pitch Background */}
      <svg
        viewBox="0 0 1200 750"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100,
          pointerEvents: 'none',
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Pitch surface */}
        <rect x="0" y="0" width="1200" height="750" fill="var(--pitch-fill)" />

        {/* Pitch outline - subtle */}
        <rect x="80" y="50" width="1040" height="650" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" opacity="0.3" />

        {/* Halfway line - subtle */}
        <line x1="600" y1="50" x2="600" y2="700" stroke="var(--pitch-line)" strokeWidth="1.5" opacity="0.25" />

        {/* Center circle - subtle */}
        <circle cx="600" cy="375" r="100" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" opacity="0.2" />
        <circle cx="600" cy="375" r="6" fill="var(--primary)" opacity="0.15" />

        {/* Ball connection lines that move with the dragged dots */}
        {connectionLines.map((line, index) => {
          const current = getConnectionLine(line.from, line.to)
          return (
            <line
              key={index}
              x1={current.x1}
              y1={current.y1}
              x2={current.x2}
              y2={current.y2}
              stroke={line.stroke}
              strokeWidth="1.8"
              strokeDasharray="4 5"
              opacity="0.85"
            />
          )
        })}

        {/* Green zones - scoring areas */}
        <ellipse cx="150" cy="375" rx="90" ry="110" fill="var(--green)" opacity="0.12" />
        <ellipse cx="1050" cy="375" rx="90" ry="110" fill="var(--green)" opacity="0.12" />

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="heatmapGradient1">
            <stop offset="0%" stopColor="var(--primary-glow)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="heatmapGradient2">
            <stop offset="0%" stopColor="var(--primary-glow)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="heatmapGradient3">
            <stop offset="0%" stopColor="var(--primary-glow)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Left penalty area */}
        <rect x="80" y="165" width="180" height="420" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />
        <rect x="80" y="270" width="60" height="210" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />
        <circle cx="150" cy="375" r="4" fill="var(--primary)" opacity="0.5" />
        <path d="M 140 165 Q 80 240 80 375 Q 80 510 140 585" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />

        {/* Right penalty area */}
        <rect x="940" y="165" width="180" height="420" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />
        <rect x="1060" y="270" width="60" height="210" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />
        <circle cx="1050" cy="375" r="4" fill="var(--primary)" opacity="0.5" />
        <path d="M 1060 165 Q 1120 240 1120 375 Q 1120 510 1060 585" fill="none" stroke="var(--pitch-line)" strokeWidth="1.5" />

        {/* Pass lines with animated dots */}
        {passLines.map((line, i) => {
          const current = getConnectionLine(line.from, line.to)
          const isGreenLine = i === 2 || i === 5
          const lineColor = isGreenLine ? 'var(--green)' : 'var(--primary)'
          const dotColor = isGreenLine ? 'var(--green)' : 'var(--primary-bright)'
          return (
            <g key={line.id}>
              <line
                x1={current.x1}
                y1={current.y1}
                x2={current.x2}
                y2={current.y2}
                stroke={isGreenLine ? 'var(--green)' : lineColor}
                strokeWidth="1.5"
                strokeDasharray="8 5"
                opacity={isGreenLine ? '0.5' : '0.3'}
                id={`pass-line-${line.id}`}
              />
              <circle
                r="4"
                fill={dotColor}
                opacity="0.9"
                style={{
                  filter: isGreenLine ? 'drop-shadow(0 0 6px var(--green))' : 'drop-shadow(0 0 6px var(--primary-glow))',
                }}
              >
                <animateMotion dur={`${3 + i * 0.8}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                  <mpath href={`#pass-line-${line.id}`} />
                </animateMotion>
              </circle>
            </g>
          )
        })}

        {/* Team A (Blue) */}
        {teamA.map((pos, i) => {
          const dotId = `a-${i}`
          const offset = dotOffsets[dotId] || { x: 0, y: 0 }
          const isDragging = draggedDot === dotId
          const isHovered = hoveredDot === dotId
          return (
            <circle
              key={dotId}
              cx={pos.x}
              cy={pos.y}
              r={isHovered || isDragging ? "10" : "7"}
              fill={isDragging ? 'var(--primary-bright)' : isHovered ? 'var(--primary-bright)' : 'var(--primary)'}
              opacity={isDragging ? 1 : isHovered ? 1 : 0.75}
              className={`player-dot ${isDragging ? 'dragging' : ''}`}
              onPointerDown={(e) => handleDotPointerDown(dotId, e)}
              onPointerEnter={() => setHoveredDot(dotId)}
              onPointerLeave={() => setHoveredDot(null)}
              onMouseEnter={() => setHoveredDot(dotId)}
              onMouseLeave={() => setHoveredDot(null)}
              onTouchStart={(e) => {
                const touchEvent = e.touches[0]
                const syntheticEvent = {
                  ...e,
                  clientX: touchEvent.clientX,
                  clientY: touchEvent.clientY,
                  currentTarget: e.currentTarget,
                } as any
                handleDotPointerDown(dotId, syntheticEvent)
              }}
              style={({
                filter: isDragging 
                  ? 'drop-shadow(0 0 55px var(--primary-glow)) drop-shadow(0 0 95px var(--primary-glow))'
                  : isHovered 
                  ? 'drop-shadow(0 0 55px var(--primary-glow)) drop-shadow(0 0 95px var(--primary-glow))'
                  : 'drop-shadow(0 0 14px var(--primary-glow))',
                animation: isDragging ? 'none' : `drift-${(i % 22) + 1} ${6.5 + (i % 8)}s ease-in-out ${i * 0.2}s infinite alternate, ball-glow-blue 1s ease-in-out infinite alternate`,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), r 200ms ease, fill 200ms ease, opacity 200ms ease',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                pointerEvents: 'auto',
              } as any)}
            >
              {!isDragging && (
                <>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 2.5 -2.5; -2.5 2.5; 0 0"
                    dur="0.35s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 3.5 -1.8; -1.8 3.5; 0 0"
                    dur="4.2s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 1.8 -3.8; -1.8 3.8; 0 0"
                    dur="6.8s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                </>
              )}
            </circle>
          )
        })}

        {/* Team B (Green) */}
        {teamB.map((pos, i) => {
          const dotId = `b-${i}`
          const offset = dotOffsets[dotId] || { x: 0, y: 0 }
          const isDragging = draggedDot === dotId
          const isHovered = hoveredDot === dotId
          return (
            <circle
              key={dotId}
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? "9" : "7"}
              fill={isHovered ? 'var(--green)' : 'var(--green)'}
              opacity={isDragging ? 1 : isHovered ? 1 : 0.6}
              className={`player-dot ${isDragging ? 'dragging' : ''}`}
              onPointerDown={(e) => handleDotPointerDown(dotId, e)}
              onPointerEnter={() => setHoveredDot(dotId)}
              onPointerLeave={() => setHoveredDot(null)}
              onMouseEnter={() => setHoveredDot(dotId)}
              onMouseLeave={() => setHoveredDot(null)}
              onTouchStart={(e) => {
                const touchEvent = e.touches[0]
                const syntheticEvent = {
                  ...e,
                  clientX: touchEvent.clientX,
                  clientY: touchEvent.clientY,
                  currentTarget: e.currentTarget,
                } as any
                handleDotPointerDown(dotId, syntheticEvent)
              }}
              style={({
                animation: isDragging ? 'none' : `drift-${((i + 11) % 22) + 1} ${7.5 + (i % 7)}s ease-in-out ${(i + 11) * 0.2}s infinite alternate, ball-glow-green 1.1s ease-in-out infinite alternate`,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), r 200ms ease, fill 200ms ease, opacity 200ms ease',
                cursor: isDragging ? 'grabbing' : 'grab',
                filter: isHovered ? 'drop-shadow(0 0 24px var(--green)) drop-shadow(0 0 16px var(--green))' : 'drop-shadow(0 0 14px var(--green))',
                userSelect: 'none',
                pointerEvents: 'auto',
              } as any)}
            >
              {!isDragging && (
                <>
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 2.5 -2.5; -2.5 2.5; 0 0"
                    dur="0.35s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; -3.5 1.8; 1.8 -3.5; 0 0"
                    dur="4.3s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; -1.8 3.8; 1.8 -3.8; 0 0"
                    dur="7.1s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                </>
              )}
            </circle>
          )
        })}


      </svg>

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
        }}
      >
        {/* ZONE 1: Top Bar */}
        <div
            style={{
            pointerEvents: 'auto',
            zIndex: 50,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 50,
            background: 'var(--surface)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Logo + Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Football with neural network SVG */}
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="13" cy="13" r="12" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary-dim)" />
              <polygon points="13,4 17,9 15,15 11,15 9,9" fill="none" stroke="var(--primary)" strokeWidth="1" />
              <circle cx="13" cy="4" r="1.8" fill="var(--primary)" />
              <circle cx="17" cy="9" r="1.8" fill="var(--primary)" />
              <circle cx="15" cy="15" r="1.8" fill="var(--green)" />
              <circle cx="11" cy="15" r="1.8" fill="var(--green)" />
              <circle cx="9" cy="9" r="1.8" fill="var(--primary)" />
              <line x1="13" y1="4" x2="17" y2="9" stroke="var(--primary)" strokeWidth="0.8" opacity="0.6" />
              <line x1="17" y1="9" x2="15" y2="15" stroke="var(--primary)" strokeWidth="0.8" opacity="0.6" />
              <line x1="15" y1="15" x2="11" y2="15" stroke="var(--green)" strokeWidth="0.8" opacity="0.6" />
              <line x1="11" y1="15" x2="9" y2="9" stroke="var(--primary)" strokeWidth="0.8" opacity="0.6" />
              <line x1="9" y1="9" x2="13" y2="4" stroke="var(--primary)" strokeWidth="0.8" opacity="0.6" />
            </svg>

            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px', fontFamily: 'var(--font-dm-sans)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--deep)' }}>Ball</span>
              <span style={{ color: 'var(--primary)' }}>Knowledge</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--surface)',
              opacity: 0.8,
              border: '1px solid var(--border)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              transition: 'all 300ms ease',
              padding: 0,
              zIndex: 101,
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-dim)'
              e.currentTarget.style.borderColor = 'var(--primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {/* ZONE 2: Main Content */}
        <div
          style={{
            pointerEvents: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px 48px 24px',
            gap: 0,
            overflow: 'visible',
          }}
        >
          <div
            style={{
              maxWidth: '580px',
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px 6px 10px',
                background: 'var(--primary-dim)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                marginBottom: '12px',
                alignSelf: 'center',
              }}
            >
              <div
                className="badge-indicator"
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--primary)' }}>
                COMING SOON
              </span>
            </div>

            {/* Headline */}
            <div style={{ textAlign: 'center', marginBottom: '10px', lineHeight: '0.92', position: 'relative', width: '100%' }}>
            <div
              style={{
                fontFamily: 'var(--font-barlow-condensed)',
                fontWeight: 900,
                fontSize: 'clamp(44px, 5vw, 72px)',
                color: 'var(--text)',
                display: 'block',
                textShadow: theme === 'light'
                  ? '0 2px 4px rgba(0,0,0,0.1)'
                  : '0 0 20px var(--primary-glow), 0 0 40px var(--primary-glow)',
              }}
            >
              THE GAME
            </div>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-barlow-condensed)',
                    fontWeight: 900,
                    fontSize: 'clamp(48px, 5.5vw, 76px)',
                    color: 'var(--primary)',
                    display: 'block',
                    position: 'relative',
                    zIndex: 2,
                    textShadow: '0 0 30px var(--primary-glow), 0 0 60px var(--primary-glow), 0 0 100px var(--primary-glow)',
                    animation: theme === 'dark' ? 'decoded-glow 3s ease-in-out infinite' : 'none',
                  }}
                >
                  DECODED
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '120%',
                    height: '120%',
                    background: `radial-gradient(ellipse at center, var(--primary-glow) 0%, transparent 65%)`,
                    filter: 'blur(20px)',
                    zIndex: 1,
                    animation: 'glow-breathe 4s ease-in-out infinite',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>

            {/* Subheadline */}
            <p
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--muted)',
                textAlign: 'center',
                lineHeight: '1.55',
                maxWidth: '400px',
                margin: '0 auto 16px auto',
                textShadow: theme === 'light' 
                  ? '0 2px 4px rgba(0,0,0,0.2)' 
                  : '0 0 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.5)',
                letterSpacing: '0.3px',
              }}
            >
              Real-time football strategy analysis powered by neural networks and large language models. Tactical intelligence as the game unfolds.
            </p>

            {/* Email Form */}
            <form
              noValidate
              onSubmit={handleSubmit}
              style={{
                width: '100%',
                maxWidth: '460px',
                margin: '0 auto 18px auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  height: '52px',
                  gap: 0,
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError('')
                  }}
                  placeholder="Enter your email"
                  disabled={emailSuccess || isSubmitting}
                  style={{
                    flex: 1,
                    height: '52px',
                    padding: '0 20px',
                    background: 'var(--surface)',
                    borderTop: emailError && !emailError.includes('Already') ? '1px solid var(--danger)' : '1px solid var(--border)',
                  borderBottom: emailError && !emailError.includes('Already') ? '1px solid var(--danger)' : '1px solid var(--border)',
                  borderLeft: emailError && !emailError.includes('Already') ? '1px solid var(--danger)' : '1px solid var(--border)',
                    borderRight: 'none',
                    borderRadius: '28px 0 0 28px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '14px',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'all 300ms ease',
                    opacity: emailSuccess ? 0.6 : 1,
                    cursor: emailSuccess ? 'default' : 'text',
                  }}
                  onFocus={(e) => {
                    if (!emailError && !emailSuccess) {
                      e.currentTarget.style.borderTopColor = 'var(--primary)'
                      e.currentTarget.style.borderBottomColor = 'var(--primary)'
                      e.currentTarget.style.borderLeftColor = 'var(--primary)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--primary-glow)'
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    if (!emailError) {
                      e.currentTarget.style.borderTopColor = 'var(--border)'
                      e.currentTarget.style.borderBottomColor = 'var(--border)'
                      e.currentTarget.style.borderLeftColor = 'var(--border)'
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={emailSuccess || isSubmitting}
                  className="button-shimmer"
                  style={{
                    position: 'relative',
                    minWidth: '150px',
                    height: '52px',
                    padding: '0 24px',
                    background: emailSuccess ? 'var(--deep)' : `linear-gradient(135deg, var(--primary) 0%, var(--deep) 100%)`,
                    border: 'none',
                    borderRadius: '0 28px 28px 0',
                    fontFamily: 'var(--font-dm-sans)',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--on-primary)',
                    cursor: emailSuccess || isSubmitting ? 'default' : 'pointer',
                    letterSpacing: '0.03em',
                    transition: 'all 300ms ease',
                    opacity: emailSuccess ? 0.6 : 1,
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!emailSuccess && !isSubmitting) {
                      e.currentTarget.style.filter = 'brightness(1.12)'
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {emailSuccess ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      You&apos;re in
                    </span>
                  ) : (
                    'Get Early Access'
                  )}
                </button>
              </div>
              {emailError && (
                <div style={{
                  fontSize: '12px',
                  color: 'var(--danger)',
                  textAlign: 'center',
                  marginTop: '8px',
                  fontFamily: 'var(--font-dm-sans)',
                  background: 'rgba(220, 38, 38, 0.1)',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.08)',
                }}>
                  ⚠️ {emailError}
                </div>
              )}
              {emailSuccess && emailMessage && (
                <div style={{ fontSize: '12px', color: 'var(--green)', textAlign: 'center', marginTop: '8px', fontFamily: 'var(--font-dm-sans)', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
                  {emailMessage}
                </div>
              )}
            </form>

            {/* Gradient divider rule */}
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--border), var(--primary), transparent)',
                margin: '0 auto 18px auto',
              }}
            />

            {/* Countdown */}
            <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto 16px auto', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--green)', marginBottom: '12px', display: 'block' }}>
                LAUNCHING IN
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '16px' }}>
              {[
                { label: 'DAYS', value: countdown.days },
                { label: 'HOURS', value: countdown.hours },
                { label: 'MINUTES', value: countdown.minutes },
                { label: 'SECONDS', value: countdown.seconds },
              ].map((item, i) => {
                const isGreenItem = i >= 2
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: '64px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-barlow-condensed)',
                        fontWeight: 900,
                        fontSize: 'clamp(36px, 4.5vw, 56px)',
                        color: isGreenItem ? 'var(--green)' : 'var(--primary)',
                        lineHeight: 1,
                        textShadow: isGreenItem ? '0 0 24px var(--green)' : '0 0 24px var(--primary-glow)',
                      }}
                    >
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                  </div>
                )
              })}
              </div>
            </div>

            {/* Feature Chips */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: 0 }}>
              {[
                { text: 'Computer Vision Pipeline', Icon: Eye },
                { text: 'LLM Tactical Analysis', Icon: Brain },
                { text: 'Real-Time Processing', Icon: Zap },
              ].map((chip, i) => {
                const Icon = chip.Icon
                const borderColors = ['var(--primary)', 'var(--green)', 'var(--primary)']
                const iconColors = ['var(--primary)', 'var(--green)', 'var(--primary)']
                return (
                  <div
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 13px',
                            background: 'var(--primary-dim)',
                            borderTop: '1px solid var(--border)',
                            borderRight: '1px solid var(--border)',
                            borderBottom: '1px solid var(--border)',
                            borderLeft: `2px solid ${i === 1 ? 'var(--green)' : 'var(--primary)'}`,
                      borderRadius: '999px',
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--muted)',
                      transition: 'all 300ms ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      const isLLM = i === 1
                      const bg = isLLM
                        ? 'var(--green-dim)'
                        : 'var(--primary-dim)'
                      const border = isLLM ? 'var(--green)' : 'var(--primary)'
                      const text = 'var(--text)'
                      e.currentTarget.style.borderTopColor = border
                      e.currentTarget.style.borderRightColor = border
                      e.currentTarget.style.borderBottomColor = border
                      e.currentTarget.style.color = text
                      e.currentTarget.style.background = bg
                      if (isLLM) {
                        e.currentTarget.style.boxShadow = '0 0 20px var(--green)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      const isLLM = i === 1
                      const bg = 'var(--primary-dim)'
                      const border = 'var(--border)'
                      const text = 'var(--muted)'
                      e.currentTarget.style.borderTopColor = border
                      e.currentTarget.style.borderRightColor = border
                      e.currentTarget.style.borderBottomColor = border
                      e.currentTarget.style.color = text
                      e.currentTarget.style.background = bg
                      if (isLLM) {
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <Icon size={16} style={{ color: iconColors[i] }} />
                    {chip.text}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ZONE 3: Footer Bar */}
        <div
          style={{
            height: '56px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'transparent',
          }}
        >
          {[
            { icon: Github, href: 'https://github.com' },
            { icon: Linkedin, href: 'https://linkedin.com' },
          ].map((link, i) => {
            const Icon = link.icon
            return (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface)',
                  opacity: 0.7,
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 300ms ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.color = 'var(--primary)'
                  e.currentTarget.style.background = 'var(--primary-dim)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--muted)'
                  e.currentTarget.style.background = 'var(--surface)'
                }}
              >
                <Icon size={18} />
              </a>
            )
          })}
        </div>

        {/* Footer ground glow */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: theme === 'light'
              ? 'linear-gradient(to top, var(--green-dim), transparent)'
              : 'linear-gradient(to top, var(--green-dim), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      </div>
    </div>
  )
}

export default BallKnowledge