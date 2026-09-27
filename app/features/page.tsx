'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, BrainCircuit, Camera, Crosshair, Gauge, MessageSquareText, ScanLine } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { TacticalPanel } from '@/components/tactical-panel'

type PhaseKey = 'buildup' | 'press' | 'final'

const PHASES: Record<PhaseKey, { label: string; focus: string; threat: string; pressure: string; window: string }> = {
  buildup: {
    label: 'Build-up',
    focus: 'Split the centre-backs and draw the first press line before playing through midfield',
    threat: 'Low',
    pressure: '2 defenders engaged',
    window: '3.2s to decide',
  },
  press: {
    label: 'High press',
    focus: "Trigger the jump on the fullback's first touch; screen the passing lane to the six",
    threat: 'Medium',
    pressure: '4 defenders engaged',
    window: '1.1s to decide',
  },
  final: {
    label: 'Final third',
    focus: 'Overload the half-space; a near-post run pins the block and opens the cutback',
    threat: 'High',
    pressure: '5 defenders engaged',
    window: '0.8s to decide',
  },
}

const features = [
  {
    icon: Camera,
    label: 'Computer Vision Pipeline',
    copy: 'Track player positions, passing lanes, and team shape from the match feed',
    metric: '22-player context',
  },
  {
    icon: Activity,
    label: 'Real-Time Tactical Analysis',
    copy: 'Surface pressure, overloads, and dangerous transitions while the phase develops',
    metric: 'Live phase detection',
  },
  {
    icon: MessageSquareText,
    label: 'LLM Match Summaries',
    copy: 'Turn complex sequences into concise tactical explanations for humans',
    metric: 'Analyst-ready notes',
  },
  {
    icon: Crosshair,
    label: 'Decision Window Detection',
    copy: 'Identify the moments where one pass, press, or run changes the entire possession',
    metric: 'High-impact moments',
  },
]

const stats = [
  { value: '22', label: 'Players tracked live' },
  { value: '<80ms', label: 'Inference latency' },
  { value: '97%', label: 'Recognition accuracy' },
  { value: '24/7', label: 'Live tactical feed' },
]

const workflow = [
  { label: 'Capture', icon: ScanLine, copy: 'Ingest the match and map every relevant movement' },
  { label: 'Decode', icon: BrainCircuit, copy: 'Recognize structure, pressure, and tactical intent' },
  { label: 'Explain', icon: MessageSquareText, copy: 'Translate model output into clear football language' },
  { label: 'Improve', icon: Gauge, copy: 'Feed the insight into review, training, and decisions' },
]

export default function FeaturesPage() {
  const [phase, setPhase] = useState<PhaseKey>('press')
  const current = PHASES[phase]

  return (
    <SiteShell currentPath="/features">
      <section className="product-hero">
        <div>
          <span className="section-kicker kicker-live">MATCH INTELLIGENCE SYSTEM</span>
          <h1>Tactical Intelligence, <em>Live</em></h1>
          <p>Ball Knowledge converts the flow of a football match into structured explainable tactical insight</p>
          <div className="hero-tags" aria-label="System capabilities">
            <span>Vision tracking</span>
            <span>Live inference</span>
            <span>Explainable output</span>
          </div>
        </div>
        <div className="hero-signal" aria-hidden="true">
          <div className="signal-topline"><span>PHASE 07</span><b>LIVE</b></div>
          <strong>Midfield overload</strong>
          <div className="signal-visual">
            <span className="signal-ring" />
            <span className="signal-dot dot-a" />
            <span className="signal-dot dot-b" />
            <span className="signal-dot dot-c" />
            <span className="signal-route" />
          </div>
          <div className="signal-bars"><i /><i /><i /><i /></div>
        </div>
      </section>

      <div className="spec-strip spec-strip--wide reveal" aria-label="System performance">
        {stats.map((stat) => (
          <div className="spec-tile" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="feature-section reveal">
        <div className="section-heading">
          <span className="section-kicker">CORE PIPELINE</span>
          <h2>From movement to meaning</h2>
          <p>A compact stack designed for repeated match analysis and deeper football understanding</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article className="feature-item" key={feature.label}>
                <span className="feature-scanline" aria-hidden="true" />
                <div className="feature-icon"><Icon size={19} /></div>
                <span>{feature.metric}</span>
                <h3>{feature.label}</h3>
                <p>{feature.copy}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="analysis-section reveal">
        <div className="section-heading">
          <span className="section-kicker kicker-live">INTERACTIVE MODEL VIEW</span>
          <h2>Read the passing network</h2>
          <p>Select a player node, then change the match phase below — the model's focus, threat read, and decision window all update live</p>
        </div>

        <div className="analysis-grid">
          <TacticalPanel />

          <div className="matchday-config-panel">
            <fieldset>
              <legend><span>01</span>Match phase</legend>
              <div className="matchday-segmented">
                {(Object.keys(PHASES) as PhaseKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={phase === key}
                    className={phase === key ? 'is-active' : ''}
                    onClick={() => setPhase(key)}
                  >
                    {PHASES[key].label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="matchday-config-summary" aria-live="polite">
              <span className="matchday-eyebrow">Model focus</span>
              <p>{current.focus}</p>
              <dl>
                <div><dt>Threat</dt><dd>{current.threat}</dd></div>
                <div><dt>Pressure</dt><dd>{current.pressure}</dd></div>
                <div><dt>Window</dt><dd>{current.window}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section reveal">
        <div className="section-heading">
          <span className="section-kicker">WORKFLOW</span>
          <h2>Capture Decode Explain Improve</h2>
        </div>
        <div className="workflow-track">
          {workflow.map((step, index) => {
            const Icon = step.icon
            return (
              <article key={step.label}>
                <span className="workflow-index">0{index + 1}</span>
                <span className="workflow-node" aria-hidden="true" />
                <Icon size={18} />
                <h3>{step.label}</h3>
                <p>{step.copy}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="product-cta reveal">
        <div>
          <span className="section-kicker">JOIN THE BUILD</span>
          <h2>Help shape the first tactical model</h2>
        </div>
        <div className="cta-actions">
          <Link className="matchday-btn matchday-btn-primary" href="/#access">Join early access <ArrowRight size={17} /></Link>
          <Link className="matchday-btn matchday-btn-ghost" href="/contact">Talk to the team</Link>
        </div>
      </section>
    </SiteShell>
  )
}
