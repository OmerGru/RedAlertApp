import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HourlyStat {
  hour: number;
  alert_count: number;
  probability_percentage: number;
}

export function useHourlyStats() {
  const [stats, setStats] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('hourly_alert_stats')
          .select('*')
          .order('hour', { ascending: true });

        if (error) throw error;
        if (mounted) {
          setStats(data as HourlyStat[] || []);
        }
      } catch (err: any) {
        console.error('Error fetching hourly alert stats:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading, error };
}
