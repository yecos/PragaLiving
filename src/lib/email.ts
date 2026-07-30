import { Resend } from 'resend'

interface EmailParams {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 * Lead-submitted data (name, message, email) MUST be escaped before
 * being interpolated into HTML — otherwise a malicious lead could
 * execute arbitrary HTML/JS in the recipient's email client.
 */
function escapeHtml(str: string | null | undefined): string {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not configured, skipping email send')
    return { success: false, reason: 'not_configured' }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: 'PRAGA Living <onboarding@resend.dev>', // Change to custom domain in production
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('[Email] Exception:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function isNewLeadEmail(lead: { name: string; phone: string; email: string; interest?: string | null; message?: string | null }) {
  // Escape all user-provided fields to prevent XSS in email clients
  const safeName = escapeHtml(lead.name)
  const safePhone = escapeHtml(lead.phone)
  const safeEmail = escapeHtml(lead.email)
  const safeInterest = escapeHtml(lead.interest)
  const safeMessage = escapeHtml(lead.message)

  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #111111; color: #F5F1EA; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #8B6B4B; letter-spacing: 0.1em; margin: 0;">PRAGA LIVING</h1>
        <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #D8D1C8; margin-top: 8px;">Nuevo Lead</p>
      </div>

      <div style="background: #1A1A1A; border: 1px solid #D8D1C822; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 20px; color: #8B6B4B; margin: 0 0 16px;">Datos del Contacto</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: #D8D1C8; padding: 6px 0; width: 120px;">Nombre:</td><td style="color: #F5F1EA;">${safeName}</td></tr>
          <tr><td style="color: #D8D1C8; padding: 6px 0;">Teléfono:</td><td style="color: #F5F1EA;">${safePhone}</td></tr>
          <tr><td style="color: #D8D1C8; padding: 6px 0;">Email:</td><td style="color: #F5F1EA;">${safeEmail}</td></tr>
          ${safeInterest ? `<tr><td style="color: #D8D1C8; padding: 6px 0;">Interés:</td><td style="color: #8B6B4B; font-weight: 600;">${safeInterest}</td></tr>` : ''}
        </table>
      </div>

      ${safeMessage ? `
      <div style="background: #1A1A1A; border: 1px solid #D8D1C822; padding: 24px; margin-bottom: 24px;">
        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 16px; color: #8B6B4B; margin: 0 0 12px;">Mensaje</h3>
        <p style="font-size: 14px; color: #D8D1C8; line-height: 1.6; margin: 0;">${safeMessage}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_URL || 'https://my-project-psi-sage.vercel.app'}/admin" style="background: #8B6B4B; color: #F5F1EA; padding: 12px 32px; text-decoration: none; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Ver en Admin</a>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #D8D1C822;">
        <p style="font-size: 10px; color: #D8D1C8; letter-spacing: 0.2em;">PRAGA LIVING · Cal. 133 Sur #49-94, Caldas, Antioquia</p>
      </div>
    </div>
  `
}
