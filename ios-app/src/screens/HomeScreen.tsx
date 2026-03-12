import { StyleSheet, Text, View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAlerts } from '../hooks/useAlerts';
import { t } from '../utils/i18n';

export default function HomeScreen() {
  const alert = useAlerts();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (alert.active) {
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
  }, [alert.active]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={alert.active ? ['#3a0ca3', '#d00000', '#000000'] : ['#0f0f13', '#1c1c24', '#000000']}
        style={styles.background}
      />

      <Animated.View style={[
        styles.statusCircleContainer,
        { transform: [{ scale: alert.active ? pulseAnim : 1 }] }
      ]}>
        <BlurView intensity={alert.active ? 80 : 40} tint="dark" style={[
          styles.statusCircle,
          alert.active ? styles.alertCircle : styles.quietCircle,
        ]}>
          <Text style={[styles.statusText, alert.active ? styles.alertText : styles.quietText]}>
            {alert.active ? t('home.alert') : t('home.quiet')}
          </Text>
        </BlurView>
      </Animated.View>

      <Text style={[styles.subtitle, alert.active && styles.subtitleAlert]}>
        {alert.active ? alert.title : t('home.noThreats')}
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
  statusCircle: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 140, overflow: 'hidden' },
  quietCircle: { borderColor: 'rgba(52,199,89,0.4)', backgroundColor: 'rgba(52,199,89,0.1)' },
  alertCircle: { borderColor: 'rgba(255,59,48,0.8)', backgroundColor: 'rgba(255,59,48,0.3)' },
  statusText: { fontSize: 56, fontWeight: '900', letterSpacing: 2 },
  quietText: { color: '#34C759' },
  alertText: { color: '#FF3B30' },
  subtitle: {
    color: '#EBEBF5', fontSize: 22, fontWeight: '600',
    textAlign: 'center', letterSpacing: 0.5, paddingHorizontal: 32,
  },
  subtitleAlert: { color: '#FF3B30', fontSize: 24, fontWeight: '700' },
});
