// Edge Function to send email notification when new account is created
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'info@allinonesweden.se'

serve(async (req) => {
  try {
    const { record } = await req.json()

    // Get organization details
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user who created this organization
    const { data: users, error: userError } = await supabaseClient
      .from('schedulable_users')
      .select('*')
      .eq('organization_id', record.id)
      .eq('role', 'admin')
      .limit(1)

    if (userError) {
      console.error('Error fetching user:', userError)
      throw userError
    }

    const user = users?.[0]

    // Prepare email content
    const emailSubject = record.wants_to_pay
      ? '🚀 Nytt konto skapat - VILL BÖRJA BETALA!'
      : '📝 Nytt konto skapat'

    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-left: 10px; }
            .highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
            .payment-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .trial-badge { background: #6c757d; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Nytt konto skapat i AIO Arbetsorder!</h1>
            </div>
            <div class="content">
              ${record.wants_to_pay ? `
                <div class="highlight">
                  <span class="payment-badge">💳 VILL BÖRJA BETALA DIREKT</span>
                  <p><strong>Denna kund vill börja med en betald plan!</strong> Kontakta dem så snart som möjligt med betalningsinformation.</p>
                </div>
              ` : `
                <div class="highlight">
                  <span class="trial-badge">🆓 Provperiod</span>
                  <p>Kunden startar med 30 dagars gratis provperiod.</p>
                </div>
              `}

              <h2>📋 Kontoinformation</h2>

              <div class="info-row">
                <span class="label">Företagsnamn:</span>
                <span class="value">${record.company_name || '-'}</span>
              </div>

              <div class="info-row">
                <span class="label">Kontaktperson:</span>
                <span class="value">${user?.name || '-'}</span>
              </div>

              <div class="info-row">
                <span class="label">E-post:</span>
                <span class="value">${user?.email || '-'}</span>
              </div>

              <div class="info-row">
                <span class="label">Telefon:</span>
                <span class="value">${record.phone || '-'}</span>
              </div>

              <div class="info-row">
                <span class="label">Organisationsnummer:</span>
                <span class="value">${record.org_nr || 'Ej angivet'}</span>
              </div>

              <div class="info-row">
                <span class="label">Adress:</span>
                <span class="value">${record.address || 'Ej angivet'}</span>
              </div>

              <div class="info-row">
                <span class="label">Skapad:</span>
                <span class="value">${new Date(record.created_at).toLocaleString('sv-SE')}</span>
              </div>

              <h2>🎯 Nästa steg</h2>
              <ul>
                ${record.wants_to_pay ? `
                  <li><strong>Kontakta kunden inom 24 timmar</strong></li>
                  <li>Skicka betalningsinformation och faktura</li>
                  <li>Hjälp dem välja rätt plan (Starter, Professional eller Enterprise)</li>
                ` : `
                  <li>Kunden har 30 dagar gratis provperiod</li>
                  <li>Följ upp efter 1 vecka för att se hur det går</li>
                  <li>Påminn om provperiodens slut 5 dagar innan</li>
                `}
                <li>Se till att kunden har tillgång till supporten</li>
                <li>Lägg till i CRM/faktureringssystem</li>
              </ul>

              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
                Detta är en automatisk notifikation från AIO Arbetsorder systemet.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AIO Arbetsorder <noreply@allinonesweden.se>',
        to: [ADMIN_EMAIL],
        subject: emailSubject,
        html: emailBody,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Error sending email:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const data = await res.json()
    console.log('Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in notify-new-signup function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
