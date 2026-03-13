import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import { useAlerts } from '../hooks/useAlerts';
import { useAlertHistory } from '../hooks/useAlertHistory';
import AreaItem from '../components/AreaItem';
import {
  MAP_CYCLE_INTERVAL_MS,
  CITY_COORDINATES,
  ISRAEL_CENTER,
  ISRAEL_DEFAULT_ZOOM,
  MAP_CIRCLE_LINGER_MS,
} from '../utils/constants';
import type { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';
import { getAlertColor } from '../utils/utils';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';

interface CircleLayer {
  lat: number;
  lng: number;
  radius: number;
  fillOpacity: number;
  color: string;
  label: string;
}

function buildCircleLayers(activeAreas: string[], history: AlertHistoryEntry[], alertTitle: string): CircleLayer[] {
  const now = Date.now();
  const layers: CircleLayer[] = [];
  const seen = new Set<string>();

  const alertColor = getAlertColor(alertTitle);

  for (const area of activeAreas) {
    if (seen.has(area)) continue;
    const coords = CITY_COORDINATES[area];
    if (!coords) continue;
    seen.add(area);
    layers.push({ ...coords, fillOpacity: 0.40, color: alertColor, label: area });
  }

  for (const entry of history) {
    const ageMs = now - entry.timestamp;
    if (ageMs > MAP_CIRCLE_LINGER_MS) continue;
    const entryColor = getAlertColor(entry.title);
    for (const area of entry.areas) {
      if (seen.has(area)) continue;
      const coords = CITY_COORDINATES[area];
      if (!coords) continue;
      seen.add(area);
      layers.push({ ...coords, fillOpacity: 0.40, color: entryColor, label: area });
    }
  }

  return layers;
}

function buildDisplayAreas(activeAreas: string[], history: AlertHistoryEntry[]): string[] {
  const now = Date.now();
  const seen = new Set<string>();
  const result: string[] = [];

  for (const area of activeAreas) {
    if (!seen.has(area)) { seen.add(area); result.push(area); }
  }
  for (const entry of history) {
    if (now - entry.timestamp > MAP_CIRCLE_LINGER_MS) continue;
    for (const area of entry.areas) {
      if (!seen.has(area)) { seen.add(area); result.push(area); }
    }
  }
  return result;
}

export default function MapPage() {
  const alert = useAlerts();
  const history = useAlertHistory();
  const [displayIndex, setDisplayIndex] = useState(0);
  const [fadeVisible, setFadeVisible] = useState(true);

  const circleLayers = useMemo(() =>
    buildCircleLayers(alert.active ? alert.areas : [], history, alert.title || ''),
    [alert.active, alert.areas, alert.title, history]
  );

  const displayAreas = useMemo(() =>
    buildDisplayAreas(alert.active ? alert.areas : [], history),
    [alert.active, alert.areas, history]
  );

  useEffect(() => {
    if (displayAreas.length <= 10) return;
    const cycleInterval = setInterval(() => {
      setFadeVisible(false);
      setTimeout(() => {
        setDisplayIndex((prev) => (prev + 10) % displayAreas.length);
        setFadeVisible(true);
      }, 300);
    }, MAP_CYCLE_INTERVAL_MS);
    return () => clearInterval(cycleInterval);
  }, [displayAreas.length]);

  useEffect(() => {
    if (displayAreas.length === 0) setDisplayIndex(0);
  }, [displayAreas.length]);

  const currentAreas = displayAreas.slice(displayIndex, displayIndex + 12);

  return (
    <div className="map-container">
      <div className="map-wrapper">
        <MapContainer
          center={ISRAEL_CENTER}
          zoom={ISRAEL_DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          {circleLayers.map((layer, i) => (
            <Circle
              key={`${layer.label}-${i}`}
              center={[layer.lat, layer.lng]}
              radius={layer.radius}
              pathOptions={{
                color: layer.color,
                fillColor: layer.color,
                fillOpacity: layer.fillOpacity,
                weight: 2,
                opacity: Math.min(layer.fillOpacity * 2, 0.9),
              }}
            >
              <Tooltip permanent direction="top" className="map-white-label">
                {layer.label}
              </Tooltip>
            </Circle>
          ))}
        </MapContainer>
      </div>

      <div className="map-side-panel">
        <div className="map-panel-header">
          <div className="map-panel-title">
            {alert.active ? alert.title : displayAreas.length > 0 ? t('map.recentAlert') : t('map.noThreats')}
          </div>
          <div className="map-panel-subtitle">
            {displayAreas.length > 0
              ? `${displayAreas.length} ${t('map.locationsTargeted')}` : ''}
          </div>
        </div>

        {displayAreas.length > 0 && (
          <div
            className="map-areas-list"
            style={{ opacity: fadeVisible ? 1 : 0, transition: 'opacity 0.3s' }}
          >
            {currentAreas.map((area, index) => (
              <AreaItem key={index} area={area} variant="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
