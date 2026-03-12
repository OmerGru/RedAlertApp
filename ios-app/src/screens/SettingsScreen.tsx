import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useState, useMemo } from 'react';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { CITY_COORDINATES, MAP_CIRCLE_LINGER_MS } from '../utils/constants';
import { useWatchedLocations } from '../hooks/useWatchedLocations';
import { t } from '../utils/i18n';

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
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const { watched, toggle } = useWatchedLocations();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);

  const watchedList = useMemo(() => [...watched].sort((a, b) => a.localeCompare(b, 'he')), [watched]);

  const availableCities = useMemo(
    () => ALL_CITIES.filter((c) => !watched.has(c) && c.includes(search)),
    [watched, search]
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
      if (nearest && !watched.has(nearest)) toggle(nearest);
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Alert Settings */}
        <SectionHeader title={t('settings.alertSettings')} />
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="time-outline" size={18} color="#ff3b30" />
            </View>
            <Text style={styles.settingLabel}>{t('settings.circuitLinger')}</Text>
            <Text style={styles.settingValue}>{MAP_CIRCLE_LINGER_MS / 60000} {t('settings.minutes')}</Text>
          </View>
        </View>

        {/* Watched Locations */}
        <SectionHeader title={t('settings.watchedLocations')} subtitle={t('settings.watchedSubtitle')} />
        <View style={styles.card}>
          {watchedList.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>{t('settings.noLocations')}</Text>
            </View>
          ) : (
            watchedList.map((city) => (
              <View key={city} style={styles.watchedRow}>
                <Ionicons name="location-outline" size={16} color="#ff3b30" style={{ marginRight: 10 }} />
                <Text style={styles.watchedCity}>{city}</Text>
                <TouchableOpacity onPress={() => toggle(city)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color="#3a3a3c" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => { setAdding(!adding); setSearch(''); }}
              activeOpacity={0.75}
            >
              <Ionicons name={adding ? 'chevron-up' : 'add'} size={16} color="#fff" />
              <Text style={styles.actionButtonText}>{adding ? t('settings.done') : t('settings.addLocation')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleGps}
              disabled={locating}
              activeOpacity={0.75}
            >
              <Ionicons name={locating ? 'hourglass-outline' : 'locate-outline'} size={16} color="#ff3b30" />
              <Text style={[styles.actionButtonText, { color: '#ff3b30' }]}>
                {locating ? t('settings.locating') : t('settings.gps')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {adding && (
          <View style={styles.card}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color="#636366" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('settings.searchCities')}
                placeholderTextColor="#636366"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#636366" />
                </TouchableOpacity>
              )}
            </View>
            {availableCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.availableRow}
                onPress={() => toggle(city)}
                activeOpacity={0.7}
              >
                <Text style={styles.availableCity}>{city}</Text>
                <Ionicons name="add-circle-outline" size={20} color="#636366" />
              </TouchableOpacity>
            ))}
            {availableCities.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>{t('settings.noCitiesToAdd')}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1, borderBottomColor: '#2c2c2e',
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: { paddingTop: 24, paddingBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { color: '#ff3b30', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionSubtitle: { color: '#636366', fontSize: 12, marginTop: 3, lineHeight: 17 },
  card: { backgroundColor: '#1c1c1e', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  settingIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingLabel: { flex: 1, color: '#ebebf5', fontSize: 15 },
  settingValue: { color: '#636366', fontSize: 14 },
  emptyRow: { paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  emptyText: { color: '#636366', fontSize: 14 },
  watchedRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2c2e',
  },
  watchedCity: { flex: 1, color: '#ebebf5', fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 10, padding: 12 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 9, paddingVertical: 9, gap: 6,
  },
  actionButtonPrimary: { backgroundColor: '#ff3b30' },
  actionButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ff3b30' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2c2e',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  availableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2c2e',
  },
  availableCity: { flex: 1, color: '#ebebf5', fontSize: 15 },
});
