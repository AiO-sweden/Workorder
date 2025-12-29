// Supabase Edge Function to fetch company data from Allabolag.se
// Replace Firebase Cloud Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orgNr } = await req.json()

    if (!orgNr) {
      return new Response(
        JSON.stringify({ error: 'Organization number is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean the organization number
    const cleanedOrgNr = orgNr.replace(/[\s-]/g, '')

    if (!/^\d{10}$/.test(cleanedOrgNr)) {
      return new Response(
        JSON.stringify({ error: 'Invalid organization number format. Must be 10 digits.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Scrape from Allabolag.se
    const url = `https://www.allabolag.se/${cleanedOrgNr}`
    console.log(`Fetching company data from: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIO-Arbetsorder/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      console.log(`Allabolag.se returned status: ${response.status}`)
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const html = await response.text()

    // Extract JSON data from __NEXT_DATA__ script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/)

    if (!nextDataMatch) {
      console.error('Could not find __NEXT_DATA__ in response')
      return new Response(
        JSON.stringify({ error: 'Could not parse company data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const nextData = JSON.parse(nextDataMatch[1])
    const pageProps = nextData?.props?.pageProps

    if (!pageProps || !pageProps.company) {
      console.error('Company data not found in parsed response')
      return new Response(
        JSON.stringify({ error: 'Company data not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const company = pageProps.company

    // Extract and format the data
    const companyData = {
      name: company.name || '',
      address: company.visitingAddress?.street || '',
      zipCode: company.visitingAddress?.postalCode || '',
      city: company.visitingAddress?.city || '',
      orgNr: cleanedOrgNr,
    }

    console.log('Successfully fetched company data:', companyData.name)

    return new Response(
      JSON.stringify({ data: companyData }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching company data:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
