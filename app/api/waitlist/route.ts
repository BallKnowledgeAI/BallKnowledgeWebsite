import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const emailFrom = process.env.EMAIL_FROM || (supabaseUrl ? `no-reply@${new URL(supabaseUrl).hostname}` : 'no-reply@example.com')
const emailFromName = process.env.EMAIL_FROM_NAME || 'Ball Knowledge'

const confirmationSubject = 'Welcome to the Ball Knowledge squad'

const confirmationText = () => `Match confirmed!

You’re officially on the Ball Knowledge prototype testers squad. Expect kickoff details and early access updates soon.

Stay tuned for tactical plays, training invites, and prototype previews.

Cheers,
The Ball Knowledge Team`

const confirmationHtml = () => `<!DOCTYPE html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; background: #020617;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px; background: #071127; border: 1px solid #0f766e; border-radius: 18px;">
      <h1 style="color: #0f766e; margin-bottom: 12px;">Match confirmed!</h1>
      <p style="color: #d1d5db; font-size: 16px;">You’re officially on the Ball Knowledge prototype testers squad.</p>
      <p style="color: #d1d5db; font-size: 16px;">Watch for kickoff details, tactical updates, and early access invites coming soon.</p>
      <div style="margin-top: 22px; padding: 16px; border-radius: 14px; background: rgba(15, 118, 110, 0.12);">
        <p style="margin: 0; color: #a7f3d0; font-weight: 700;">Team update:</p>
        <p style="margin: 8px 0 0 0; color: #e0f2fe;">Your spot on the roster is locked in. We’ll send the next play straight to your inbox.</p>
      </div>
      <p style="margin-top: 24px; color: #d1d5db;">See you on the field,<br/>The Ball Knowledge Team</p>
    </div>
  </body>
</html>`

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sendWithSendGrid(recipientEmail: string) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { sent: false, reason: 'SendGrid is not configured.' }

  const payload = {
    personalizations: [
      {
        to: [{ email: recipientEmail }],
        subject: confirmationSubject,
      },
    ],
    from: {
      email: emailFrom,
      name: emailFromName,
    },
    content: [
      { type: 'text/plain', value: confirmationText(recipientEmail) },
      { type: 'text/html', value: confirmationHtml(recipientEmail) },
    ],
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: `SendGrid error ${response.status}: ${body}` }
  }

  return { sent: true }
}

async function sendWithPostmark(recipientEmail: string) {
  const serverToken = process.env.POSTMARK_SERVER_TOKEN
  if (!serverToken) return { sent: false, reason: 'Postmark is not configured.' }

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Postmark-Server-Token': serverToken,
    },
    body: JSON.stringify({
      From: `${emailFromName} <${emailFrom}>`,
      To: recipientEmail,
      Subject: confirmationSubject,
      TextBody: confirmationText(recipientEmail),
      HtmlBody: confirmationHtml(recipientEmail),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, reason: `Postmark error ${response.status}: ${body}` }
  }

  return { sent: true }
}

async function sendWithMailgun(recipientEmail: string) {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  if (!apiKey || !domain) return { sent: false, reason: 'Mailgun is not configured.' }

  const body = new URLSearchParams()
  body.append('from', `${emailFromName} <${emailFrom}>`)
  body.append('to', recipientEmail)
  body.append('subject', confirmationSubject)
  body.append('text', confirmationText(recipientEmail))
  body.append('html', confirmationHtml(recipientEmail))

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const bodyText = await response.text()
    return { sent: false, reason: `Mailgun error ${response.status}: ${bodyText}` }
  }

  return { sent: true }
}

async function sendConfirmationEmail(recipientEmail: string) {
  if (process.env.SENDGRID_API_KEY) {
    return await sendWithSendGrid(recipientEmail)
  }

  if (process.env.POSTMARK_SERVER_TOKEN) {
    return await sendWithPostmark(recipientEmail)
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return await sendWithMailgun(recipientEmail)
  }

  return { sent: false, reason: 'No email provider configured.' }
}

async function logEmailSend(recipientEmail: string, status: string, reason?: string) {
  if (!supabase) return

  try {
    await supabase.rpc('log_email_sent', {
      p_recipient_email: recipientEmail,
      p_subject: confirmationSubject,
      p_template_name: 'waitlist-confirmation',
      p_status: status,
      p_metadata: reason ? { provider: 'confirmation', reason } : null,
    })
  } catch (error) {
    console.error('Failed to log email send:', error)
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''
  const source = typeof body?.source === 'string' ? body.source : 'ballknowledge-coming-soon'

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Foul! That email is missing an @ — the play is not valid.' }, { status: 400 })
  }

  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'Offside! That email is not a legal pass — enter a valid address.' }, { status: 400 })
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
    await logEmailSend(email, 'skipped', 'duplicate email')
    return NextResponse.json({ error: 'Foul! That email is already on the roster.' }, { status: 409 })
  }

  const { error } = await supabase.from('waitlist').insert({ email, source })

  if (error) {
    if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate')) {
      await logEmailSend(email, 'skipped', 'duplicate email')
      return NextResponse.json({ error: 'Foul! That email is already on the roster.' }, { status: 409 })
    }

    console.error('Waitlist insert error:', error)
    return NextResponse.json({ error: 'Unable to add your email right now.' }, { status: 500 })
  }

  const emailResult = await sendConfirmationEmail(email)
  if (emailResult.sent) {
    await logEmailSend(email, 'sent')
  } else {
    await logEmailSend(email, 'failed', emailResult.reason)
  }

  return NextResponse.json({ message: 'You’re on the prototype testers roster. Check your inbox for kickoff details.' })
}
