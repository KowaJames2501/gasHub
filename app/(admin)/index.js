import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, Dimensions, SafeAreaView, StatusBar, Animated 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-width * 0.45)).current;

  const toggleMenu = (open) => {
    setIsMenuOpen(open);
    Animated.spring(drawerAnim, {
      toValue: open ? 0 : -width * 0.45,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />

      {/* --- OVERLAY DRAWER --- */}
      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        <View style={styles.drawerHeader}>
          <MaterialCommunityIcons name="shield-crown" size={32} color="#FF3B30" />
          <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.drawerLinks}>
          <DrawerItem icon="view-dashboard" label="System Command" />
          <DrawerItem icon="account-multiple-check" label="User Approvals" />
          <DrawerItem icon="factory" label="Gas Brands" />
          <DrawerItem icon="shield-sync" label="Security Logs" />
          <DrawerItem icon="database-settings" label="Config" />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('../logout')}>
          <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <SafeAreaView style={styles.container}>
        <View style={styles.systemContainer}>
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.glassBtn}>
              <MaterialCommunityIcons name="menu" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.profileBox}>
              <View style={styles.profileText}>
                <Text style={styles.pName}>Chief Admin</Text>
                <Text style={styles.pRole}>Master Access</Text>
              </View>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=admin' }} style={styles.avatar} />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* HERO: SYSTEM HEALTH */}
            <View style={styles.heroCard}>
              <View style={styles.row}>
                <Text style={styles.heroLabel}>GLOBAL SYSTEM STATUS</Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#34C759" />
              </View>
              <Text style={styles.heroValue}>99.9<Text style={styles.unit}>%</Text></Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '99%', backgroundColor: '#34C759' }]} />
              </View>
              <View style={styles.row}>
                <Text style={styles.heroSub}>All Nodes Operational</Text>
                <Text style={styles.heroSub}>Encrypted</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Ecosystem Metrics</Text>
            <View style={styles.grid}>
              <StatCard title="Suppliers" value="18" icon="factory" color="#007AFF" desc="2 New Brands" />
              <StatCard title="Active Agents" value="342" icon="truck-delivery" color="#AF52DE" desc="+12 Today" />
              <StatCard title="New Signups" value="84" icon="account-plus" color="#FF9500" desc="Awaiting Review" />
              <StatCard title="Monthly Rev" value="$82k" icon="currency-usd" color="#34C759" desc="+5.4% Growth" />
            </View>

            <Text style={styles.sectionTitle}>Admin Activity</Text>
            <View style={styles.logsContainer}>
              <LogItem icon="shield-alert" text="Suspicious IP blocked: 102.33.x" time="1h ago" />
              <LogItem icon="check-circle" text="Oryx Brand inventory sync complete" time="3h ago" />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

// --- SHARED SUB-COMPONENTS ---
const StatCard = ({ title, value, icon, color, desc }) => (
  <TouchableOpacity style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
  </TouchableOpacity>
);

const DrawerItem = ({ icon, label }) => (
  <TouchableOpacity style={styles.dItem}>
    <MaterialCommunityIcons name={icon} size={22} color="#888" style={{ marginRight: 15 }} />
    <Text style={styles.dLabel}>{label}</Text>
  </TouchableOpacity>
);

const LogItem = ({ icon, text, time }) => (
  <View style={styles.logRow}>
    <MaterialCommunityIcons name={icon} size={18} color="#444" style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.logText}>{text}</Text>
      <Text style={styles.logTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#000', maxWidth: 400, alignSelf: 'center', width: '100%' },
  container: { flex: 1, marginTop: 30, paddingVertical: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
  systemContainer: { flex: 1 },
  drawer: { position: 'absolute', top: 0, bottom: 0, width: width * 0.45, backgroundColor: '#121214', zIndex: 2000, padding: 30, paddingTop: 60, borderRightWidth: 1, borderColor: '#222' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50 },
  closeBtn: { padding: 8, backgroundColor: '#1A1A1A', borderRadius: 10 },
  dItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  dLabel: { color: '#EEE', fontSize: 16, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  logoutText: { color: '#FF3B30', marginLeft: 10, fontWeight: '700' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  glassBtn: { width: 44, height: 44, backgroundColor: '#1C1C1E', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  profileBox: { flexDirection: 'row', alignItems: 'center' },
  profileText: { alignItems: 'flex-end', marginRight: 12 },
  pName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  pRole: { color: '#555', fontSize: 10, fontWeight: '800' },
  avatar: { width: 38, height: 38, borderRadius: 10 },
  heroCard: { backgroundColor: '#121214', borderRadius: 28, padding: 25, borderWidth: 1, borderColor: '#1C1C1E' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#444', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroValue: { color: '#FFF', fontSize: 42, fontWeight: '200', marginVertical: 10 },
  unit: { fontSize: 20, color: '#FF3B30' },
  progressTrack: { height: 4, backgroundColor: '#1C1C1E', borderRadius: 2, marginVertical: 10 },
  progressFill: { height: '100%', backgroundColor: '#FF3B30' },
  heroSub: { color: '#555', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#121214', borderRadius: 22, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#1C1C1E' },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardValue: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  cardTitle: { color: '#888', fontSize: 11, fontWeight: '600', marginTop: 4 },
  cardDesc: { color: '#444', fontSize: 9, marginTop: 2 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 30, marginBottom: 15 },
  logsContainer: { backgroundColor: '#121214', borderRadius: 22, padding: 10 },
  logRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  logText: { color: '#DDD', fontSize: 13, fontWeight: '500' },
  logTime: { color: '#555', fontSize: 11, marginTop: 4 },
  scrollBody: { paddingBottom: 20 }
});