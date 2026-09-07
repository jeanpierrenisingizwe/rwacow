import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useApp } from '../context/AppContext';

const StatCard: React.FC<{ label: string; value: number; color: string; emoji: string }> = ({
  label, value, color, emoji
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DashboardScreen: React.FC = () => {
  const { t, user, logout } = useApp();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/cows/stats').then(r => r.data),
  });

  const { data: upcomingVac } = useQuery({
    queryKey: ['upcoming-vac'],
    queryFn: () => api.get('/vaccinations', { params: { upcoming: true } }).then(r => r.data),
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>👋 {user?.full_name}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Text style={styles.loading}>{t('loading')}</Text>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard label={t('totalCows')} value={stats?.total_active ?? 0} color="#22c55e" emoji="🐄" />
            <StatCard label={t('totalVaccinated')} value={stats?.total_vaccinated ?? 0} color="#3b82f6" emoji="💉" />
            <StatCard label={t('totalSlaughtered')} value={stats?.total_slaughtered ?? 0} color="#ef4444" emoji="🔪" />
            <StatCard label={t('totalSold')} value={stats?.total_sold ?? 0} color="#f59e0b" emoji="💰" />
          </View>

          {/* By District */}
          {stats?.by_district?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗺️ Cows by District</Text>
              {stats.by_district.slice(0, 5).map((d: any) => (
                <View key={d.district} style={styles.districtRow}>
                  <Text style={styles.districtName}>{d.district}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, {
                      width: `${Math.min((d.count / (stats.total_active || 1)) * 100, 100)}%`
                    }]} />
                  </View>
                  <Text style={styles.districtCount}>{d.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Upcoming vaccines */}
          {upcomingVac?.vaccinations?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💉 Upcoming Vaccinations</Text>
              {upcomingVac.vaccinations.slice(0, 4).map((v: any) => (
                <View key={v.id} style={styles.vacRow}>
                  <View>
                    <Text style={styles.vacTag}>{v.tag_number}</Text>
                    <Text style={styles.vacName}>{v.vaccine_name}</Text>
                  </View>
                  <Text style={styles.vacDate}>{v.next_due_date}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#14532d', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { color: '#fff', fontSize: 16, fontWeight: '700' },
  role: { color: '#86efac', fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 12 },
  loading: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, elevation: 1 },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  districtRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  districtName: { width: 80, fontSize: 12, color: '#374151' },
  barContainer: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 4, height: 8, marginHorizontal: 8 },
  bar: { backgroundColor: '#22c55e', height: 8, borderRadius: 4 },
  districtCount: { fontSize: 12, fontWeight: '600', color: '#374151', width: 24, textAlign: 'right' },
  vacRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  vacTag: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace', color: '#15803d' },
  vacName: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  vacDate: { fontSize: 11, backgroundColor: '#fef9c3', color: '#92400e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
});

export default DashboardScreen;
