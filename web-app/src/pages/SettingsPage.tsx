import { useState, useMemo, useEffect } from 'react';
import { Search, X, MapPin, Plus, ChevronUp, Crosshair, Clock, Loader2, PlusCircle } from 'lucide-react';
import { CITY_COORDINATES, MAP_CIRCLE_LINGER_MS } from '../utils/constants';
import { useWatchedLocations } from '../hooks/useWatchedLocations';
import { t } from '../utils/i18n';
import './SettingsPage.css';

const ALL_CITIES = Object.keys(CITY_COORDINATES).sort((a, b) => a.localeCompare(b, 'he'));

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="settings-section-header">
      <span className="settings-section-title">{title}</span>
      {subtitle && <span className="settings-section-subtitle">{subtitle}</span>}
    </div>
  );
}

export default function SettingsPage() {
  const { watched, toggle } = useWatchedLocations();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (adding) {
      setLoadingCities(true);
      const timer = setTimeout(() => setLoadingCities(false), 400);
      return () => clearTimeout(timer);
    }
  }, [adding]);

  const watchedList = useMemo(() => [...watched].sort((a, b) => a.localeCompare(b, 'he')), [watched]);

  const availableCities = useMemo(
    () => ALL_CITIES.filter((c) => !watched.has(c) && c.includes(search)),
    [watched, search]
  );

  const handleGps = async () => {
    setLocating(true);
    try {
      if (!navigator.geolocation) return;
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      let nearest = '';
      let minDist = Infinity;
      for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
        const d = distanceKm(latitude, longitude, coords.lat, coords.lng);
        if (d < minDist) { minDist = d; nearest = city; }
      }
      if (nearest && !watched.has(nearest)) toggle(nearest);
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-header-title">{t('settings.title')}</h1>
      </div>

      <div className="settings-scroll">
        {/* Alert Settings */}
        <SectionHeader title={t('settings.alertSettings')} />
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">{t('settings.circuitLinger')}</span>
            <div className="settings-row-right">
              <span className="settings-value">{MAP_CIRCLE_LINGER_MS / 60000} {t('settings.minutes')}</span>
              <div className="settings-icon-box">
                <Clock size={18} color="#ff3b30" />
              </div>
            </div>
          </div>
        </div>

        {/* Watched Locations */}
        <SectionHeader title={t('settings.watchedLocations')} subtitle={t('settings.watchedSubtitle')} />
        <div className="settings-card">
          {watchedList.length === 0 ? (
            <div className="settings-empty-row">
              <span className="settings-empty-text">{t('settings.noLocations')}</span>
            </div>
          ) : (
            watchedList.map((city) => (
              <div key={city} className="settings-watched-row">
                <div className="settings-row-right">
                  <MapPin size={16} color="#ff3b30" />
                  <span className="settings-watched-city">{city}</span>
                </div>
                <button className="settings-remove-btn" onClick={() => toggle(city)}>
                  <X size={20} color="#3a3a3c" />
                </button>
              </div>
            ))
          )}

          <div className="settings-action-row">
            <button
              className="settings-action-btn primary"
              onClick={() => { setAdding(!adding); setSearch(''); }}
            >
              {adding ? <ChevronUp size={16} /> : <Plus size={16} />}
              <span>{adding ? t('settings.done') : t('settings.addLocation')}</span>
            </button>
            <button
              className="settings-action-btn secondary"
              onClick={handleGps}
              disabled={locating}
            >
              {locating ? <Loader2 size={16} className="spinning" /> : <Crosshair size={16} />}
              <span>{locating ? t('settings.locating') : t('settings.gps')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {adding && (
        <div className="settings-modal-overlay" onClick={() => setAdding(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <span className="settings-modal-title">{t('settings.addLocation')}</span>
              <button className="settings-modal-close-x" onClick={() => setAdding(false)}>
                <X size={24} color="#fff" />
              </button>
            </div>

            <div className="settings-search-box">
              <Search size={14} color="#636366" />
              <input
                className="settings-search-input"
                placeholder={t('settings.searchCities')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search.length > 0 && (
                <button className="settings-search-clear" onClick={() => setSearch('')}>
                  <X size={16} color="#636366" />
                </button>
              )}
            </div>

            <div className="settings-modal-scroll">
              {loadingCities ? (
                <div className="settings-loader">
                  <Loader2 size={32} color="#ff3b30" className="spinning" />
                </div>
              ) : (
                <>
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      className="settings-available-row"
                      onClick={() => toggle(city)}
                    >
                      <PlusCircle size={20} color="#636366" />
                      <span className="settings-available-city">{city}</span>
                    </button>
                  ))}
                  {availableCities.length === 0 && (
                    <div className="settings-empty-row">
                      <span className="settings-empty-text">{t('settings.noCitiesToAdd')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
