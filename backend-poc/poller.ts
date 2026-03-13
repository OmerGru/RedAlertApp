import axios from 'axios';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const OREF_ALERTS_URL = 'https://www.oref.org.il/WarningMessages/alert/alerts.json';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
};

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
      if (alertActive) {
        console.log(`\n🟢 [ALL CLEAR - ${new Date().toISOString()}]`);
      }
      alertActive = false;
      currentAlerts = [];
      alertTitle = 'Quiet';
      
      quietCount++;
      if (quietCount % 15 === 0) { // Log a dot every 15 checks (~30s)
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
  console.log('==================================================');

  setInterval(fetchAlerts, POLLING_INTERVAL_MS);
  fetchAlerts();
});
