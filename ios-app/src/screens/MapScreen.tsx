import { StyleSheet, View, Text, Platform, ScrollView, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { useEffect, useState, createElement, useRef } from 'react';
import axios from 'axios';

interface AlertState {
  active: boolean;
  title: string;
  areas: string[];
}

export default function MapScreen() {
  const [alert, setAlert] = useState<AlertState>({ active: false, title: 'Quiet', areas: [] });
  const [displayIndex, setDisplayIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Poll for live alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://192.168.1.236:3000/api/alerts');
        setAlert(response.data);
      } catch (error) {
        console.error('Error fetching alerts for map:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through locations 10 at a time every 4 seconds
  useEffect(() => {
    if (!alert.active || alert.areas.length <= 10) return;

    const cycleInterval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        // Change Index
        setDisplayIndex((prevIndex) => (prevIndex + 10) % alert.areas.length);
        // Fade in
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 4000);

    return () => clearInterval(cycleInterval);
  }, [alert.active, alert.areas.length]);

  // Reset index when alert clears
  useEffect(() => {
    if (!alert.active) setDisplayIndex(0);
  }, [alert.active]);

  // Determine the bounding box for the map URL based on alert active status
  const bbox = alert.active ? '34.72,32.02,34.85,32.14' : '34.0,29.5,36.0,33.5';
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  // Get the current 10 locations to display
  const currentAreas = alert.areas.slice(displayIndex, displayIndex + 10);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          // For web browsers, render a raw HTML iframe directly
          <View style={styles.mapContainer}>
            {createElement('iframe', {
              src: mapUrl,
              style: { width: '100%', height: '100%', border: 'none', filter: 'invert(90%) hue-rotate(180deg)' }
            })}
          </View>
        ) : (
          // For real iOS/Android devices, use React Native WebView
          <WebView
            originWhitelist={['*']}
            source={{ uri: mapUrl }}
            style={styles.map}
          />
        )}
      </View>
      
      {/* Side Panel for Alerts */}
      <View style={styles.sidePanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>
            {alert.active ? '🚨 ' + alert.title : '✅ System Quiet'}
          </Text>
          <Text style={styles.panelSubtitle}>
            {alert.active ? `${alert.areas.length} locations targeted` : 'No active threats detected'}
          </Text>
        </View>

        {alert.active && (
           <Animated.View style={[styles.areasList, { opacity: fadeAnim }]}>
              <ScrollView style={{ flex: 1 }}>
                {currentAreas.map((area, index) => (
                  <View key={index} style={styles.areaItem}>
                    <Text style={styles.areaText}>{area}</Text>
                  </View>
                ))}
              </ScrollView>
              {alert.areas.length > 10 && (
                 <Text style={styles.cycleIndicator}>Cycling {displayIndex + 1} - {Math.min(displayIndex + 10, alert.areas.length)} of {alert.areas.length}...</Text>
              )}
           </Animated.View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
  },
  mapWrapper: {
    flex: 9, // Takes up 90% of screen
  },
  mapContainer: {
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sidePanel: {
    flex: 1, // Takes up 10% of screen
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
  panelTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  panelSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
  },
  areasList: {
    flex: 1,
  },
  areaItem: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  areaText: {
    color: '#ff3b30', // Red for alert areas
    fontSize: 16,
    fontWeight: '500',
  },
  cycleIndicator: {
    color: '#8e8e93',
    padding: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
  }
});
