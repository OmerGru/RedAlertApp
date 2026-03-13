import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useState, useMemo, memo, useEffect } from 'react';
import { useAlertHistory } from '../hooks/useAlertHistory';
import { AlertHistoryEntry } from '../utils/types';
import { t } from '../utils/i18n';
import { timeAgo, getAlertColor } from '../utils/utils';
import { COLOR_ALERT, COLOR_SUCCESS, COLOR_WARNING } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useWatchedLocations } from '../hooks/useWatchedLocations';


const HistoryEntry = memo(({ entry }: { entry: AlertHistoryEntry }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const hasManyLocations = entry.areas.length > 8;
  const displayAreas = hasManyLocations ? entry.areas.slice(0, 8) : entry.areas;

  const alertColor = getAlertColor(entry.title);
  const isSuccess = alertColor === COLOR_SUCCESS;
  const isWarning = alertColor === COLOR_WARNING;

  const joinedAreas = useMemo(() => displayAreas.join(' · '), [displayAreas]);
  const fullJoinedAreas = useMemo(() => entry.areas.join(' · '), [entry.areas]);

  return (
    <>
      <View style={[styles.entry, isWarning && styles.entryWarning, !isWarning && isSuccess && styles.entrySuccess]}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTime}>{timeAgo(entry.timestamp)}</Text>
          <Text
            style={[styles.entryTitle, isWarning && styles.titleWarning, !isWarning && isSuccess && styles.titleSuccess]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {entry.title}
          </Text>
        </View>

        <Text style={styles.entryAreas} numberOfLines={3}>
          {joinedAreas}{hasManyLocations ? '...' : ''}
        </Text>

        <View style={styles.footer}>
          {hasManyLocations ? (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.showMoreText}>{t('history.showAll')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.entryCount}>{''}</Text>
          )}<Text style={styles.entryCount}>{entry.areas.length} {t('history.locations')}</Text>
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
              <View style={{ flex: 1, marginRight: 15 }}>
                <Text
                  style={[styles.modalTitle, isWarning && styles.titleWarning, !isWarning && isSuccess && styles.titleSuccess]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {entry.title}
                </Text>
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
              style={[styles.modalCloseBtn, isWarning && styles.modalCloseBtnWarning, !isWarning && isSuccess && styles.modalCloseBtnSuccess]}
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
  const { watched } = useWatchedLocations();
  const [searchQuery, setSearchQuery] = useState('');
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);

  const filteredHistory = useMemo(() => {
    let result = history;

    if (showWatchedOnly && watched.size > 0) {
      result = result.filter(entry =>
        entry.areas.some(area =>
          [...watched].some(watchedCity => area.includes(watchedCity))
        )
      );
    }

    if (!searchQuery.trim()) return result;

    const lowerQuery = searchQuery.toLowerCase().trim();
    return result.filter(entry =>
      entry.areas.some(area => area.toLowerCase().includes(lowerQuery)) ||
      entry.title?.toLowerCase().includes(lowerQuery)
    );
  }, [history, searchQuery, showWatchedOnly, watched]);


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>{history.length} {t('history.eventsRecorded')}</Text>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
      </View><View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('settings.searchCities')}
            placeholderTextColor="#636366"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8e8e93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showWatchedOnly && styles.filterToggleActive]}
          onPress={() => setShowWatchedOnly(!showWatchedOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showWatchedOnly ? "bookmark" : "bookmark-outline"}
            size={20}
            color={showWatchedOnly ? "#fff" : "#8e8e93"}
          />
        </TouchableOpacity></View>{filteredHistory.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#2c2c2e" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('map.noThreatsDetected') : t('history.noAlerts')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `${t('settings.searchCities').replace('...', '')} "${searchQuery}" ${t('history.noAlertsSubtitle').toLowerCase()}` : t('history.noAlertsSubtitle')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderBottomWidth: 1, borderBottomColor: '#2c2c2e',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: '#8e8e93', fontSize: 14, marginTop: 10, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#1c1c1e', borderBottomWidth: 1, borderBottomColor: '#2c2c2e',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f0f13', borderRadius: 10,
    paddingHorizontal: 12, height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, textAlign: 'right' },
  filterToggle: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: '#0f0f13',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  filterToggleActive: {
    backgroundColor: COLOR_ALERT,
  },

  entry: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16,
    borderLeftWidth: 3, borderLeftColor: COLOR_ALERT,
  },
  entrySuccess: {
    borderLeftColor: COLOR_SUCCESS,
  },
  entryWarning: { borderLeftColor: COLOR_WARNING },
  entryHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 8,
  },
  entryTitle: { color: COLOR_ALERT, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  titleSuccess: { color: COLOR_SUCCESS },
  titleWarning: { color: COLOR_WARNING },
  entryTime: { color: '#636366', fontSize: 13, fontWeight: '500', marginLeft: 8 },
  entryAreas: { color: '#ebebf5', fontSize: 16, lineHeight: 22, marginBottom: 12, textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', textAlign: 'right' },
  entryCount: { color: '#636366', fontSize: 12, marginLeft: 8 },
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
  modalTitle: { color: COLOR_ALERT, fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  modalTime: { color: '#8e8e93', fontSize: 14, marginTop: 2, textAlign: 'right' },
  closeButton: { padding: 4 },
  modalScroll: { padding: 20 },
  fullAreasText: { color: '#fff', fontSize: 18, lineHeight: 28, textAlign: 'right' },
  modalCloseBtn: {
    margin: 20, backgroundColor: COLOR_ALERT,
    padding: 15, borderRadius: 12, alignItems: 'center',
  },
  modalCloseBtnSuccess: { backgroundColor: COLOR_SUCCESS },
  modalCloseBtnWarning: { backgroundColor: COLOR_WARNING },
  modalCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { color: '#636366', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
