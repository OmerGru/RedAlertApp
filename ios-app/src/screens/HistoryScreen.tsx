import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';

function timeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return t('history.secondsAgo', { n: diffSec });
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('history.minutesAgo', { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  return t('history.hoursAgo', { h: diffHr, m: diffMin % 60 });
}

function HistoryEntry({ entry }: { entry: AlertHistoryEntry }) {
  return (
    <View style={styles.entry}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle}>{entry.title}</Text>
        <Text style={styles.entryTime}>{timeAgo(entry.timestamp)}</Text>
      </View>
      <Text style={styles.entryAreas} numberOfLines={3}>
        {entry.areas.join(' · ')}
      </Text>
      <Text style={styles.entryCount}>{entry.areas.length} {t('history.locations')}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const history = useAlertHistory();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <Text style={styles.headerSubtitle}>{history.length} {t('history.eventsRecorded')}</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('history.noAlerts')}</Text>
          <Text style={styles.emptySubtitle}>{t('history.noAlertsSubtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryEntry entry={item} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1, borderBottomColor: '#2c2c2e',
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  headerSubtitle: { color: '#8e8e93', fontSize: 14, marginTop: 4 },
  entry: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16,
    borderLeftWidth: 3, borderLeftColor: '#ff3b30',
  },
  entryHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  entryTitle: { color: '#ff3b30', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  entryTime: { color: '#636366', fontSize: 13, fontWeight: '500' },
  entryAreas: { color: '#ebebf5', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  entryCount: { color: '#636366', fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { color: '#636366', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
