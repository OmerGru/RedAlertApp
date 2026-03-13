import { useState, useMemo, memo } from 'react';
import { Search, X, Bookmark } from 'lucide-react';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { useWatchedLocations } from '../hooks/useWatchedLocations';
import type { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';
import { timeAgo, getAlertColor } from '../utils/utils';
import { COLOR_ALERT, COLOR_SUCCESS, COLOR_WARNING } from '../utils/constants';
import './HistoryPage.css';

const HistoryEntry = memo(({ entry }: { entry: AlertHistoryEntry }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const hasManyLocations = entry.areas.length > 8;
  const displayAreas = hasManyLocations ? entry.areas.slice(0, 8) : entry.areas;

  const alertColor = getAlertColor(entry.title);
  const isSuccess = alertColor === COLOR_SUCCESS;
  const isWarning = alertColor === COLOR_WARNING;

  const joinedAreas = useMemo(() => displayAreas.join(' · '), [displayAreas]);
  const fullJoinedAreas = useMemo(() => entry.areas.join(' · '), [entry.areas]);

  const borderColor = isWarning ? COLOR_WARNING : isSuccess ? COLOR_SUCCESS : COLOR_ALERT;
  const titleColor = isWarning ? COLOR_WARNING : isSuccess ? COLOR_SUCCESS : COLOR_ALERT;

  return (
    <>
      <div className="history-entry" style={{ borderLeftColor: borderColor }}>
        <div className="history-entry-header">
          <span className="history-entry-time">{timeAgo(entry.timestamp)}</span>
          <span className="history-entry-title" style={{ color: titleColor }}>
            {entry.title}
          </span>
        </div>

        <p className="history-entry-areas">
          {joinedAreas}{hasManyLocations ? '...' : ''}
        </p>

        <div className="history-entry-footer">
          {hasManyLocations && (
            <button
              className="history-show-more-btn"
              onClick={() => setModalVisible(true)}
            >
              {t('history.showAll')}
            </button>
          )}
          <span className="history-entry-count">{entry.areas.length} {t('history.locations')}</span>
        </div>
      </div>

      {modalVisible && (
        <div className="history-modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <div style={{ flex: 1, marginRight: 15 }}>
                <div className="history-modal-title" style={{ color: titleColor }}>
                  {entry.title}
                </div>
                <div className="history-modal-time">{timeAgo(entry.timestamp)}</div>
              </div>
              <button
                className="history-modal-close-x"
                onClick={() => setModalVisible(false)}
              >
                <X size={24} color="#fff" />
              </button>
            </div>

            <div className="history-modal-scroll">
              <p className="history-modal-areas-text">{fullJoinedAreas}</p>
            </div>

            <button
              className="history-modal-close-btn"
              style={{ backgroundColor: borderColor }}
              onClick={() => setModalVisible(false)}
            >
              {t('history.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default function HistoryPage() {
  const history = useAlertHistory();
  const { watched } = useWatchedLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);

  const filteredHistory = useMemo(() => {
    let result = history;

    if (showWatchedOnly && watched.size > 0) {
      result = result.filter(entry =>
        entry.areas.some(area =>
          [...watched].some(watchedCity => area.includes(watchedCity))
        )
      );
    }

    if (!searchQuery.trim()) return result;

    const lowerQuery = searchQuery.toLowerCase().trim();
    return result.filter(entry =>
      entry.areas.some(area => area.toLowerCase().includes(lowerQuery)) ||
      entry.title?.toLowerCase().includes(lowerQuery)
    );
  }, [history, searchQuery, showWatchedOnly, watched]);

  return (
    <div className="history-container">
      <div className="history-header">
        <span className="history-header-subtitle">{history.length} {t('history.eventsRecorded')}</span>
        <h1 className="history-header-title">{t('history.title')}</h1>
      </div>

      <div className="history-search-container">
        <div className="history-search-bar">
          <Search size={20} color="#8e8e93" />
          <input
            className="history-search-input"
            placeholder={t('settings.searchCities')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button className="history-search-clear" onClick={() => setSearchQuery('')}>
              <X size={18} color="#8e8e93" />
            </button>
          )}
        </div>
        <button
          className={`history-filter-toggle ${showWatchedOnly ? 'active' : ''}`}
          onClick={() => setShowWatchedOnly(!showWatchedOnly)}
        >
          <Bookmark size={20} color={showWatchedOnly ? '#fff' : '#8e8e93'} fill={showWatchedOnly ? '#fff' : 'none'} />
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="history-empty">
          <Search size={48} color="#2c2c2e" style={{ marginBottom: 16 }} />
          <h2 className="history-empty-title">
            {searchQuery ? t('map.noThreatsDetected') : t('history.noAlerts')}
          </h2>
          <p className="history-empty-subtitle">
            {searchQuery
              ? `${t('settings.searchCities').replace('...', '')} "${searchQuery}" ${t('history.noAlertsSubtitle').toLowerCase()}`
              : t('history.noAlertsSubtitle')}
          </p>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item) => (
            <HistoryEntry key={item.id} entry={item} />
          ))}
        </div>
      )}
    </div>
  );
}
