'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, BrainCircuit, Gauge, MessageSquareText, ScanLine } from 'lucide-react'

/* ---------- shared: count-up on reveal ---------- */

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setShown(0)
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const started = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / 1400)
        setShown(Math.round(value * (1 - (1 - progress) ** 3)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return <span ref={ref}>{shown}{suffix}</span>
}

/* ---------- spec strip ---------- */

const SPECS = [
  { value: 22, suffix: '', unit: 'players', label: 'Tracked in context, every frame' },
  { value: 5, suffix: '', unit: 'phases', label: 'Build-up to final third, read live' },
  { value: 4, suffix: '', unit: 'stages', label: 'Capture, decode, explain, improve' },
  { value: 90, suffix: "'", unit: 'minutes', label: 'Every one of them, as it happens' },
]

export function SpecStrip() {
  return (
    <section className="matchday-section matchday-specs" aria-label="Ball Knowledge at a glance">
      {SPECS.map((spec) => (
        <div className="matchday-spec" data-reveal key={spec.unit}>
          <strong><CountUp value={spec.value} suffix={spec.suffix} /><small>{spec.unit}</small></strong>
          <span>{spec.label}</span>
        </div>
      ))}
    </section>
  )
}

/* ---------- lineup (the showroom) ---------- */

type ModuleId = 'coach' | 'press' | 'setpiece' | 'squad'

const MODULES: Array<{ id: ModuleId; name: string; word: string; line: string; specs: [string, string][] }> = [
  {
    id: 'coach',
    name: 'Coach UI',
    word: 'COMMAND',
    line: 'The touchline command centre. Priority cues with confidence, and a live pitch that shows where the trigger is',
    specs: [['Built for', 'Head coach and bench'], ['Signal', 'Priority cues with confidence'], ['Canvas', 'Live pitch with trigger zones'], ['Mode', 'Command centre + live analysis']],
  },
  {
    id: 'press',
    name: 'Press & Intensity',
    word: 'PRESS',
    line: 'Live press telemetry. See who jumps, who recovers, and when the block starts to tire',
    specs: [['Built for', 'Analysts and performance staff'], ['Signal', 'Pressing load and recovery'], ['Canvas', 'Pressure halos and press routes'], ['Mode', 'Live telemetry']],
  },
  {
    id: 'setpiece',
    name: 'Set Piece',
    word: 'DEAD BALL',
    line: 'A recognition workbench for corners and free kicks, with a broadcast-style visualiser and a readout of every routine',
    specs: [['Built for', 'Set-piece coaches'], ['Signal', 'Routine recognition'], ['Canvas', 'Broadcast-style visualiser'], ['Mode', 'Recognition workbench']],
  },
  {
    id: 'squad',
    name: 'Squad Builder',
    word: 'XI',
    line: 'Pick the shape, place the players and carry the plan into a live dashboard on matchday',
    specs: [['Built for', 'Match prep and recruitment'], ['Signal', 'Formation and player context'], ['Canvas', 'Squad board and live dashboard'], ['Mode', 'Squad builder']],
  },
]

function ModuleVisual({ id }: { id: ModuleId }) {
  if (id === 'coach') {
    return (
      <svg viewBox="0 0 400 260" role="img" aria-label="Coach UI: a cue card over a pitch trigger zone">
        <rect x="20" y="30" width="360" height="200" rx="16" className="v-pitch" />
        <line x1="200" y1="30" x2="200" y2="230" className="v-line" />
        <circle cx="200" cy="130" r="30" className="v-line" />
        <ellipse cx="292" cy="112" rx="58" ry="46" className="v-zone" />
        <ellipse cx="292" cy="112" rx="66" ry="54" className="v-zone-ring" />
        {[[250, 96], [280, 150], [318, 90]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="7" className="v-blue" />)}
        {[[300, 120], [336, 140]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="7" className="v-green" />)}
        <path d="M250 96 Q270 70 318 90" className="v-route" />
        <g className="v-card">
          <rect x="44" y="150" width="176" height="62" rx="10" />
          <rect x="44" y="150" width="4" height="62" rx="2" className="v-card-edge" />
          <text x="60" y="171" className="v-eyebrow">HIGH · PRESSING</text>
          <text x="60" y="191" className="v-text">Trigger the jump on</text>
          <text x="60" y="205" className="v-text">the fullback&apos;s first touch</text>
        </g>
      </svg>
    )
  }
  if (id === 'press') {
    return (
      <svg viewBox="0 0 400 260" role="img" aria-label="Press and Intensity: pressure halos and press load bars">
        <rect x="20" y="30" width="250" height="200" rx="16" className="v-pitch" />
        <line x1="145" y1="30" x2="145" y2="230" className="v-line" />
        <circle cx="175" cy="120" r="42" className="v-halo" />
        <circle cx="175" cy="120" r="24" className="v-halo" />
        <circle cx="175" cy="120" r="7" className="v-green" />
        {[[120, 80], [128, 158], [210, 86]].map(([x, y]) => (
          <g key={`${x}`}>
            <path d={`M${x} ${y} L${x + (175 - x) * 0.7} ${y + (120 - y) * 0.7}`} className="v-route" />
            <circle cx={x} cy={y} r="7" className="v-blue" />
          </g>
        ))}
        {[62, 84, 48, 92, 70].map((height, index) => (
          <rect key={index} x={292 + index * 17} y={200 - height * 1.5} width="10" height={height * 1.5} rx="5" className="v-bar" />
        ))}
        <text x="292" y="222" className="v-eyebrow">PRESS LOAD</text>
      </svg>
    )
  }
  if (id === 'setpiece') {
    return (
      <svg viewBox="0 0 400 260" role="img" aria-label="Set Piece: a corner delivery into the box">
        <rect x="20" y="30" width="360" height="200" rx="16" className="v-pitch" />
        <rect x="250" y="62" width="130" height="136" className="v-line" />
        <rect x="330" y="98" width="50" height="64" className="v-line" />
        <ellipse cx="318" cy="118" rx="30" ry="22" className="v-zone" />
        <path d="M378 32 Q300 40 318 118" className="v-route" />
        <circle cx="378" cy="32" r="5" className="v-ball" />
        {[[296, 104], [312, 140], [284, 150], [336, 124]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="7" className="v-blue" />)}
        {[[302, 118], [322, 106], [290, 132], [344, 142], [366, 128]].map(([cx, cy]) => <circle key={`${cx}`} cx={cx} cy={cy} r="7" className="v-green" />)}
        <g className="v-card">
          <rect x="40" y="52" width="150" height="54" rx="10" />
          <text x="54" y="73" className="v-eyebrow">● REC · CORNER</text>
          <text x="54" y="93" className="v-text">Near-post flick routine</text>
        </g>
      </svg>
    )
  }
  const shape: [number, number][] = [[48, 130], [104, 58], [96, 106], [96, 154], [104, 202], [172, 82], [160, 130], [172, 178], [240, 64], [252, 130], [240, 196]]
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Squad Builder: a 4-3-3 team sheet">
      <rect x="20" y="30" width="290" height="200" rx="16" className="v-pitch" />
      <line x1="165" y1="30" x2="165" y2="230" className="v-line" />
      <path d="M104 58 L96 106 L96 154 L104 202 M172 82 L160 130 L172 178 M240 64 L252 130 L240 196" className="v-shape" />
      {shape.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="9" className={index === 9 ? 'v-green' : 'v-blue'} />)}
      <g className="v-card">
        <rect x="322" y="52" width="62" height="156" rx="10" />
        <text x="334" y="76" className="v-eyebrow">4-3-3</text>
        {[96, 120, 144, 168, 192].map((y) => <rect key={y} x="334" y={y - 8} width="38" height="6" rx="3" className="v-bar" />)}
      </g>
    </svg>
  )
}

