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

const ALERT_TTL_MS = 10 * 60 * 1000; // 10 minutes

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Clean up alerts older than 10 minutes
    const cutoff = new Date(Date.now() - ALERT_TTL_MS).toISOString();
    await supabase.from('alerts').delete().lt('timestamp', cutoff);

    // 2. Fetch from Oref
    const response = await fetch(OREF_ALERTS_URL, { headers: HEADERS });
    const rawText = await response.text();

    if (!rawText || rawText.trim() === '') {
      // No active alert — just return quiet (old alerts will expire via TTL above)
      return new Response(JSON.stringify({ status: 'quiet' }), { headers: { "Content-Type": "application/json" } });
    }

    const cleanData = rawText.replace(/^\uFEFF/, '');
    const alertData = JSON.parse(cleanData);

    // 3. Upsert into alerts table (stays for 10 minutes)
    const { error: alertError } = await supabase
      .from('alerts')
      .upsert({
        id: alertData.id,
        title: alertData.title,
        areas: alertData.data,
        source_json: alertData,
        timestamp: new Date().toISOString()
      });

    if (alertError) throw alertError;

    // 4. Insert into alert_history (permanent record, deduplicated by oref_id)
    const { data: existing } = await supabase
      .from('alert_history')
      .select('id')
      .eq('oref_id', alertData.id)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error: historyError } = await supabase
        .from('alert_history')
        .insert({
          oref_id: alertData.id,
          title: alertData.title,
          areas: alertData.data,
          timestamp: new Date().toISOString()
        });

      if (historyError) {
        console.error('History insert error:', historyError.message);
      }
    }

    return new Response(JSON.stringify({ status: 'alert_synced', id: alertData.id }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
})
