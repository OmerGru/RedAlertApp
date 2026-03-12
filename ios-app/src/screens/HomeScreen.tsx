import { StyleSheet, Text, View, Animated, ScrollView } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface AlertState {
  active: boolean;
  title: string;
  areas: string[];
}

export default function HomeScreen() {
  const [alert, setAlert] = useState<AlertState>({ active: false, title: 'Quiet', areas: [] });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation & Haptics for active alerts
  useEffect(() => {
    if (alert.active) {
      // Trigger critical haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Animated.parallel([
         Animated.loop(
           Animated.sequence([
             Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
             Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
           ])
         ),
         Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      ]).start();
    } else {
      pulseAnim.setValue(1);
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
  }, [alert.active, pulseAnim, fadeAnim]);

  // Poll the local backend API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://192.168.1.236:3000/api/alerts');
        setAlert(response.data);
      } catch (error) {
        console.error('Error fetching from backend poller:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
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
              {alert.active ? 'ALERT' : 'Quiet'}
            </Text>
        </BlurView>
      </Animated.View>

      <Text style={styles.subtitle}>
        {alert.active ? alert.title : 'No Active Threats'}
      </Text>
      
      <Animated.View style={{ opacity: fadeAnim, flex: 1, width: '100%' }}>
          {alert.active && alert.areas.length > 0 && (
             <ScrollView contentContainerStyle={styles.areasContainer}>
                {alert.areas.map((area, idx) => (
                   <BlurView intensity={30} tint="light" key={idx} style={styles.areaBadge}>
                       <Text style={styles.areaText}>{area}</Text>
                   </BlurView>
                ))}
             </ScrollView>
          )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  statusCircleContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  statusCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quietCircle: {
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  alertCircle: {
    borderColor: 'rgba(255, 59, 48, 0.8)',
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },
  statusText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quietText: {
    color: '#34C759',
  },
  alertText: {
    color: '#FF3B30',
  },
  subtitle: {
    color: '#EBEBF5',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1,
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  areaBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 6,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  areaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  }
});
