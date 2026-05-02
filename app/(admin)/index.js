import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, Dimensions, SafeAreaView, StatusBar, Animated, 
  Platform, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem } from '../../utils/storage'; 
import { BASE_URL } from "../../utils/config";
import { triggerLocalNotification } from "../../utils/notifications";

const { width } = Dimensions.get('window');

// Helper for relative time formatting
const formatTime = (dateString) => {
  if (!dateString) return "Recently";
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

export default function GasHubAdmin() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-width * 0.45)).current;

  // Data States
  const [userCount, setUserCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState([]);

  const getHeaders = async () => {
    const token = await getItem("token");
    return { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };
  };

  const fetchNotifications = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/notifications`, { headers });
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) { 
      console.error("Notif fetch error:", e); 
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/users`, { headers });
      const data = await res.json();
      if (data.users) {
        setUserCount(data.users.length);
        setUser(data.users);
      }
    } catch (e) { 
      console.error("Users fetch error:", e); 
    }
  };

  const fetchProfile = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/profile`, { headers });
      const data = await res.json();
      if (data.success) {
        if (data.user.role !== 'ad') {
          triggerLocalNotification("Access Denied", "Admin credentials required.");
          router.replace("/login");
          return;
        }
        setProfile(data.user);
      }
    } catch (e) { 
      console.error("Profile fetch error:", e); 
    }
  };

  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchNotifications(), fetchUsers()]);
    } catch (error) {
      triggerLocalNotification("Update Error", "Failed to sync with server.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleMenu = (open) => {
    setIsMenuOpen(open);
    Animated.spring(drawerAnim, {
      toValue: open ? 0 : -width * 0.45,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;
  const customers = user.filter(u => u.role === 'ct').length;
  const agents = user.filter(u => u.role === 'ag').length;
  const suppliers = user.filter(u => u.role === 'sp').length;
  const pending = user.filter(u => u.is_active === 0 && u.role !== 'ad').length;

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />

      {/* --- SIDE NAVIGATION --- */}
      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        <View style={styles.drawerHeader}>
          <MaterialCommunityIcons name="gas-cylinder" size={32} color="#FF9500" />
          <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.drawerLinks}>
          <DrawerItem icon="view-dashboard-outline" label="Overview" onPress={() => { toggleMenu(false); router.push("/(admin)"); }} />
          <DrawerItem icon="account-tie" label="Suppliers" onPress={() => { toggleMenu(false); router.push("/Managesuppliers"); }} />
          <DrawerItem icon="moped" label="Agents" onPress={() => { toggleMenu(false); router.push("/Manageagents"); }} />
          <DrawerItem icon="account-group" label="Customers" onPress={() => { toggleMenu(false); router.push("/Managecustomers"); }} />
          <DrawerItem icon="account-circle" label="Profile" onPress={() => { toggleMenu(false); router.push("/profile"); }} />
          <DrawerItem icon="cog" label="Settings" onPress={() => { toggleMenu(false); router.push("/settings"); }} />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/logout")}>
          <MaterialCommunityIcons name="logout" size={20} color="red" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <SafeAreaView style={styles.container}>
        {/* --- UNIFIED COMMAND BAR HEADER --- */}
        <View style={styles.commandBar}>
          <View style={styles.leftCluster}>

            
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.menuTrigger}>
              <MaterialCommunityIcons name="segment" size={26} color="#FFF" />
            </TouchableOpacity>


            <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.iconAction}>
              <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#BBB" />
              {unreadCount > 0 && <View style={styles.miniBadge} />}
            </TouchableOpacity>
  </View>
            <View style={styles.brandGroup}>
              <Text style={styles.brandText}>GAS<Text style={{color: '#FF9500'}}>HUB</Text></Text>
              <View style={styles.statusDot} />

            </View>
            
 <View style={styles.rightCluster}>
            <TouchableOpacity onPress={() => router.push("/profile")} style={styles.compactProfile}>
              <View style={styles.headerAvatar}>
                {profile?.photo_url ? (
                  <Image source={{ uri: `${BASE_URL}${profile.photo_url}` }} style={styles.avatarImg} />
                ) : (
                  <MaterialCommunityIcons name="account" size={18} color="#555" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#FF9500" />}
        >
          {/* HERO: HUB OVERVIEW */}
          <View style={styles.heroCard}>
            <View style={styles.row}>
              <Text style={styles.heroLabel}>User Overview</Text>
              <View style={styles.liveIndicator} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.heroValue}>{userCount}</Text>
              <Text style={styles.unit}> USERS</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '102%', backgroundColor: '#FF9500' }]} />
            </View>
            <View style={styles.row}>
              <Text style={styles.heroSub}>Arusha-Tanzania</Text>
              <Text style={styles.heroSub}>System: Stable</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Partner Management</Text>
          <View style={styles.grid}>
            <StatCard title="Suppliers" value={suppliers} icon="storefront" color="#007AFF" desc="Brands" />
            <StatCard title="Agents" value={agents} icon="moped" color="#AF52DE" desc="Verified Fleet" />
            <StatCard title="Pending" value={pending} icon="account-clock" color="#FF9500" desc="Approvals" />
            <StatCard title="Customers" value={customers} icon="account-group" color="#34C759" desc="Live Users" />
          </View>

          <Text style={styles.sectionTitle}>Recent Operations</Text>
          <View style={styles.logsContainer}>
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notif) => (
                <LogItem 
                  key={notif.id}
                  icon={notif.type === 'success' ? 'check-decagram' : notif.type === 'error' ? 'alert-circle' : 'bell-ring'} 
                  text={notif.message} 
                  time={formatTime(notif.created_at)} 
                />
              ))
            ) : (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Text style={{ color: '#444', fontSize: 13 }}>No recent activity logs</Text>
              </View>
            )}
            {notifications.length > 5 && (
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push("/notifications")}>
                <Text style={styles.viewAllText}>View Full Audit Log</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#FF9500" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// --- SHARED COMPONENTS ---
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

const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.dItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={22} color="#666" style={{ marginRight: 15 }} />
    <Text style={styles.dLabel}>{label}</Text>
  </TouchableOpacity>
);

const LogItem = ({ icon, text, time }) => (
  <View style={styles.logRow}>
    <MaterialCommunityIcons name={icon} size={18} color="#FF9500" style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.logText} numberOfLines={2}>{text}</Text>
      <Text style={styles.logTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#000', alignSelf: 'center', width: '100%', maxWidth: 400 },
  container: { flex: 1 },
  commandBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : 40, paddingBottom: 15 },
  leftCluster: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTrigger: { width: 40, height: 40, justifyContent: 'center' },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 , marginLeft: -4},
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759', marginTop: 2 },
  rightCluster: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151517', padding: 4, borderRadius: 30, borderWidth: 1, borderColor: '#222' },
  iconAction: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  miniBadge: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  compactProfile: { marginLeft: 4 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  avatarImg: { width: '100%', height: '100%' },
  drawer: { position: 'absolute', top: 0, bottom: 0, width: width * 0.45, backgroundColor: '#0D0D0E', zIndex: 2000, padding: 25, paddingTop: 60, borderRightWidth: 1, borderColor: '#1A1A1B' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 50 },
  closeBtn: { padding: 8, backgroundColor: '#1A1A1A', borderRadius: 10 },
  dItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  dLabel: { color: '#BBB', fontSize: 15, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', paddingBottom: 20 },
  logoutText: { color: '#FF3B30', marginLeft: 10, fontWeight: '700' },
  heroCard: { backgroundColor: '#0D0D0E', borderRadius: 28, padding: 25, borderWidth: 1, borderColor: '#1A1A1B', marginHorizontal: 20, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#555', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  heroValue: { color: '#FFF', fontSize: 40, fontWeight: '200', marginVertical: 5 },
  unit: { fontSize: 16, color: '#FF9500', fontWeight: '400' },
  progressTrack: { height: 4, backgroundColor: '#1A1A1B', borderRadius: 2, marginVertical: 12 },
  progressFill: { height: '100%', borderRadius: 2 },
  heroSub: { color: '#555', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { width: '48%', backgroundColor: '#0D0D0E', borderRadius: 22, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1B' },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardValue: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  cardTitle: { color: '#999', fontSize: 11, fontWeight: '600', marginTop: 4 },
  cardDesc: { color: '#555', fontSize: 9, marginTop: 2 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 30, marginBottom: 15, marginLeft: 20 },
  logsContainer: { backgroundColor: '#0D0D0E', borderRadius: 22, padding: 10, marginBottom: 30, marginHorizontal: 20 },
  logRow: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1B' },
  logText: { color: '#BBB', fontSize: 13, fontWeight: '500' },
  logTime: { color: '#555', fontSize: 11, marginTop: 4 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  viewAllText: { color: '#FF9500', fontSize: 12, fontWeight: '800' },
  scrollBody: { paddingBottom: 40 }
});