export function Lineup() {
  const [active, setActive] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const module = MODULES[active]

  const select = (index: number, focus = false) => {
    const next = (index + MODULES.length) % MODULES.length
    setActive(next)
    if (focus) tabs.current[next]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') select(active + 1, true)
    if (event.key === 'ArrowLeft') select(active - 1, true)
    if (event.key === 'Home') select(0, true)
    if (event.key === 'End') select(MODULES.length - 1, true)
  }

  return (
    <section className="matchday-section matchday-lineup" id="lineup" aria-labelledby="lineup-title">
      <div className="matchday-section-head" data-reveal>
        <span className="matchday-eyebrow">The lineup</span>
        <h2 id="lineup-title" className="matchday-h2">One brain, <em>four</em> positions</h2>
        <p>Every Ball Knowledge surface runs on the same tactical model. Pick the one built for your seat in the stadium</p>
      </div>

      <div className="matchday-lineup-tabs" role="tablist" aria-label="Ball Knowledge modules" onKeyDown={onKeyDown} data-reveal>
        {MODULES.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => { tabs.current[index] = element }}
            role="tab"
            type="button"
            id={`lineup-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls="lineup-panel"
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
          >
            <span>0{index + 1}</span>
            {item.name}
          </button>
        ))}
        <span className="matchday-lineup-indicator" style={{ '--tab-index': active } as CSSProperties} aria-hidden="true" />
      </div>

      <div className="matchday-lineup-stage" id="lineup-panel" role="tabpanel" aria-labelledby={`lineup-tab-${module.id}`} data-reveal>
        <div className="matchday-lineup-showroom">
          <span className="matchday-lineup-word" aria-hidden="true">{module.word}</span>
          <div className="matchday-lineup-visual" key={module.id}>
            <ModuleVisual id={module.id} />
          </div>
          <span className="matchday-lineup-floor" aria-hidden="true" />
        </div>

        <div className="matchday-lineup-info" key={`${module.id}-info`}>
          <span className="matchday-eyebrow">Module 0{active + 1} / 0{MODULES.length}</span>
          <h3>{module.name}</h3>
          <p>{module.line}</p>
          <dl className="matchday-spec-sheet">
            {module.specs.map(([term, value]) => (
              <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <div className="matchday-lineup-nav">
            <button type="button" className="matchday-icon-btn" onClick={() => select(active - 1)} aria-label="Previous module"><ArrowLeft size={18} /></button>
            <button type="button" className="matchday-icon-btn" onClick={() => select(active + 1)} aria-label="Next module"><ArrowRight size={18} /></button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- pipeline story (pinned) ---------- */

const STEPS = [
  { title: 'Capture', icon: ScanLine, copy: 'Ingest the match and map every relevant movement. All 22 players, the ball and the space between them, frame by frame' },
  { title: 'Decode', icon: BrainCircuit, copy: 'Recognise structure, pressure and tactical intent. Lines, overloads and the lanes that open for half a second' },
  { title: 'Explain', icon: MessageSquareText, copy: 'Translate model output into clear football language, the cue a coach can shout from the touchline' },
  { title: 'Improve', icon: Gauge, copy: 'Feed the insight into review, training and decisions, so the next match starts smarter than the last' },
]

const STORY_PLAYERS: [number, number, 'b' | 'g'][] = [
  [14, 34, 'b'], [26, 14, 'b'], [24, 28, 'b'], [24, 40, 'b'], [26, 54, 'b'], [42, 22, 'b'], [38, 34, 'b'], [42, 46, 'b'], [60, 14, 'b'], [64, 34, 'b'], [60, 54, 'b'],
  [92, 34, 'g'], [78, 16, 'g'], [80, 28, 'g'], [80, 40, 'g'], [78, 52, 'g'], [66, 20, 'g'], [68, 30, 'g'], [68, 40, 'g'], [66, 48, 'g'], [54, 30, 'g'], [54, 40, 'g'],
]

export function PipelineStory() {
  const [step, setStep] = useState(0)
  const refs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStep(Number((entry.target as HTMLElement).dataset.step))
        })
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((element) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="matchday-section matchday-story" aria-labelledby="story-title">
      <div className="matchday-section-head" data-reveal>
        <span className="matchday-eyebrow">How it reads the game</span>
        <h2 id="story-title" className="matchday-h2">From movement to <em>meaning</em></h2>
      </div>

      <div className="matchday-story-grid">
        <div className="matchday-story-visual" data-step={step} aria-hidden="true">
          <div className="matchday-story-head">
            <span className="matchday-eyebrow">Stage 0{step + 1} · {STEPS[step].title}</span>
            <b>{step === 0 ? 'Tracking 22 / 22' : step === 1 ? 'Shape locked' : step === 2 ? 'Cue ready' : 'Session plan'}</b>
          </div>
          <svg viewBox="0 0 105 68">
            <rect x="0.5" y="0.5" width="104" height="67" rx="2" className="s-pitch" />
            <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" className="s-line" />
            <circle cx="52.5" cy="34" r="9" className="s-line" />
            <rect x="0.5" y="14" width="16" height="40" className="s-line" />
            <rect x="88.5" y="14" width="16" height="40" className="s-line" />

            <g className="s-layer s-heat">
              <circle cx="62" cy="20" r="14" />
              <circle cx="66" cy="44" r="10" />
              <circle cx="44" cy="30" r="9" />
            </g>

            <g className="s-layer s-shape">
              <path d="M26 14 L24 28 L24 40 L26 54" />
              <path d="M42 22 L38 34 L42 46" />
              <path d="M60 14 L64 34 L60 54" />
              <path d="M78 16 L80 28 L80 40 L78 52" className="s-shape-away" />
              <polygon points="54,30 66,20 68,30" className="s-overload" />
            </g>

            {STORY_PLAYERS.map(([cx, cy, team], index) => (
              <g key={index}>
                <rect x={cx - 3} y={cy - 3} width="6" height="6" className="s-box" style={{ transitionDelay: `${index * 18}ms` }} />
                <circle cx={cx} cy={cy} r="1.6" className={team === 'b' ? 's-blue' : 's-green'} />
              </g>
            ))}

            <g className="s-layer s-lane">
              <path d="M42 46 Q58 58 60 54" />
              <path d="M60 54 Q76 62 86 50" />
            </g>

            <rect x="-6" y="0" width="6" height="68" className="s-scan" />
          </svg>
          <div className="matchday-story-cue">
            <span className="matchday-eyebrow">Action</span>
            <p>Weak-side channel is open. Release the right winger after the next regain</p>
          </div>
          <div className="matchday-story-plan">
            <span className="matchday-eyebrow">Training focus</span>
            <p>Rehearse the switch: 3v2 on the far side, two-touch limit</p>
          </div>
        </div>

        <ol className="matchday-story-steps">
          {STEPS.map((item, index) => {
            const Icon = item.icon
            return (
              <li
                key={item.title}
                ref={(element) => { refs.current[index] = element }}
                data-step={index}
                className={index === step ? 'is-active' : ''}
              >
                <span className="matchday-story-index">0{index + 1}</span>
                <Icon size={20} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ---------- configurator ---------- */

type Formation = '4-3-3' | '4-4-2' | '3-5-2'
type PlanPhase = 'press' | 'build' | 'counter'
type Overlay = 'lanes' | 'pressure' | 'heat'

const FORMATIONS: Record<Formation, [number, number][]> = {
  '4-3-3': [[5, 34], [22, 10], [20, 26], [20, 42], [22, 58], [38, 22], [34, 34], [38, 46], [58, 10], [62, 34], [58, 58]],
  '4-4-2': [[5, 34], [22, 10], [20, 26], [20, 42], [22, 58], [42, 10], [38, 27], [38, 41], [42, 58], [60, 28], [60, 40]],
  '3-5-2': [[5, 34], [20, 18], [18, 34], [20, 50], [40, 6], [38, 24], [32, 34], [38, 44], [40, 62], [60, 28], [60, 40]],
}

const OPPONENTS: [number, number][] = [[100, 34], [84, 12], [86, 27], [86, 41], [84, 56], [70, 12], [72, 28], [72, 40], [70, 56], [58, 30], [58, 38]]

const PHASES: Record<PlanPhase, { label: string; shift: number; squeeze: number; focus: string }> = {
  press: { label: 'High press', shift: 14, squeeze: 0.84, focus: 'Jump on the fullback’s first touch. Front three screen the pivot, the eights lock the half-spaces' },
  build: { label: 'Build-up', shift: -4, squeeze: 1.08, focus: 'Split the centre-backs, drop the six between them and draw the first line before playing through' },
  counter: { label: 'Counter', shift: 6, squeeze: 0.95, focus: 'Stay compact, win it in midfield, then release the runners early into the channels' },
}

const LANES: [number, number][] = [[2, 6], [6, 9], [4, 7], [7, 10], [1, 5], [5, 8]]

export function Configurator() {
  const [formation, setFormation] = useState<Formation>('4-3-3')
  const [phase, setPhase] = useState<PlanPhase>('press')
  const [overlays, setOverlays] = useState<Record<Overlay, boolean>>({ lanes: true, pressure: true, heat: false })
  const plan = PHASES[phase]

  const positions = FORMATIONS[formation].map(([x, y], index) => {
    if (index === 0) return [x + plan.shift * 0.25, y] as [number, number]
    const forward = index >= 8 ? 1.2 : 1
    return [x + plan.shift * forward, 34 + (y - 34) * plan.squeeze] as [number, number]
  })
  const opponents = OPPONENTS.map(([x, y]) => [x - plan.shift * 0.35, 34 + (y - 34) * (phase === 'press' ? 1.05 : 0.9)] as [number, number])
  const activeOverlays = (Object.keys(overlays) as Overlay[]).filter((key) => overlays[key])

  return (
    <section className="matchday-section matchday-config" id="configure" aria-labelledby="config-title">
      <div className="matchday-section-head" data-reveal>
        <span className="matchday-eyebrow">Configurator</span>
        <h2 id="config-title" className="matchday-h2">Build your <em>match plan</em></h2>
        <p>Choose a shape, a phase and what the model should draw. The pitch updates as you go</p>
      </div>

      <div className="matchday-config-grid" data-reveal>
        <div className="matchday-config-preview">
          <div className="matchday-config-head">
            <span className="matchday-eyebrow">Preview</span>
            <b>{formation} · {plan.label}</b>
          </div>
          <svg viewBox="0 0 105 68" role="img" aria-label={`${formation} in ${plan.label}, overlays: ${activeOverlays.join(', ') || 'none'}`}>
            <defs>
              <radialGradient id="config-heat">
                <stop offset="0%" className="c-heat-core" />
                <stop offset="100%" className="c-heat-edge" />
              </radialGradient>
              <marker id="config-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10Z" className="c-arrow" />
              </marker>
            </defs>
            <rect x="0.5" y="0.5" width="104" height="67" rx="2" className="s-pitch" />
            <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" className="s-line" />
            <circle cx="52.5" cy="34" r="9" className="s-line" />
            <rect x="0.5" y="14" width="16" height="40" className="s-line" />
            <rect x="88.5" y="14" width="16" height="40" className="s-line" />

            <g className={`c-overlay ${overlays.heat ? 'is-on' : ''}`}>
              {[positions[9], positions[6], positions[8]].map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r={index === 0 ? 16 : 11} fill="url(#config-heat)" />
              ))}
            </g>
            <g className={`c-overlay ${overlays.pressure ? 'is-on' : ''}`}>
              <ellipse cx={opponents[phase === 'press' ? 1 : 5][0]} cy={opponents[phase === 'press' ? 1 : 5][1]} rx="9" ry="7" className="c-pressure" />
              <ellipse cx={opponents[phase === 'press' ? 4 : 8][0]} cy={opponents[phase === 'press' ? 4 : 8][1]} rx="9" ry="7" className="c-pressure" />
            </g>
            <g className={`c-overlay ${overlays.lanes ? 'is-on' : ''}`}>
              {LANES.map(([from, to]) => (
                <line
                  key={`${from}-${to}`}
                  x1={positions[from][0]}
                  y1={positions[from][1]}
                  x2={positions[to][0]}
                  y2={positions[to][1]}
                  className="c-lane"
                  markerEnd="url(#config-arrow)"
                />
              ))}
            </g>

            {opponents.map(([x, y], index) => (
              <circle key={`o-${index}`} r="1.7" className="c-opponent" style={{ transform: `translate(${x}px, ${y}px)` }} />
            ))}
            {positions.map(([x, y], index) => (
              <g key={`p-${index}`} className="c-player" style={{ transform: `translate(${x}px, ${y}px)`, transitionDelay: `${index * 22}ms` }}>
                <circle r="2.4" />
              </g>
            ))}
          </svg>
        </div>

        <div className="matchday-config-panel">
          <fieldset>
            <legend><span>01</span>Formation</legend>
            <div className="matchday-segmented">
              {(Object.keys(FORMATIONS) as Formation[]).map((item) => (
                <button key={item} type="button" aria-pressed={formation === item} className={formation === item ? 'is-active' : ''} onClick={() => setFormation(item)}>{item}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span>Phase</legend>
            <div className="matchday-chips">
              {(Object.keys(PHASES) as PlanPhase[]).map((item) => (
                <button key={item} type="button" aria-pressed={phase === item} className={phase === item ? 'is-active' : ''} onClick={() => setPhase(item)}>{PHASES[item].label}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span>Model overlays</legend>
            <div className="matchday-switches">
              {([['lanes', 'Passing lanes'], ['pressure', 'Pressure zones'], ['heat', 'Heat']] as [Overlay, string][]).map(([key, label]) => (
                <label key={key} className="matchday-switch">
                  <input type="checkbox" checked={overlays[key]} onChange={() => setOverlays((current) => ({ ...current, [key]: !current[key] }))} />
                  <i aria-hidden="true" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="matchday-config-summary" aria-live="polite">
            <span className="matchday-eyebrow">Model focus</span>
            <p>{plan.focus}</p>
            <dl>
              <div><dt>Shape</dt><dd>{formation}</dd></div>
              <div><dt>Phase</dt><dd>{plan.label}</dd></div>
              <div><dt>Overlays</dt><dd>{activeOverlays.length} of 3</dd></div>
            </dl>
          </div>

          <a className="matchday-btn matchday-btn-primary" href="#access">Reserve this setup <ArrowRight size={16} strokeWidth={2.4} /></a>
        </div>
      </div>
    </section>
  )
}
