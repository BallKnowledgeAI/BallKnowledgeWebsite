'use client'

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { ArrowDown, ArrowRight, Pause, Play } from 'lucide-react'
import {
  HALF_W,
  MatchSim,
  View,
  drawPitch,
  nearestPlayer,
  readPalette,
  type Camera,
  type MatchEvent,
  type Mode,
  type Phase,
  type Vec,
} from './pitch-engine'

const PHASE_COPY: Record<Phase, { label: string; tone: 'blue' | 'green' | 'muted'; cue: string }> = {
  'build-up': {
    label: 'Build-up',
    tone: 'blue',
    cue: 'Split the centre-backs wider and invite the press before playing through the six',
  },
  progression: {
    label: 'Progression',
    tone: 'blue',
    cue: 'Third-man run is on. Bounce off the eight and release the far-side winger',
  },
  'final-third': {
    label: 'Final third',
    tone: 'blue',
    cue: 'Overload the half-space. A near-post run pins the block and opens the cutback',
  },
  transition: {
    label: 'Transition',
    tone: 'green',
    cue: 'Ball won. First pass forward inside three seconds while their shape is still open',
  },
  pressing: {
    label: 'Pressing',
    tone: 'green',
    cue: 'Trap is set. Jump when their fullback receives facing his own goal',
  },
  'defensive-shape': {
    label: 'Out of possession',
    tone: 'muted',
    cue: 'Stay compact. Push the midfield line five yards higher when the ball goes wide',
  },
}

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'press', label: 'High press' },
  { value: 'counter', label: 'Low block' },
]

const EVENT_COPY: Record<MatchEvent['type'], (event: MatchEvent) => { text: string; tone: 'blue' | 'green' | 'amber' }> = {
  goal: (event) => ({ text: `Goal · ${event.team === 'blue' ? 'Blue' : 'Green'}`, tone: event.team === 'blue' ? 'blue' : 'green' }),
  save: (event) => ({ text: `Shot saved · ${event.team === 'blue' ? 'Blue' : 'Green'} keeper`, tone: 'amber' }),
  interception: (event) => ({ text: `Interception · ${event.role ?? ''} ${event.team === 'blue' ? 'Blue' : 'Green'}`, tone: event.team === 'blue' ? 'blue' : 'green' }),
  tackle: (event) => ({ text: `Ball won · ${event.role ?? ''} ${event.team === 'blue' ? 'Blue' : 'Green'}`, tone: event.team === 'blue' ? 'blue' : 'green' }),
  'called-pass': (event) => ({ text: `Your call · played to ${event.role ?? 'the runner'}`, tone: 'blue' }),
  counterpress: () => ({ text: 'Your call · counter-press triggered', tone: 'amber' }),
}

type Hud = {
  phase: Phase
  possession: number
  passes: number
  score: { blue: number; green: number }
  blueOnBall: boolean
}

type TickerItem = { id: number; minute: number; text: string; tone: 'blue' | 'green' | 'amber' }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Low at the tunnel mouth, then up to the broadcast gantry.
const TUNNEL: Camera = { px: 0, py: 1.9, pz: 47, tx: 0, ty: 1.4, tz: 0, fov: 52 }
const GANTRY: Camera = { px: 0, py: 40, pz: 70, tx: 0, ty: 0, tz: 4, fov: 42 }

function cameraAt(progress: number, lookX: number, lookY: number, time: number): Camera {
  const t = ease(progress)
  const drift = Math.sin(time * 0.07) * 3 * t
  return {
    px: lerp(TUNNEL.px, GANTRY.px, t) + lookX * 9 * t + drift,
    py: lerp(TUNNEL.py, GANTRY.py, t) - lookY * 3 * t,
    pz: lerp(TUNNEL.pz, GANTRY.pz, t),
    tx: lookX * (4 + 6 * t) + drift * 0.5,
    ty: lerp(TUNNEL.ty, GANTRY.ty, t) + lookY * 1.5,
    tz: lerp(TUNNEL.tz, GANTRY.tz, t),
    fov: lerp(TUNNEL.fov, GANTRY.fov, t),
  }
}

