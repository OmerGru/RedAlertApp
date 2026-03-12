import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useMemo, memo, useEffect } from 'react';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';
import { timeAgo } from '../utils/utils';
import { Ionicons } from '@expo/vector-icons';

const HistoryEntry = memo(({ entry }: { entry: AlertHistoryEntry }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const hasManyLocations = entry.areas.length > 8;
  const displayAreas = hasManyLocations ? entry.areas.slice(0, 8) : entry.areas;

  const joinedAreas = useMemo(() => displayAreas.join(' · '), [displayAreas]);
  const fullJoinedAreas = useMemo(() => entry.areas.join(' · '), [entry.areas]);

  return (
    <>
      <View style={styles.entry}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{entry.title}</Text>
          <Text style={styles.entryTime}>{timeAgo(entry.timestamp)}</Text>
        </View>

        <Text style={styles.entryAreas} numberOfLines={3}>
          {joinedAreas}{hasManyLocations ? '...' : ''}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.entryCount}>{entry.areas.length} {t('history.locations')}</Text>
          {hasManyLocations && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.showMoreText}>{t('history.showAll')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{entry.title}</Text>
                <Text style={styles.modalTime}>{timeAgo(entry.timestamp)}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={styles.modalScroll} 
              bounces={true}
              scrollEventThrottle={16}
            >
              <Text style={styles.fullAreasText}>{fullJoinedAreas}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('history.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

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
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
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
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: '#8e8e93', fontSize: 13, marginTop: 4 },
  entry: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16,
    borderLeftWidth: 3, borderLeftColor: '#ff3b30',
  },
  entryHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  entryTitle: { color: '#ff3b30', fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  entryTime: { color: '#636366', fontSize: 13, fontWeight: '500', marginLeft: 8 },
  entryAreas: { color: '#ebebf5', fontSize: 16, lineHeight: 22, marginBottom: 12, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryCount: { color: '#636366', fontSize: 12 },
  showMoreButton: {
    backgroundColor: '#2c2c2e',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6,
  },
  showMoreText: { color: '#0a84ff', fontSize: 13, fontWeight: '600' },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', height: '80%',
    backgroundColor: '#1c1c1e', borderRadius: 20,
    overflow: 'hidden', borderWidth: 1, borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, backgroundColor: '#2c2c2e',
  },
  modalTitle: { color: '#ff3b30', fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  modalTime: { color: '#8e8e93', fontSize: 14, marginTop: 2, textAlign: 'right' },
  closeButton: { padding: 4 },
  modalScroll: { padding: 20 },
  fullAreasText: { color: '#fff', fontSize: 18, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
  modalCloseBtn: {
    margin: 20, backgroundColor: '#ff3b30',
    padding: 15, borderRadius: 12, alignItems: 'center',
  },
  modalCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { color: '#636366', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
