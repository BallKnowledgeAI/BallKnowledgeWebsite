import Link from 'next/link'
import { Activity, ArrowRight, BrainCircuit, Camera, Crosshair, Gauge, MessageSquareText, ScanLine } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { TacticalPanel } from '@/components/tactical-panel'

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

const workflow = [
  { label: 'Capture', icon: ScanLine, copy: 'Ingest the match and map every relevant movement' },
  { label: 'Decode', icon: BrainCircuit, copy: 'Recognize structure, pressure, and tactical intent' },
  { label: 'Explain', icon: MessageSquareText, copy: 'Translate model output into clear football language' },
  { label: 'Improve', icon: Gauge, copy: 'Feed the insight into review, training, and decisions' },
]

export default function FeaturesPage() {
  return (
    <SiteShell currentPath="/features">
      <section className="product-hero">
        <div>
          <span className="section-kicker">MATCH INTELLIGENCE SYSTEM</span>
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

      <section className="feature-section">
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

      <section className="analysis-section">
        <div className="section-heading">
          <span className="section-kicker">INTERACTIVE MODEL VIEW</span>
          <h2>Read the passing network</h2>
          <p>Select a player node to inspect how the active lanes shift around the possession</p>
        </div>
        <TacticalPanel />
      </section>

      <section className="workflow-section">
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

      <section className="product-cta">
        <div>
          <span className="section-kicker">JOIN THE BUILD</span>
          <h2>Help shape the first tactical model</h2>
        </div>
        <div className="cta-actions">
          <Link className="primary-link" href="/">Join early access <ArrowRight size={17} /></Link>
          <Link className="secondary-link" href="/contact">Talk to the team</Link>
        </div>
      </section>
    </SiteShell>
  )
}
