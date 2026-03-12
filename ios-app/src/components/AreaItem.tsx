import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';

export interface AreaItemProps {
  area: string;
  variant?: 'badge' | 'list';
}

export default function AreaItem({ area, variant = 'badge' }: AreaItemProps) {
  if (variant === 'list') {
    return (
      <View style={styles.listItem}>
        <Text style={styles.listText}>{area}</Text>
      </View>
    );
  }

  return (
    <BlurView intensity={30} tint="light" style={styles.badge}>
      <Text style={styles.badgeText}>{area}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 6,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  listItem: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  listText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '500',
  },
});
