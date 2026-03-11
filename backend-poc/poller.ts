import axios from 'axios';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// The unofficial but widely used Oref real-time alert endpoint.
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

let lastAlertId = '';
let currentAlerts: string[] = [];
let alertActive = false;
let alertTitle = 'Quiet';

async function fetchAlerts() {
  try {
    const response = await axios.get<AlertResponse>(OREF_ALERTS_URL, {
      headers: HEADERS,
      transformResponse: [(data) => data],
    });

    const rawData = response.data as unknown as string;
    
    if (rawData && rawData.trim() !== '') {
      const cleanData = rawData.replace(/^\uFEFF/, '');
      const alertData: AlertResponse = JSON.parse(cleanData);

      if (alertData.id !== lastAlertId) {
        lastAlertId = alertData.id;
        currentAlerts = alertData.data;
        alertActive = true;
        alertTitle = alertData.title || 'Missile Alert';
        
        console.log(`\n🚨 [ALERT DETECTED - ${new Date().toISOString()}]`);
        console.log(`Title: ${alertTitle}`);
        console.log(`Areas: \n - ${currentAlerts.join('\n - ')}`);
        console.log('--------------------------------------------------');
      }
    } else {
      // If we got an empty response, the alert is over
      if (alertActive) {
         console.log(`\n🟢 [ALL CLEAR - ${new Date().toISOString()}]`);
      }
      alertActive = false;
      currentAlerts = [];
      alertTitle = 'Quiet';
      process.stdout.write('.');
    }
  } catch (error: any) {
    console.error('\n❌ [Error fetching alerts]:', error.message);
  }
}

// Endpoint for the React Native app to get current alert status
app.get('/api/alerts', (req, res) => {
  res.json({
      active: alertActive,
      title: alertTitle,
      areas: currentAlerts,
      timestamp: new Date().toISOString()
  });
});

const POLLING_INTERVAL_MS = 2000;
const PORT = 3000;

app.listen(PORT, () => {
    console.log('==================================================');
    console.log(`🛡️  Oref API Poller & Express Server Running on port ${PORT}`);
    console.log(`⏱️  Polling Oref every ${POLLING_INTERVAL_MS / 1000} seconds...`);
    console.log('==================================================');
    
    setInterval(fetchAlerts, POLLING_INTERVAL_MS);
    fetchAlerts();
});

