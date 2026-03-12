import {
  StyleSheet, View, Text, FlatList,
  TouchableOpacity, TextInput, Platform
} from 'react-native';
import { useState, useMemo } from 'react';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { CITY_COORDINATES } from '../utils/constants';
import { useWatchedLocations } from '../hooks/useWatchedLocations';

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

export default function LocationScreen() {
  const { watched, toggle } = useWatchedLocations();
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(
    () => ALL_CITIES.filter((c) => c.includes(search)),
    [search]
  );

  const handleGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      let nearest = '';
      let minDist = Infinity;
      for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
        const d = distanceKm(latitude, longitude, coords.lat, coords.lng);
        if (d < minDist) { minDist = d; nearest = city; }
      }
      if (nearest) toggle(nearest);
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocating(false);
    }
  };

  const renderItem = ({ item: city }: { item: string }) => {
    const isWatched = watched.has(city);
    return (
      <TouchableOpacity style={styles.cityRow} onPress={() => toggle(city)} activeOpacity={0.7}>
        <Text style={styles.cityName}>{city}</Text>
        <View style={[styles.checkbox, isWatched && styles.checkboxActive]}>
          {isWatched && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watched Locations</Text>
        <Text style={styles.headerSubtitle}>
          {watched.size} location{watched.size !== 1 ? 's' : ''} selected
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#636366" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor="#636366"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.gpsButton} onPress={handleGps} disabled={locating}>
          <Ionicons name={locating ? 'hourglass' : 'locate'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  headerSubtitle: { color: '#8e8e93', fontSize: 14, marginTop: 4 },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  gpsButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2c2c2e',
  },
  cityName: { color: '#ebebf5', fontSize: 16, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#ff3b30', borderColor: '#ff3b30' },
});
