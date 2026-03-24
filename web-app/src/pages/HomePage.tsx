import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { useWatchedLocations } from '../hooks/useWatchedLocations';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import HourlyAlertGraph from '../components/HourlyAlertGraph';
import { t } from '../utils/i18n';
import './HomePage.css';

type HomeStatusType = 'URGENT' | 'SAFE_TO_LEAVE' | 'QUIET';

export default function HomePage() {
  const alert = useAlerts();
  const history = useAlertHistory();
  const { watched } = useWatchedLocations();
  const { address, loading: locationLoading } = useCurrentLocation();

  const statusType = useMemo((): HomeStatusType => {
    const hasActiveInArea = alert.active && alert.areas.some(a => watched.has(a));
    if (hasActiveInArea) return 'URGENT';

    const now = Date.now();
    const hasRecentEnded = history.some(h =>
      (h.title === 'האירוע הסתיים' || h.title === 'Event Ended') &&
      h.areas.some(a => watched.has(a)) &&
      (now - h.timestamp < 10 * 60 * 1000)
    );
    if (hasRecentEnded) return 'SAFE_TO_LEAVE';

    return 'QUIET';
  }, [alert.active, alert.areas, history, watched]);

  const isUrgent = statusType === 'URGENT';
  const isSafeLeave = statusType === 'SAFE_TO_LEAVE';

  const getStatusText = () => {
    if (isUrgent) return t('home.statusEnter');
    if (isSafeLeave) return t('home.statusLeave');
    return t('home.statusQuiet');
  };

  const getSubtitleText = () => {
    if (isUrgent) return alert.title;
    if (isSafeLeave) return t('map.recentAlert');
    return t('map.noThreats');
  };

  const gradientColors = isUrgent
    ? 'linear-gradient(180deg, #3a0ca3, #d00000, #000000)'
    : isSafeLeave
    ? 'linear-gradient(180deg, #003d00, #004d00, #000000)'
    : 'linear-gradient(180deg, #0f0f13, #1c1c24, #000000)';

  return (
    <div className="home-container" style={{ background: gradientColors }}>
      <div className="home-header">
        <div className="home-header-blur">
          <div className="home-location-wrapper">
            <MapPin size={16} color="#8e8e93" />
            <span className="home-location-text">
              {locationLoading ? t('settings.locating') :
                address ? t('home.currentLocation', { location: address }) :
                t('home.locationUnavailable')}
            </span>
          </div>
        </div>
      </div>

      <motion.div
        className={`home-status-circle ${isUrgent ? 'alert' : isSafeLeave ? 'safe' : 'quiet'}`}
        animate={isUrgent ? {
          scale: [1, 1.15, 1],
        } : { scale: 1 }}
        transition={isUrgent ? {
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      >
        <span className={`home-status-text ${isUrgent ? 'alert' : isSafeLeave ? 'safe' : 'quiet'}`}>
          {getStatusText()}
        </span>
      </motion.div>

      <p className={`home-subtitle ${isUrgent ? 'alert' : isSafeLeave ? 'safe' : ''}`}>
        {getSubtitleText()}
      </p>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        <HourlyAlertGraph />
      </div>
    </div>
  );
}
