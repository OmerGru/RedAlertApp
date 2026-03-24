import { motion } from 'framer-motion';
import { useHourlyStats } from '../hooks/useHourlyStats';
import { t } from '../utils/i18n';
import './HourlyAlertGraph.css';

export default function HourlyAlertGraph() {
  const { stats, loading, error } = useHourlyStats();

  if (loading) {
    return (
      <div className="hourly-graph-container" style={{ opacity: 0.5 }}>
        <div className="hourly-graph-header">
          <h3 className="hourly-graph-title">{t('home.hourlyGraphTitle') || 'סבירות התרעות לפי שעה'}</h3>
        </div>
        <div className="hourly-graph-chart" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats || stats.length === 0) {
    return null;
  }

  const maxProbability = Math.max(...stats.map(s => s.probability_percentage), 1);

  return (
    <motion.div 
      className="hourly-graph-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="hourly-graph-header">
        <h3 className="hourly-graph-title">{t('home.hourlyGraphTitle') || 'סבירות התרעות לפי שעה'}</h3>
        <p className="hourly-graph-subtitle">{t('home.hourlyGraphSubtitle') || 'מבוסס על נתוני עבר'}</p>
      </div>

      <div className="hourly-graph-chart">
        {stats.map((stat, i) => {
          const heightPercent = (stat.probability_percentage / maxProbability) * 100;
          const showLabel = i % 4 === 0; // 0, 4, 8, 12, 16, 20

          return (
            <div key={stat.hour} className="hourly-graph-bar-group">
              <div className="hourly-graph-bar-wrapper">
                <motion.div
                  className="hourly-graph-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercent, 2)}%` }} // Minimum height so 0% has a tiny dot
                  transition={{ duration: 0.8, delay: i * 0.03, ease: 'easeOut' }}
                />
              </div>
              {showLabel && (
                <span className="hourly-graph-label">
                  {stat.hour.toString().padStart(2, '0')}:00
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