export function LiveArena() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const simRef = useRef<MatchSim | null>(null)
  const viewRef = useRef(new View())
  const progressRef = useRef(0)
  const lookRef = useRef({ x: 0, y: 0, goalX: 0, goalY: 0 })
  const hoverRef = useRef<{ point: Vec | null; player: number | null }>({ point: null, player: null })
  const playingRef = useRef(true)
  const reducedRef = useRef(false)
  const renderRef = useRef<() => void>(() => {})
  const startRef = useRef<() => void>(() => {})
  const stopRef = useRef<() => void>(() => {})
  const clockRef = useRef(52 * 60 + 14)
  const tickerId = useRef(0)

  const [playing, setPlaying] = useState(true)
  const [mode, setMode] = useState<Mode>('balanced')
  const [clock, setClock] = useState(52 * 60 + 14)
  const [hud, setHud] = useState<Hud>({ phase: 'build-up', possession: 50, passes: 0, score: { blue: 0, green: 0 }, blueOnBall: true })
  const [ticker, setTicker] = useState<TickerItem[]>([])
  const [goal, setGoal] = useState<{ key: number; team: 'blue' | 'green' } | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reducedRef.current = reduced
    if (reduced) {
      playingRef.current = false
      setPlaying(false)
    }

    const sim = new MatchSim()
    sim.warm(4)
    sim.onEvent = (event) => {
      const copy = EVENT_COPY[event.type](event)
      tickerId.current += 1
      const item = { id: tickerId.current, minute: Math.floor(clockRef.current / 60), ...copy }
      setTicker((items) => [item, ...items].slice(0, 3))
      if (event.type === 'goal') setGoal({ key: item.id, team: event.team })
    }
    simRef.current = sim

    let palette = readPalette(stage)
    let dpr = 1
    let frame = 0
    let last = performance.now()
    let inView = true
    let hudTimer = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      render()
    }

    const pushHud = () => {
      const total = sim.possessionTime.blue + sim.possessionTime.green
      setHud({
        phase: sim.phase(),
        possession: Math.round((sim.possessionTime.blue / total) * 100),
        passes: sim.passes.blue,
        score: { ...sim.score },
        blueOnBall: sim.possession === 'blue',
      })
    }

    const render = () => {
      const look = lookRef.current
      const camera = cameraAt(progressRef.current, look.x, look.y, sim.time)
      viewRef.current.set(camera, canvas.width, canvas.height)
      drawPitch(ctx, viewRef.current, sim, palette, dpr, {
        hover: hoverRef.current.point,
        hoveredPlayer: hoverRef.current.player,
        time: sim.time,
      })
    }
    renderRef.current = render

    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const look = lookRef.current
      look.x += (look.goalX - look.x) * Math.min(1, dt * 3)
      look.y += (look.goalY - look.y) * Math.min(1, dt * 3)
      if (playingRef.current) {
        sim.step(dt)
        hudTimer += dt
        if (hudTimer > 0.25) {
          hudTimer = 0
          pushHud()
        }
      }
      render()
      frame = requestAnimationFrame(loop)
    }

    const start = () => {
      if (frame || (reduced && !playingRef.current)) return
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    startRef.current = () => {
      if (inView && !document.hidden) start()
    }
    stopRef.current = stop

    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, rect.height - window.innerHeight)
      let progress = Math.min(1, Math.max(0, -rect.top / (travel * 0.72)))
      // Reduced motion: cut between the two shots instead of flying the camera.
      if (reduced) progress = progress < 0.5 ? 0 : 1
      progressRef.current = progress
      section.style.setProperty('--p', progress.toFixed(4))
      stage.dataset.hud = progress > 0.6 ? 'on' : 'off'
      if (!frame) render()
    }

    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView && !document.hidden) start()
      else stop()
    })
    visibility.observe(section)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (inView) start()
    }

    const themeWatcher = new MutationObserver(() => {
      palette = readPalette(stage)
      render()
    })
    themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    const sizeWatcher = new ResizeObserver(resize)
    sizeWatcher.observe(canvas)

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    onScroll()
    resize()
    pushHud()
    start()

    return () => {
      stop()
      visibility.disconnect()
      themeWatcher.disconnect()
      sizeWatcher.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    playingRef.current = playing
    if (reducedRef.current) {
      if (playing) startRef.current()
      else stopRef.current()
    }
    if (!playing) return
    const interval = window.setInterval(() => {
      clockRef.current += 1
      setClock(clockRef.current)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [playing])

  useEffect(() => {
    if (simRef.current) simRef.current.mode = mode
  }, [mode])

  useEffect(() => {
    if (!goal) return
    const timeout = window.setTimeout(() => setGoal(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [goal])

  const pointerToGround = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return viewRef.current.unproject((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY)
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    lookRef.current.goalX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    lookRef.current.goalY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    const point = pointerToGround(event)
    const sim = simRef.current
    hoverRef.current = { point, player: point && sim ? nearestPlayer(sim, point) : null }
    if (!playingRef.current) renderRef.current()
  }

  const handlePointerLeave = () => {
    lookRef.current.goalX = 0
    lookRef.current.goalY = 0
    hoverRef.current = { point: null, player: null }
    if (!playingRef.current) renderRef.current()
  }

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (stageRef.current?.dataset.hud !== 'on') return
    const point = pointerToGround(event)
    if (point && simRef.current) {
      simRef.current.callPass(point)
      if (!playingRef.current) renderRef.current()
    }
  }

  const callFlank = (lane: -1 | 0 | 1) => {
    const sim = simRef.current
    if (!sim) return
    const ball = sim.ballGround()
    sim.callPass({ x: ball.x + 14, z: lane * (HALF_W - 8) })
    if (!playingRef.current) renderRef.current()
  }

  const walkOut = () => {
    const section = sectionRef.current
    if (!section) return
    const travel = section.offsetHeight - window.innerHeight
    window.scrollTo({ top: section.offsetTop + travel * 0.75, behavior: reducedRef.current ? 'auto' : 'smooth' })
  }

  const phase = PHASE_COPY[hud.phase]
  const minutes = Math.floor(clock / 60)
  const seconds = String(clock % 60).padStart(2, '0')

  return (
    <section ref={sectionRef} className="matchday-hero" aria-label="Live pitch">
      <div ref={stageRef} className="matchday-hero-stage" data-hud="off">
        <div className="matchday-stadium" aria-hidden="true">
          <span className="matchday-floodlight left" />
          <span className="matchday-floodlight right" />
        </div>

        <canvas
          ref={canvasRef}
          className="matchday-canvas"
          role="img"
          aria-label={`Live simulated match. Blue ${hud.score.blue}, Green ${hud.score.green}. Phase: ${phase.label}. ${phase.cue}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
        />

        <div className="matchday-tunnel" aria-hidden="true">
          <span className="matchday-tunnel-wall left" />
          <span className="matchday-tunnel-wall right" />
          <span className="matchday-tunnel-roof" />
        </div>

        <div className="matchday-hero-copy">
          <span className="matchday-kicker"><i className="matchday-live-dot" aria-hidden="true" />Now entering · Matchday live</span>
          <h1 className="matchday-hero-title">The game, <em>decoded</em></h1>
          <p className="matchday-hero-lead">
            Real-time football strategy analysis powered by neural networks and large language models. Walk out of the tunnel and read the match the way the model does.
          </p>
          <div className="matchday-hero-actions">
            <button className="matchday-btn matchday-btn-primary" type="button" onClick={walkOut}>
              Walk onto the pitch <ArrowDown size={16} strokeWidth={2.4} />
            </button>
            <a className="matchday-btn matchday-btn-ghost" href="#access">
              Get early access <ArrowRight size={16} strokeWidth={2.4} />
            </a>
          </div>
        </div>

        <div className="matchday-scroll-cue" aria-hidden="true">
          <span>Scroll to walk out</span>
          <i />
        </div>

        <div className="matchday-hud">
          <div className="matchday-hud-top">
            <div className="matchday-scoreboard" aria-live="polite">
              <span className="matchday-scoreboard-live"><i className="matchday-live-dot" aria-hidden="true" />{playing ? 'Live' : 'Paused'}</span>
              <span className="matchday-scoreboard-clock">{minutes}:{seconds}</span>
              <span className="matchday-scoreboard-team blue">BLU</span>
              <span className="matchday-scoreboard-score">{hud.score.blue}<b>–</b>{hud.score.green}</span>
              <span className="matchday-scoreboard-team green">GRN</span>
            </div>

            <dl className="matchday-readouts">
              <div><dt>Possession</dt><dd>{hud.possession}%</dd></div>
              <div><dt>Blue passes</dt><dd>{hud.passes}</dd></div>
              <div><dt>Phase</dt><dd className={`tone-${phase.tone}`}>{phase.label}</dd></div>
            </dl>
          </div>

          <div className="matchday-hud-bottom">
            <article className="matchday-cue-card" data-tone={phase.tone}>
              <span className="matchday-eyebrow">Ball Knowledge · live cue · {phase.label}</span>
              <p key={hud.phase}>{phase.cue}</p>
              <ol className="matchday-ticker" aria-label="Match events">
                {ticker.map((item) => (
                  <li key={item.id} data-tone={item.tone}><time>{item.minute}&apos;</time>{item.text}</li>
                ))}
              </ol>
            </article>

            <div className="matchday-controls">
              <div className="matchday-segmented" role="radiogroup" aria-label="Blue team instruction">
                {MODES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={mode === item.value}
                    className={mode === item.value ? 'is-active' : ''}
                    onClick={() => setMode(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="matchday-call-row" aria-label="Call the next pass">
                <button type="button" onClick={() => callFlank(-1)}>{hud.blueOnBall ? 'Switch left' : 'Press left'}</button>
                <button type="button" onClick={() => callFlank(0)}>{hud.blueOnBall ? 'Through the middle' : 'Counter-press'}</button>
                <button type="button" onClick={() => callFlank(1)}>{hud.blueOnBall ? 'Switch right' : 'Press right'}</button>
                <button
                  type="button"
                  className="matchday-icon-btn"
                  onClick={() => setPlaying((value) => !value)}
                  aria-label={playing ? 'Pause the match' : 'Play the match'}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
              <span className="matchday-hint">Or click anywhere on the grass to call the next pass</span>
            </div>
          </div>
        </div>

        {goal ? (
          <div key={goal.key} className="matchday-goal-flash" data-team={goal.team} aria-hidden="true">
            <span>Goal</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
