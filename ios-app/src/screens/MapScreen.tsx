import { StyleSheet, View, Text, Platform, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useEffect, useState, createElement, useRef, useCallback } from 'react';
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
import { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';

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

  const isEventEnded = alertTitle === 'האירוע הסתיים' || alertTitle === 'Event Ended';
  const circleColor = isEventEnded ? '#00ff00' : '#ff2d00';

  for (const area of activeAreas) {
    if (seen.has(area)) continue;
    const coords = CITY_COORDINATES[area];
    if (!coords) { console.warn(`[Map] No coordinates for: "${area}"`); continue; }
    seen.add(area);
    layers.push({ ...coords, fillOpacity: 0.40, color: circleColor, label: area });
  }

  for (const entry of history) {
    const ageMs = now - entry.timestamp;
    if (ageMs > MAP_CIRCLE_LINGER_MS) continue;
    for (const area of entry.areas) {
      if (seen.has(area)) continue;
      const coords = CITY_COORDINATES[area];
      if (!coords) continue;
      seen.add(area);
      layers.push({ ...coords, fillOpacity: 0.40, color: circleColor, label: area });
    }
  }

  return layers;
}

// Returns a deduplicated union of active areas + recent history areas (within linger window)
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

// The base HTML is built ONCE — it sets up the Leaflet map and exposes
// a global `window.updateCircles(layers)` function that React can call
// via postMessage / injectJavaScript without ever reloading the iframe.
const BASE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #1a1a2e; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${ISRAEL_CENTER[0]}, ${ISRAEL_CENTER[1]}],
      zoom: ${ISRAEL_DEFAULT_ZOOM},
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    var circleLayer = L.layerGroup().addTo(map);

    function updateCircles(layers) {
      circleLayer.clearLayers();
      layers.forEach(function(l) {
        L.circle([l.lat, l.lng], {
          radius: l.radius,
          color: l.color,
          fillColor: l.color,
          fillOpacity: l.fillOpacity,
          weight: 2,
          opacity: Math.min(l.fillOpacity * 2, 0.9)
        }).addTo(circleLayer)
          .bindTooltip(l.label, { permanent: false, direction: 'top' });
      });
    }

    // Listen for messages from React (web iframe postMessage)
    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'UPDATE_CIRCLES') updateCircles(data.layers);
      } catch(err) {}
    });

    // Also listen for React Native WebView injectedJavaScript calls
    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'UPDATE_CIRCLES') updateCircles(data.layers);
      } catch(err) {}
    });
  </script>
</body>
</html>`;

export default function MapScreen() {
  const alert = useAlerts();
  const history = useAlertHistory();
  const [displayIndex, setDisplayIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Send new circle data without reloading the map
  const pushLayers = useCallback((layers: CircleLayer[]) => {
    const msg = JSON.stringify({ type: 'UPDATE_CIRCLES', layers });
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    } else {
      webViewRef.current?.injectJavaScript(
        `(function(){ window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(msg)} })); })()`
      );
    }
  }, []);

  // Push layers whenever alert or history changes
  useEffect(() => {
    const layers = buildCircleLayers(alert.active ? alert.areas : [], history, alert.title || '');
    pushLayers(layers);
  }, [alert.active, alert.areas, alert.title, history, pushLayers]);

  const displayAreas = buildDisplayAreas(alert.active ? alert.areas : [], history);

  useEffect(() => {
    if (displayAreas.length <= 10) return;
    const cycleInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setDisplayIndex((prev) => (prev + 10) % displayAreas.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, MAP_CYCLE_INTERVAL_MS);
    return () => clearInterval(cycleInterval);
  }, [displayAreas.length]);

  useEffect(() => {
    if (displayAreas.length === 0) setDisplayIndex(0);
  }, [displayAreas.length]);

  const currentAreas = displayAreas.slice(displayIndex, displayIndex + 12);

  const handleIframeRef = useCallback((el: HTMLIFrameElement | null) => {
    iframeRef.current = el;
    // Once the iframe loads push the current state immediately
    if (el) {
      el.onload = () => {
        const layers = buildCircleLayers(alert.active ? alert.areas : [], history, alert.title || '');
        el.contentWindow?.postMessage(JSON.stringify({ type: 'UPDATE_CIRCLES', layers }), '*');
      };
    }
  }, []); // intentionally empty deps — we want a stable ref callback

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <View style={styles.mapContainer}>
            {createElement('iframe', {
              srcDoc: BASE_HTML,
              style: { width: '100%', height: '100%', border: 'none' },
              ref: handleIframeRef,
            })}
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: BASE_HTML }}
            style={styles.map}
            javaScriptEnabled
          />
        )}
      </View>

      {!isMobile && (
        <View style={styles.sidePanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              {alert.active ? alert.title : displayAreas.length > 0 ? t('map.recentAlert') : t('map.noThreats')}
            </Text>
            <Text style={styles.panelSubtitle}>
              {displayAreas.length > 0
                ? `${displayAreas.length} ${t('map.locationsTargeted')}` : ''}
            </Text>
          </View>

          {displayAreas.length > 0 && (
            <Animated.View style={[styles.areasList, { opacity: fadeAnim }]}>
              <ScrollView style={{ flex: 1 }}>
                {currentAreas.map((area, index) => (
                  <AreaItem key={index} area={area} variant="list" />
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#000' },
  mapWrapper: { flex: 9 },
  mapContainer: { width: '100%', height: '100%' },
  map: { width: '100%', height: '100%' },
  sidePanel: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  panelHeader: {
    padding: 20,
    backgroundColor: '#2c2c2e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  panelSubtitle: { color: '#8e8e93', fontSize: 14 },
  areasList: { flex: 1 },
  lingerNote: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
  },
  lingerText: { color: '#8e8e93', fontSize: 12, lineHeight: 18 },
});
