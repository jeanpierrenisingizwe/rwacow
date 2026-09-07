import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';
import { useApp } from '../context/AppContext';

type TabKey = 'info' | 'vaccines' | 'offspring' | 'transfers';

const CowDetailScreen: React.FC = () => {
  const { params } = useRoute<any>();
  const { t } = useApp();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('info');
  const [vacForm, setVacForm] = useState({ vaccine_name: '', vaccination_date: '', next_due_date: '' });
  const [showVacForm, setShowVacForm] = useState(false);

  const { data: cow, isLoading } = useQuery({
    queryKey: ['cow-mobile', params.id],
    queryFn: () => api.get(`/cows/${params.id}`).then(r => r.data),
  });

  const vacMutation = useMutation({
    mutationFn: (data: any) => api.post('/vaccinations', { ...data, cow_id: params.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cow-mobile', params.id] });
      setShowVacForm(false);
      Alert.alert('Success', 'Vaccination recorded');
    }
  });

  if (isLoading) return <Text style={styles.loading}>{t('loading')}</Text>;
  if (!cow) return <Text style={styles.loading}>Not found</Text>;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'vaccines', label: t('vaccinations') },
    { key: 'offspring', label: t('offspring') },
    { key: 'transfers', label: 'Transfers' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐄</Text>
        <Text style={styles.heroName}>{cow.name || cow.tag_number}</Text>
        <Text style={styles.heroTag}>{cow.tag_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cow.status === 'active' ? '#22c55e' : '#ef4444' }]}>
          <Text style={styles.statusText}>{t(cow.status)}</Text>
        </View>
      </View>

      {/* Vaccination status */}
      <View style={[styles.vacStatus, cow.vaccinations?.length > 0 ? styles.vacYes : styles.vacNo]}>
        <Text style={styles.vacStatusText}>
          {cow.vaccinations?.length > 0
            ? `💉 ${t('vaccinated')} — ${cow.vaccinations.length} record(s)`
            : `⚠️ ${t('notVaccinated')}`}
        </Text>
      </View>

      {/* Owner & Location */}
      <View style={styles.row}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>👤 {t('owner')}</Text>
          <Text style={styles.infoValue}>{cow.owner_name || '—'}</Text>
          <Text style={styles.infoSub}>{cow.owner_phone}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📍 {t('location')}</Text>
          <Text style={styles.infoValue}>{cow.district || '—'}</Text>
          <Text style={styles.infoSub}>{cow.sector}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tb => (
          <TouchableOpacity key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}>
            <Text style={[styles.tabText, tab === tb.key && styles.tabActiveText]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContent}>
        {/* Info tab */}
        {tab === 'info' && (
          <View style={styles.infoGrid}>
            {[
              ['Breed', cow.breed],
              ['Gender', cow.gender ? t(cow.gender) : '—'],
              ['Color', cow.color],
              ['Weight', cow.weight_kg ? `${cow.weight_kg} kg` : '—'],
              ['Date of Birth', cow.date_of_birth],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValText}>{value || '—'}</Text>
              </View>
            ))}
            {cow.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValText}>{cow.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vaccinations tab */}
        {tab === 'vaccines' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowVacForm(!showVacForm)}>
              <Text style={styles.addBtnText}>+ Add Vaccination</Text>
            </TouchableOpacity>
            {showVacForm && (
              <View style={styles.form}>
                <Text style={styles.formLabel}>Vaccine Name *</Text>
                <TextInput style={styles.formInput} value={vacForm.vaccine_name}
                  onChangeText={v => setVacForm({...vacForm, vaccine_name: v})} />
                <Text style={styles.formLabel}>Date (YYYY-MM-DD) *</Text>
                <TextInput style={styles.formInput} value={vacForm.vaccination_date}
                  onChangeText={v => setVacForm({...vacForm, vaccination_date: v})} />
                <Text style={styles.formLabel}>Next Due Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.formInput} value={vacForm.next_due_date}
                  onChangeText={v => setVacForm({...vacForm, next_due_date: v})} />
                <TouchableOpacity style={styles.saveBtn}
                  onPress={() => vacMutation.mutate(vacForm)}
                  disabled={vacMutation.isPending}>
                  <Text style={styles.saveBtnText}>{vacMutation.isPending ? t('loading') : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {cow.vaccinations?.length === 0 && <Text style={styles.empty}>{t('noData')}</Text>}
            {cow.vaccinations?.map((v: any) => (
              <View key={v.id} style={styles.listItem}>
                <Text style={styles.listTitle}>💉 {v.vaccine_name}</Text>
                <Text style={styles.listSub}>Date: {v.vaccination_date}</Text>
                {v.next_due_date && <Text style={styles.listDue}>Next: {v.next_due_date}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Offspring tab */}
        {tab === 'offspring' && (
          <View>
            {cow.offspring?.length === 0 && <Text style={styles.empty}>{t('noData')}</Text>}
            {cow.offspring?.map((o: any) => (
              <View key={o.id} style={styles.listItem}>
                <Text style={styles.listTitle}>🐄 {o.calf_tag} {o.calf_name ? `(${o.calf_name})` : ''}</Text>
                <Text style={styles.listSub}>{t('birthDate')}: {o.birth_date}</Text>
                <Text style={styles.listSub}>{o.calf_gender ? t(o.calf_gender) : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transfers tab */}
        {tab === 'transfers' && (
          <View>
            {cow.transfers?.length === 0 && <Text style={styles.empty}>{t('noData')}</Text>}
            {cow.transfers?.map((tr: any) => (
              <View key={tr.id} style={styles.listItem}>
                <Text style={styles.listTitle}>{tr.from_owner_name || 'N/A'} → {tr.to_owner_name}</Text>
                <Text style={styles.listSub}>{tr.transfer_date}</Text>
                {tr.sale_price && <Text style={styles.listSub}>{parseInt(tr.sale_price).toLocaleString()} RWF</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { textAlign: 'center', marginTop: 60, color: '#9ca3af' },
  hero: { backgroundColor: '#14532d', alignItems: 'center', padding: 24, paddingTop: 16 },
  heroEmoji: { fontSize: 48 },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroTag: { color: '#86efac', fontFamily: 'monospace', fontSize: 13, marginTop: 2 },
  statusBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  vacStatus: { marginHorizontal: 12, marginTop: 10, padding: 10, borderRadius: 8 },
  vacYes: { backgroundColor: '#dcfce7' },
  vacNo: { backgroundColor: '#fef2f2' },
  vacStatusText: { fontSize: 13, fontWeight: '600', textAlign: 'center', color: '#374151' },
  row: { flexDirection: 'row', gap: 10, margin: 12 },
  infoBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, elevation: 1 },
  infoTitle: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  infoSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  tabBar: { flexDirection: 'row', marginHorizontal: 12, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#15803d' },
  tabText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  tabActiveText: { color: '#15803d', fontWeight: '700' },
  tabContent: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 1 },
  infoGrid: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValText: { fontSize: 13, color: '#1f2937', fontWeight: '500' },
  notesBox: { paddingTop: 8 },
  addBtn: { backgroundColor: '#dcfce7', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  addBtnText: { color: '#15803d', fontWeight: '600', fontSize: 14 },
  form: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12 },
  formLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  formInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 10, backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#15803d', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  listItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listTitle: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  listSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  listDue: { fontSize: 11, color: '#d97706', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', paddingVertical: 20 },
});

export default CowDetailScreen;
