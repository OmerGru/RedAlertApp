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
