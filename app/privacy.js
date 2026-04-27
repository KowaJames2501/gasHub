import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          <View style={styles.card}>
            <Text style={styles.lastUpdated}>Last Updated: April 12, 2026</Text>
            
            <PolicySection 
              title="1. Information We Collect" 
              body="GasHub collects personal information such as your name, email address, phone number, and location data to facilitate gas deliveries and account management." 
            />
            
            <PolicySection 
              title="2. How We Use Data" 
              body="Your data is used to connect customers with agents, process orders, and improve our services. We do not sell your personal data to third parties." 
            />

            <PolicySection 
              title="3. Location Services" 
              body="We require location access to find nearby gas agents and provide accurate delivery tracking. You can disable this in system settings, but app functionality will be limited." 
            />

            <PolicySection 
              title="4. Data Security" 
              body="We implement industry-standard encryption and secure storage (including SecureStore for tokens) to protect your information from unauthorized access." 
            />
          </View>

          <Text style={styles.footerBranding}>GAS HUB SECURITY PROTOCOL V2.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const PolicySection = ({ title, body }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  backBtn: { backgroundColor: '#18181B', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#18181B', borderRadius: 24, padding: 25, marginTop: 20, borderWidth: 1, borderColor: '#27272A' },
  lastUpdated: { color: '#FF3B30', fontSize: 12, fontWeight: '800', marginBottom: 25, letterSpacing: 1 },
  section: { marginBottom: 25 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  sectionBody: { color: '#A1A1AA', fontSize: 14, lineHeight: 22 },
  footerBranding: { textAlign: 'center', color: '#27272A', fontSize: 10, fontWeight: '800', marginTop: 30, letterSpacing: 2 }
});