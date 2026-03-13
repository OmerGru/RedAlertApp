// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OREF_ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
};

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const response = await fetch(OREF_ALERTS_URL, { headers: HEADERS });
    const rawText = await response.text();

    if (!rawText || rawText.trim() === '') {
      // Clear current alerts if no active ones
      await supabase.from('alerts').delete().neq('id', 'non-existent');
      return new Response(JSON.stringify({ status: 'quiet' }), { headers: { "Content-Type": "application/json" } });
    }

    const cleanData = rawText.replace(/^\uFEFF/, '');
    const alertData = JSON.parse(cleanData);

    // Upsert the alert
    const { error } = await supabase
      .from('alerts')
      .upsert({
        id: alertData.id,
        title: alertData.title,
        areas: alertData.data,
        source_json: alertData,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;

    return new Response(JSON.stringify({ status: 'alert_synced', id: alertData.id }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})
