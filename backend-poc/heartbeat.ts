/**
 * Persistent Heartbeat Script
 * Runs every 2 seconds to trigger the Supabase Edge Function.
 * Use this for high-resolution polling.
 */

const FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!FUNCTION_URL || !ANON_KEY) {
  console.error("❌ Missing SUPABASE_FUNCTION_URL or SUPABASE_ANON_KEY environment variables.");
  process.exit(1);
}

async function poke() {
  try {
    const start = Date.now();
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Heartbeat sent. Status: ${res.status} (${duration}ms)`);
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] Heartbeat failed:`, err?.message || err);
  }
}

console.log("🚀 Starting Heartbeat (2s interval)...");
setInterval(poke, 2000);
poke();
