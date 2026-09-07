import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useApp } from '../context/AppContext';

const statusColor: Record<string, string> = {
  active: '#dcfce7',
  sold: '#dbeafe',
  slaughtered: '#fee2e2',
  dead: '#f3f4f6',
};
const statusTextColor: Record<string, string> = {
  active: '#166534',
  sold: '#1e40af',
  slaughtered: '#991b1b',
  dead: '#6b7280',
};

const CowsScreen: React.FC = () => {
  const { t } = useApp();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cows-mobile', search, status],
    queryFn: () => api.get('/cows', { params: { search: search || undefined, status: status || undefined } }).then(r => r.data),
  });

  const renderCow = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('CowDetail', { id: item.id })}>
      <View style={styles.cardHeader}>
        <Text style={styles.tag}>{item.tag_number}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor[item.status] || '#f3f4f6' }]}>
          <Text style={[styles.badgeText, { color: statusTextColor[item.status] || '#6b7280' }]}>{t(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.cowName}>{item.name || '—'}</Text>
      <Text style={styles.detail}>🐄 {item.breed || '—'} · {item.gender ? t(item.gender) : '—'}</Text>
      <Text style={styles.detail}>👤 {item.owner_name || '—'}</Text>
      {item.district && <Text style={styles.detail}>📍 {item.district}{item.sector ? ', ' + item.sector : ''}</Text>}
      {/* Vaccination indicator */}
      <View style={styles.vacBadge}>
        <Text style={styles.vacText}>
          {item.vaccinations_count > 0 ? '💉 ' + t('vaccinated') : '⚠️ ' + t('notVaccinated')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={t('search')}
        value={search}
        onChangeText={setSearch}
      />
      {/* Status filter */}
      <View style={styles.filters}>
        {['', 'active', 'sold', 'slaughtered'].map(s => (
          <TouchableOpacity key={s} onPress={() => setStatus(s)}
            style={[styles.filterBtn, status === s && styles.filterActive]}>
            <Text style={[styles.filterText, status === s && styles.filterActiveText]}>
              {s ? t(s) : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#15803d" size="large" />
      ) : (
        <FlatList
          data={data?.cows}
          keyExtractor={item => item.id}
          renderItem={renderCow}
          ListEmptyComponent={<Text style={styles.empty}>{t('noData')}</Text>}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  search: { margin: 12, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterActive: { backgroundColor: '#14532d', borderColor: '#14532d' },
  filterText: { fontSize: 12, color: '#6b7280' },
  filterActiveText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tag: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: '#15803d' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cowName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  detail: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  vacBadge: { marginTop: 8 },
  vacText: { fontSize: 11, color: '#374151' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
});

export default CowsScreen;
