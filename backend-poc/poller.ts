import axios from 'axios';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());

// Supabase Configuration
const SUPABASE_URL = "https://jsjuomajgrqzmoaaurmj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzanVvbWFqZ3Jxem1vYWF1cm1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQyMTI3MCwiZXhwIjoyMDg4OTk3MjcwfQ.WTjXR9cwq0mipwjWpqtjjyJdZuz2RZ-jrXDM5s8CIko";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OREF_ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
};

const ALERT_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface AlertResponse {
  id: string;
  cat?: string;
  title?: string;
  data: string[];
  desc?: string;
}

export interface AlertHistoryEntry {
  id: string;
  title: string;
  areas: string[];
  timestamp: number;
}

const MAX_HISTORY = 50;
let lastAlertId = '';
let currentAlerts: string[] = [];
let alertActive = false;
let alertTitle = 'Quiet';
const history: AlertHistoryEntry[] = [];

function addToHistory(entry: AlertHistoryEntry) {
  if (history.some((h) => h.id === entry.id)) return;
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
}

app.get('/api/alerts', (req, res) => {
  res.json({
    active: alertActive,
    title: alertTitle,
    areas: currentAlerts,
    timestamp: Date.now(),
  });
});

app.get('/api/alerts/history', (req, res) => {
  res.json(history);
});

const POLLING_INTERVAL_MS = 2000;
const PORT = process.env.PORT || 3000;

let quietCount = 0;

async function syncToSupabase(alertData: AlertResponse | null) {
  try {
    // 1. Clean up alerts older than 10 minutes
    const cutoff = new Date(Date.now() - ALERT_TTL_MS).toISOString();
    await supabase.from('alerts').delete().lt('timestamp', cutoff);

    if (!alertData) return;

    // 2. Upsert into alerts table
    const { error: alertError } = await supabase
      .from('alerts')
      .upsert({
        id: alertData.id,
        title: alertData.title,
        areas: alertData.data,
        source_json: alertData,
        timestamp: new Date().toISOString()
      });

    if (alertError) console.error('Supabase alert sync error:', alertError.message);

    // 3. Insert into alert_history
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

      if (historyError) console.error('Supabase history sync error:', historyError.message);
    }
  } catch (err: any) {
    console.error('Supabase sync exception:', err?.message || err);
  }
}

async function fetchAlerts() {
  try {
    const response = await axios.get<AlertResponse>(OREF_ALERTS_URL, {
      headers: HEADERS,
      timeout: 5000,
      transformResponse: [(data) => data],
    });

    const rawData = response.data as unknown as string;

    if (rawData && rawData.trim() !== '') {
      const cleanData = rawData.replace(/^\uFEFF/, '');
      let alertData: AlertResponse;
      try {
        alertData = JSON.parse(cleanData);
      } catch (e: any) {
        console.error(`\n[${new Date().toISOString()}] ⚠️ Failed to parse Oref JSON:`, e.message);
        return;
      }

      // Sync to Supabase
      await syncToSupabase(alertData);

      if (alertData.id !== lastAlertId) {
        lastAlertId = alertData.id;
        currentAlerts = alertData.data;
        alertActive = true;
        alertTitle = alertData.title || 'Missile Alert';
        quietCount = 0;

        const entry: AlertHistoryEntry = {
          id: alertData.id,
          title: alertTitle,
          areas: currentAlerts,
          timestamp: Date.now(),
        };
        addToHistory(entry);

        console.log(`\n🚨 [ALERT DETECTED - ${new Date().toISOString()}]`);
        console.log(`Title: ${alertTitle}`);
        console.log(`Areas: \n - ${currentAlerts.join('\n - ')}`);
        console.log('--------------------------------------------------');
      }
    } else {
      // Still sync to handle TTL cleanup even when quiet
      await syncToSupabase(null);

      if (alertActive) {
        console.log(`\n🟢 [ALL CLEAR - ${new Date().toISOString()}]`);
      }
      alertActive = false;
      currentAlerts = [];
      alertTitle = 'Quiet';
      
      quietCount++;
      if (quietCount % 15 === 0) {
          process.stdout.write('.');
      }
    }
  } catch (error: any) {
    const time = new Date().toISOString();
    if (error.code === 'ECONNABORTED') {
        console.error(`\n[${time}] ⏱️  Oref Timeout`);
    } else {
        console.error(`\n[${time}] ❌ [Error fetching alerts]:`, error.message);
    }
  }
}

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🛡️  Oref API Poller & Express Server Running on port ${PORT}`);
  console.log(`⏱️  Polling Oref every ${POLLING_INTERVAL_MS / 1000} seconds...`);
  console.log(`⚡ Supabase Sync Enabled: ${SUPABASE_URL}`);
  console.log('==================================================');

  setInterval(fetchAlerts, POLLING_INTERVAL_MS);
  fetchAlerts();
});

