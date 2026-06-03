import { createClient } from '@supabase/supabase-js'
import { resolveMx } from 'dns/promises'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const emailFromName = process.env.EMAIL_FROM_NAME || 'Ball Knowledge'
const emailReplyTo = process.env.EMAIL_REPLY_TO

const confirmationSubject = 'Welcome to Ball Knowledge Prototype Testing'
type EmailResult =
  | { sent: true; provider: string; id?: string }
  | { sent: false; provider?: string; reason: string }

const confirmationText = () => `Match confirmed!

Welcome to Ball Knowledge prototype testing.

You’re officially on the early access list. We’ll send prototype updates, testing invites, and launch details to this inbox.

Cheers,
The Ball Knowledge Team`

const confirmationHtml = () => `<!DOCTYPE html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; background: #020617;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #071127; border: 1px solid #0f766e; border-radius: 18px;">
      <h1 style="color: #0f766e; margin-bottom: 12px;">Welcome to prototype testing!</h1>
      <p style="color: #d1d5db; font-size: 16px;">You’re officially on the Ball Knowledge early access list.</p>
      <p style="color: #d1d5db; font-size: 16px;">We’ll send prototype updates, testing invites, and launch details to this inbox.</p>
      <div style="margin-top: 22px; padding: 16px; border-radius: 14px; background: rgba(15, 118, 110, 0.12);">
        <p style="margin: 0; color: #a7f3d0; font-weight: 700;">You’re in.</p>
        <p style="margin: 8px 0 0 0; color: #e0f2fe;">Thanks for helping shape the first Ball Knowledge prototype.</p>
      </div>
      <p style="margin-top: 24px; color: #d1d5db;">See you on the field,<br/>The Ball Knowledge Team</p>
    </div>
  </body>
</html>`

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function canReceiveEmail(email: string) {
  const domain = email.split('@')[1]
  if (!domain) return false

  try {
    const records = await resolveMx(domain)
    return records.length > 0
  } catch {
    return false
  }
}

function readableEmailError(reason?: string) {
  if (!reason) return 'Email provider rejected the message.'

  const jsonStart = reason.indexOf('{')
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(reason.slice(jsonStart))
      if (typeof parsed?.message === 'string') return parsed.message
    } catch {
      // Fall back to the raw provider error below.
    }
  }

  return reason
}

async function sendWithGmailSmtp(recipientEmail: string): Promise<EmailResult> {
  const user = process.env.GMAIL_SMTP_USER
  const pass = process.env.GMAIL_SMTP_APP_PASSWORD

  if (!user || !pass) {
    return { sent: false, provider: 'gmail-smtp', reason: 'Gmail SMTP is not configured.' }
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  })

  const info = await transporter.sendMail({
    from: `${emailFromName} <${user}>`,
    to: recipientEmail,
    replyTo: emailReplyTo || user,
    subject: confirmationSubject,
    text: confirmationText(),
    html: confirmationHtml(),
  })

  return { sent: true, provider: 'gmail-smtp', id: info.messageId }
}

async function sendConfirmationEmail(recipientEmail: string): Promise<EmailResult> {
  return await sendWithGmailSmtp(recipientEmail)
}

async function logEmailSend(recipientEmail: string, status: string, provider?: string, reason?: string) {
  if (!supabase) return

  try {
    await supabase.rpc('log_email_sent', {
      p_recipient_email: recipientEmail,
      p_subject: confirmationSubject,
      p_template_name: 'waitlist-confirmation',
      p_status: status,
      p_metadata: provider || reason ? { provider, reason } : null,
    })
  } catch (error) {
    console.error('Failed to log email send:', error)
  }
}

async function sendAndLogConfirmation(email: string) {
  const emailResult = await sendConfirmationEmail(email)
  if (emailResult.sent) {
    await logEmailSend(email, 'sent', emailResult.provider, emailResult.id)
  } else {
    console.error('Confirmation email failed:', readableEmailError(emailResult.reason))
    await logEmailSend(email, 'failed', emailResult.provider, emailResult.reason)
  }

  return emailResult
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  const source = typeof body?.source === 'string' ? body.source : 'ballknowledge-coming-soon'

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Foul! That email is missing an @.' }, { status: 400 })
  }

  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'Offside! Enter a valid email address.' }, { status: 400 })
  }

  if (!(await canReceiveEmail(email))) {
    return NextResponse.json({ error: 'Offside! That email domain can’t receive mail.' }, { status: 400 })
  }

  const { data: existing, error: selectError } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (selectError) {
    console.error('Waitlist lookup error:', selectError)
    return NextResponse.json({ error: 'Unable to check the roster right now.' }, { status: 500 })
  }

  if (existing) {
    await logEmailSend(email, 'skipped', undefined, 'duplicate email')
    return NextResponse.json({ error: 'Foul! That email is already on the roster.' }, { status: 409 })
  }

  const { error } = await supabase.from('waitlist').insert({ email, source })

  if (error) {
    if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
      await logEmailSend(email, 'skipped', undefined, 'duplicate email')
      return NextResponse.json({ error: 'Foul! That email is already on the roster.' }, { status: 409 })
    }

    console.error('Waitlist insert error:', error)
    return NextResponse.json({ error: 'Unable to add your email right now.' }, { status: 500 })
  }

  const emailResult = await sendAndLogConfirmation(email)
  if (emailResult.sent) {
    return NextResponse.json({
      message: 'Goal! You’re on the squad. Check your inbox.',
      emailSent: true,
      provider: emailResult.provider,
      resendId: emailResult.id,
    })
  }

  return NextResponse.json(
    {
      error: `VAR check failed: ${readableEmailError(emailResult.reason)}`,
      emailSent: false,
    },
    { status: 500 },
  )
}
