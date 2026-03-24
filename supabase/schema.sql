-- Create the alerts table to store Oref warnings
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY, -- Oref alert ID
    title TEXT NOT NULL,
    areas TEXT[] NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source_json JSONB
);

-- Enable Realtime for this table
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
-- Note: You need to manually enable Realtime in the Supabase Dashboard for the 'alerts' table
-- by going to Database > Replication > Enable Realtime for the 'alerts' table.

-- Create a history table for older alerts (optional but good for efficiency)
CREATE TABLE IF NOT EXISTS public.alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oref_id TEXT,
    title TEXT,
    areas TEXT[],
    timestamp TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Anonymous)
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Public read alert_history" ON public.alert_history FOR SELECT USING (true);

-- Create history aggregation view
CREATE OR REPLACE VIEW hourly_alert_stats AS
WITH filtered_alerts AS (
  SELECT *
  FROM alert_history
  WHERE title NOT IN ('האירוע הסתיים', 'בדקות הקרובות צפויות להתקבל התרעות באזורך')
),
hours AS (
  SELECT generate_series(0, 23) AS hour
),
alert_counts AS (
  SELECT 
    EXTRACT(HOUR FROM "timestamp") AS alert_hour,
    COUNT(*) AS total_alerts
  FROM filtered_alerts
  GROUP BY alert_hour
),
total_count AS (
  SELECT COUNT(*) AS grand_total FROM filtered_alerts
)
SELECT 
  h.hour,
  COALESCE(a.total_alerts, 0) AS alert_count,
  CASE 
    WHEN t.grand_total > 0 THEN ROUND((COALESCE(a.total_alerts, 0)::numeric / t.grand_total) * 100, 2)
    ELSE 0 
  END AS probability_percentage
FROM hours h
LEFT JOIN alert_counts a ON h.hour = a.alert_hour
CROSS JOIN total_count t
ORDER BY h.hour;
