'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Instagram, Linkedin, Mail, Send, ShieldCheck, Twitter } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'

const interests = [
  { value: '', label: 'Select your role or interest' },
  { value: 'prototype-testing', label: 'Prototype testing' },
  { value: 'coach-analyst', label: 'Coach or analyst' },
  { value: 'research-collaboration', label: 'Research collaboration' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'general', label: 'General question' },
]

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/ballknowledge-ai/', icon: Linkedin },
  { label: 'X', href: 'https://x.com/AIBallKnowledge', icon: Twitter },
  { label: 'Instagram', href: 'https://www.instagram.com/ballknowledge.ai?igsh=b2V0ZHZuMXFmNXlw', icon: Instagram },
]

type FormState = {
  name: string
  email: string
  interest: string
  message: string
  website: string
}

const initialForm: FormState = { name: '', email: '', interest: '', message: '', website: '' }

export default function ContactPage() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (status !== 'submitting') {
      setStatus('idle')
      setFeedback('')
    }
  }

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setFeedback('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'ballknowledge-contact-page' }),
      })
      const result = await response.json()

      if (!response.ok) {
        setStatus('error')
        setFeedback(result?.error || 'VAR check failed  Try again')
        return
      }

      setStatus('success')
      setFeedback(result?.message || 'Goal  Message received')
      setForm(initialForm)
    } catch {
      setStatus('error')
      setFeedback('VAR check failed  Try again')
    }
  }

  return (
    <SiteShell currentPath="/contact">
      <section className="contact-layout">
        <div className="contact-intro">
          <span className="section-kicker">OPEN CHANNEL</span>
          <h1>Talk Tactics <em>With Us</em></h1>
          <p>For prototype testers coaches analysts researchers and collaborators who want to help decode the game</p>

          <div className="contact-formation" aria-hidden="true">
            <span className="formation-line line-one" />
            <span className="formation-line line-two" />
            <i className="formation-player fp-one" />
            <i className="formation-player fp-two" />
            <i className="formation-player fp-three" />
            <i className="formation-player fp-four" />
            <strong>CHANNEL READY</strong>
          </div>

          <div className="contact-channel">
            <Mail size={19} />
            <div>
              <span>Direct email</span>
              <a href="mailto:ballknowledge.ai@gmail.com">ballknowledge.ai@gmail.com</a>
            </div>
            <ArrowUpRight size={18} />
          </div>

          <div className="contact-trust">
            <div><ShieldCheck size={18} /><span>Sent directly to the Ball Knowledge team</span></div>
            <div><CheckCircle2 size={18} /><span>Replies within two working days</span></div>
          </div>

          <div className="contact-links">
            <Link className="secondary-link contact-feature-link" href="/features">Explore the product system <ArrowUpRight size={16} /></Link>
            <div className="contact-socials" aria-label="Ball Knowledge social links">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={submitContact} noValidate>
          <span className="form-corner corner-one" aria-hidden="true" />
          <span className="form-corner corner-two" aria-hidden="true" />
          <div className="form-heading">
            <span><i /> CONTACT FORM</span>
            <strong>Send a tactical note</strong>
          </div>

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              minLength={2}
              maxLength={80}
              autoComplete="name"
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Interest
            <select name="interest" value={form.interest} onChange={(event) => updateField('interest', event.target.value)} required>
              {interests.map((interest) => <option key={interest.value} value={interest.value}>{interest.label}</option>)}
            </select>
          </label>

          <label>
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={(event) => updateField('message', event.target.value)}
              minLength={10}
              maxLength={1000}
              rows={7}
              required
            />
            <span className="field-counter">{form.message.length}/1000</span>
          </label>

          <label className="honeypot" aria-hidden="true">
            Website
            <input name="website" value={form.website} onChange={(event) => updateField('website', event.target.value)} tabIndex={-1} autoComplete="off" />
          </label>

          <button className="contact-submit" type="submit" disabled={status === 'submitting'}>
            <Send size={17} />
            {status === 'submitting' ? 'Sending' : 'Send message'}
          </button>

          {feedback && (
            <div className={`contact-feedback ${status}`} role="status">
              {feedback}
            </div>
          )}
        </form>
      </section>
    </SiteShell>
  )
}
