import { StyleSheet, Text, View, Animated } from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAlerts } from '../hooks/useAlerts';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { useWatchedLocations } from '../hooks/useWatchedLocations';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { t } from '../utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeStatusType = 'URGENT' | 'SAFE_TO_LEAVE' | 'QUIET';

export default function HomeScreen() {
  const alert = useAlerts();
  const history = useAlertHistory();
  const { watched } = useWatchedLocations();
  const { address, loading: locationLoading } = useCurrentLocation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const statusType = useMemo((): HomeStatusType => {
    // 1. URGENT: Ongoing event in selected locations
    const hasActiveInArea = alert.active && alert.areas.some(a => watched.has(a));
    if (hasActiveInArea) return 'URGENT';

    // 2. SAFE_TO_LEAVE: "Event Ended" alert in selected locations within last 10 mins
    const now = Date.now();
    const hasRecentEnded = history.some(h => 
      (h.title === 'האירוע הסתיים' || h.title === 'Event Ended') && 
      h.areas.some(a => watched.has(a)) &&
      (now - h.timestamp < 10 * 60 * 1000)
    );
    if (hasRecentEnded) return 'SAFE_TO_LEAVE';

    // 3. QUIET: Default
    return 'QUIET';
  }, [alert.active, alert.areas, history, watched]);

  const isUrgent = statusType === 'URGENT';
  const isSafeLeave = statusType === 'SAFE_TO_LEAVE';

  useEffect(() => {
    if (isUrgent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isUrgent]);

  const getStatusText = () => {
    if (isUrgent) return t('home.statusEnter');
    if (isSafeLeave) return t('home.statusLeave');
    return t('home.statusQuiet');
  };

  const getSubtitleText = () => {
    if (isUrgent) return alert.title;
    if (isSafeLeave) return t('map.recentAlert'); // Reusing "Recent alert" context
    return t('map.noThreats');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isUrgent ? ['#3a0ca3', '#d00000', '#000000'] : 
          isSafeLeave ? ['#003d00', '#004d00', '#000000'] :
          ['#0f0f13', '#1c1c24', '#000000']
        }
        style={styles.background}
      />

      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <BlurView intensity={30} tint="dark" style={styles.headerBlur}>
          <View style={styles.locationWrapper}>
            <Ionicons name="location" size={16} color="#8e8e93" style={styles.locationIcon} />
            <Text style={styles.locationText}>
              {locationLoading ? t('settings.locating') : 
               address ? t('home.currentLocation', { location: address }) : 
               t('home.locationUnavailable')}
            </Text>
          </View>
        </BlurView>
      </SafeAreaView>

      <Animated.View style={[
        styles.statusCircleContainer,
        { transform: [{ scale: isUrgent ? pulseAnim : 1 }] }
      ]}>
        <BlurView intensity={isUrgent ? 80 : 40} tint="dark" style={[
          styles.statusCircle,
          isUrgent ? styles.alertCircle : isSafeLeave ? styles.safeCircle : styles.quietCircle,
        ]}>
          <Text style={[
            styles.statusText, 
            isUrgent ? styles.alertText : isSafeLeave ? styles.safeText : styles.quietText
          ]}>
            {getStatusText()}
          </Text>
        </BlurView>
      </Animated.View>

      <Text style={[
        styles.subtitle, 
        isUrgent && styles.subtitleAlert,
        isSafeLeave && styles.subtitleSafe
      ]}>
        {getSubtitleText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  statusCircleContainer: {
    width: 280, height: 280, borderRadius: 140,
    overflow: 'hidden', marginBottom: 36,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20,
  },
  statusCircle: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 140, overflow: 'hidden', padding: 20 },
  quietCircle: { borderColor: 'rgba(52,199,89,0.4)', backgroundColor: 'rgba(52,199,89,0.1)' },
  alertCircle: { borderColor: 'rgba(255,59,48,0.8)', backgroundColor: 'rgba(255,59,48,0.3)' },
  safeCircle: { borderColor: 'rgba(52,199,89,0.8)', backgroundColor: 'rgba(52,199,89,0.2)' },
  statusText: { fontSize: 32, fontWeight: '900', letterSpacing: 1, textAlign: 'center', lineHeight: 40 },
  quietText: { color: '#34C759' },
  alertText: { color: '#FF3B30' },
  safeText: { color: '#34C759' },
  subtitle: {
    color: '#EBEBF5', fontSize: 18, fontWeight: '600',
    textAlign: 'center', letterSpacing: 0.5, paddingHorizontal: 32,
    marginTop: 10,
  },
  subtitleAlert: { color: '#FF3B30', fontSize: 24, fontWeight: '700' },
  subtitleSafe: { color: '#34C759', fontSize: 20, fontWeight: '700' },
  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  headerBlur: {
    margin: 16, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  locationWrapper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
  },
  locationIcon: { marginRight: 6 },
  locationText: { color: '#8e8e93', fontSize: 13, fontWeight: '600' },
});
