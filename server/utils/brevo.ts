// Minimal Brevo (transactional email) client. BREVO_API_KEY is injected
// directly into the ECS task's environment as a resolved value (see
// infra/staging/compute.tf's `secrets` map) — not an ARN to fetch at
// runtime, unlike the Lambda-side pattern in lambda/src/shared/secrets.js.
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured on this environment')
  }

  const sender = process.env.BREVO_SENDER_EMAIL || 'no-reply@energystacks.ai'

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      sender: { email: sender, name: 'Energystacks' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Brevo send failed: ${res.status} ${body}`)
  }
}
