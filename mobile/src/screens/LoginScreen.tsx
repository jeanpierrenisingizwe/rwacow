import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useApp } from '../context/AppContext';

const LoginScreen: React.FC = () => {
  const { login, t, language, setLanguage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🐄</Text>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.subtitle}>Rwanda Livestock Management</Text>

        {/* Language toggle */}
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langActive]}
            onPress={() => setLanguage('en')}>
            <Text style={[styles.langText, language === 'en' && styles.langActiveText]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'rw' && styles.langActive]}
            onPress={() => setLanguage('rw')}>
            <Text style={[styles.langText, language === 'rw' && styles.langActiveText]}>Kinyarwanda</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="example@email.com"
        />

        <Text style={styles.label}>{t('password')}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('login')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#14532d', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#14532d', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  langRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  langActive: { backgroundColor: '#15803d' },
  langText: { fontSize: 13, color: '#6b7280' },
  langActiveText: { color: '#fff', fontWeight: '600' },
  label: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, fontSize: 14 },
  button: { width: '100%', backgroundColor: '#15803d', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default LoginScreen;
