import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const allowedInterests = new Set(['prototype-testing', 'coach-analyst', 'research-collaboration', 'partnership', 'general'])
const rateLimitWindowMs = 10 * 60 * 1000
const rateLimitMax = 5
const submissions = new Map<string, number[]>()

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] || character)
}

function requestAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(address: string) {
  const now = Date.now()
  const recent = (submissions.get(address) || []).filter((timestamp) => now - timestamp < rateLimitWindowMs)
  if (recent.length >= rateLimitMax) return true
  recent.push(now)
  submissions.set(address, recent)
  return false
}

async function storeMessage(message: { name: string; email: string; interest: string; message: string; source: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const supabase = createClient(url, key)
  const { error } = await supabase.from('contact_messages').insert(message)
  if (error) console.error('Contact message storage failed:', error)
}

async function sendMessage(message: { name: string; email: string; interest: string; message: string }) {
  const user = process.env.GMAIL_SMTP_USER
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD
  const recipient = process.env.EMAIL_REPLY_TO || user

  if (!user || !pass || !recipient) throw new Error('Gmail SMTP is not configured')

  const safeName = escapeHtml(message.name)
  const safeEmail = escapeHtml(message.email)
  const safeInterest = escapeHtml(message.interest)
  const safeMessage = escapeHtml(message.message).replace(/\n/g, '<br/>')

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: `${process.env.EMAIL_FROM_NAME || 'Ball Knowledge'} <${user}>`,
    to: recipient,
    replyTo: message.email,
    subject: `Ball Knowledge contact: ${message.interest}`,
    text: `Name: ${message.name}\nEmail: ${message.email}\nInterest: ${message.interest}\n\n${message.message}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
        <h1 style="color:#1f3c88">New tactical note</h1>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Interest:</strong> ${safeInterest}</p>
        <div style="padding:16px;border-left:3px solid #2ecc71;background:#f1f5f9">${safeMessage}</div>
      </div>
    `,
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = clean(body?.name)
  const email = clean(body?.email).toLowerCase()
  const interest = clean(body?.interest)
  const message = clean(body?.message)
  const website = clean(body?.website)
  const source = clean(body?.source) || 'ballknowledge-contact-page'

  if (website) return NextResponse.json({ message: 'Goal  Message received' })
  if (isRateLimited(requestAddress(request))) {
    return NextResponse.json({ error: 'Full-time whistle  Try again in a few minutes' }, { status: 429 })
  }
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'Offside  Enter a name between 2 and 80 characters' }, { status: 400 })
  }
  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'Offside  Enter a valid email address' }, { status: 400 })
  }
  if (!allowedInterests.has(interest)) {
    return NextResponse.json({ error: 'Foul  Select a valid interest' }, { status: 400 })
  }
  if (message.length < 10 || message.length > 1000) {
    return NextResponse.json({ error: 'Foul  Keep the message between 10 and 1000 characters' }, { status: 400 })
  }

  try {
    await sendMessage({ name, email, interest, message })
    await storeMessage({ name, email, interest, message, source })
    return NextResponse.json({ message: 'Goal  Message received  We will be in touch' })
  } catch (error) {
    console.error('Contact message failed:', error)
    const mailError = error as { code?: string; responseCode?: number }
    if (mailError.code === 'EAUTH' || mailError.responseCode === 535) {
      return NextResponse.json(
        { error: 'Email line is temporarily unavailable  Please email ballknowledge.ai@gmail.com directly' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: 'The pass was blocked  Please try again shortly' }, { status: 500 })
  }
}
