import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Bell, Map as MapIcon, ShieldAlert, History, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';

interface Alert {
  id: string;
  title: string;
  areas: string[];
  timestamp: string;
}

const App: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);

  useEffect(() => {
    // Fetch initial alerts
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setActiveAlert(data[0]);
      }
    };

    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: '*', table: 'alerts', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setActiveAlert(payload.new as Alert);
        } else if (payload.eventType === 'DELETE') {
          setActiveAlert(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white">Red Alert</h1>
          <p className="text-[#8e8e93]">Real-time Missile Warnings</p>
        </div>
        <div className="flex gap-4">
          <Settings className="text-[#8e8e93] cursor-pointer" />
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {activeAlert ? (
            <motion.div
              key={activeAlert.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card mb-6 border-l-4 border-l-[#ff3b30]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#ff3b30] p-2 rounded-lg pulse">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{activeAlert.title}</h2>
                  <span className="badge badge-red">Active Threat</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {activeAlert.areas.map((area, i) => (
                  <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/10 text-sm">
                    {area}
                  </div>
                ))}
              </div>
              <Map activeAlert={activeAlert} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card mb-6 flex flex-col items-center justify-center py-12 text-center"
            >
              <Bell className="text-[#8e8e93] mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">System Quiet</h2>
              <p className="text-[#8e8e93]">No active alerts in your area</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-8">
          <button className="flex-1 glass-card flex items-center justify-center gap-2 font-bold py-4 bg-white/5 hover:bg-white/10 transition-colors">
            <MapIcon size={20} /> Map View
          </button>
          <button className="flex-1 glass-card flex items-center justify-center gap-2 font-bold py-4 bg-white/5 hover:bg-white/10 transition-colors">
            <History size={20} /> History
          </button>
        </div>
      </main>
      
      <footer className="mt-12 text-center text-xs text-[#8e8e93]">
        <p>Data provided by Home Front Command (Oref)</p>
      </footer>
    </div>
  );
};

export default App;
