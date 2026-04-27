import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { getItem } from "../../utils/storage";
import SessionGuard from "../../utils/session";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  useWindowDimensions,
  Platform
} from "react-native";
import { BASE_URL } from "../../utils/config";
import { triggerLocalNotification } from "../../utils/notifications";

export default function SupplierDashboard() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = screenWidth * 0.5;

  // --- STATE ---
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]); // Wholesales orders from agents
  const [notifications, setNotifications] = useState([]);
  const [stockStats, setStockStats] = useState({ total: 0, items: [] });
  const [refreshing, setRefreshing] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-drawerWidth)).current;

  const getHeaders = async () => {
    const token = await getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/profile`, { headers });
      const data = await res.json();

      // Supplier Role Check (sp)
      if (data?.user?.role !== 'sp') {
        triggerLocalNotification("Error", "Access Restricted. Supplier credentials required.");
        router.replace("/login");
        return;
      }

      if (data.success) setProfile(data.user);
    } catch (e) { console.error("Profile fetch error:", e); }
  };

  const fetchStock = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/getmystock`, { headers });
      const data = await res.json();
      if (data) {
          const total = data.reduce((acc, item) => acc + (item.quantity || 0), 0);
          setStockStats({ total, items: data });
      }
    } catch (e) { console.error("Stock fetch error:", e); }
  };

  const fetchOrders = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/getagentorders`, { headers });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (e) { console.error("Orders fetch error:", e); }
  };

  const fetchNotifications = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/notifications`, { headers });
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) { console.error("Notif fetch error:", e); }
  };

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchStock(),
        fetchOrders(),
        fetchNotifications()
      ]);
    } catch (error) {
      triggerLocalNotification("Update Error", "Failed to sync dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const toggleMenu = (open) => {
    Animated.spring(drawerAnim, {
      toValue: open ? 0 : -drawerWidth,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const getRoleLabel = (role) => {
    const roles = { ad: "Hub Admin", ag: "Agent", sp: "Supplier", ct: "Customer" };
    return roles[role] || "Supplier";
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;
  const pendingWholesale = orders.filter(o => o.status?.toLowerCase() === 'pending').length;

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.drawer, { left: drawerAnim, width: drawerWidth }]}>
        <View style={styles.drawerHeader}>
          <MaterialCommunityIcons name="factory" size={32} color="#007AFF" />
          <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerLinks}>
          <DrawerItem icon="view-dashboard-outline" label="Overview" onPress={() => { toggleMenu(false); }} />
          <DrawerItem icon="warehouse" label="Inventory" onPress={() => { toggleMenu(false); router.push("/mystocks"); }} />
          <DrawerItem icon="plus-box-outline" label="Add Product" onPress={() => { toggleMenu(false); router.push("/addstock"); }} />
          <DrawerItem icon="truck-delivery-outline" label="Agent Requests" onPress={() => { toggleMenu(false); router.push("/receivedorders"); }} />
          <DrawerItem icon="history" label="Supply Logs" onPress={() => { toggleMenu(false); router.push("/agentallorders"); }} />
          <DrawerItem icon="account-circle" label="Brand Profile" onPress={() => { toggleMenu(false); router.push("/profile"); }} />
          <DrawerItem icon="cog-outline" label="Settings" onPress={() => { toggleMenu(false); router.push("/settings"); }} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/logout")}>
          <MaterialCommunityIcons name="logout" size={20} color="red" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.container}>
        {/* TOP NAVIGATION */}
        <View style={styles.topNav}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.glassBtn}>
              <MaterialCommunityIcons name="menu" size={26} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.glassBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileBox}>
            <View style={styles.profileText}>
              <Text style={styles.pName}>{profile?.name || "Supplier"}</Text>
              <Text style={styles.pRole}>{getRoleLabel(profile?.role)}</Text>
            </View>
            <View style={styles.avatarContainer}>
               {profile?.photo_url ? (
                 <Image source={{ uri: `${BASE_URL}${profile.photo_url}` }} style={styles.avatarImg} />
               ) : (
                 <MaterialCommunityIcons name="factory" size={20} color="#555" />
               )}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
        >
          {/* HERO STAT: TOTAL CENTRAL RESERVES */}
          <View style={styles.heroCard}>
             <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>CENTRAL RESERVES</Text>
                <MaterialCommunityIcons name="shield-check" size={16} color="#34C759" />
             </View>
             <Text style={styles.heroValue}>{stockStats.total}<Text style={styles.unit}> Units</Text></Text>
             <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '85%', backgroundColor: '#007AFF' }]} />
             </View>
             <Text style={styles.heroSub}>Warehouse Capacity: 85% full</Text>
          </View>

          <Text style={styles.sectionTitle}>Wholesale Performance</Text>
          <View style={styles.grid}>
            <StatCard title="Active Agents" value="48" icon="account-group" color="#007AFF" desc="In 12 Regions" />
            <StatCard title="Pending Orders" value={pendingWholesale} icon="clock-fast" color="#FF9500" desc="Awaiting Dispatch" />
            <StatCard title="Successful" value={orders.filter(o => o.status === 'completed').length} icon="check-decagram" color="#34C759" desc="Delivered this month" />
            <StatCard title="Total Revenue" value="TSh 5.2M" icon="currency-usd" color="#AF52DE" desc="Current Month" />
          </View>

          <Text style={styles.sectionTitle}>Recent Logistics</Text>
          <View style={styles.logsContainer}>
            {orders.length > 0 ? (
              orders.slice(0, 4).map((order) => (
                <LogItem 
                  key={order.id}
                  icon={order.status === 'completed' ? "truck-check" : "truck-delivery"} 
                  text={`Order #${order.id} for TSh ${order.total_amount} is ${order.status}`} 
                  time={new Date(order.created_at).toLocaleDateString()} 
                />
              ))
            ) : (
              <LogItem icon="information-outline" text="No logistics activity" time="--" />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// --- SUB-COMPONENTS (IDENTICAL TO AGENT) ---
const StatCard = ({ title, value, icon, color, desc }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{desc}</Text>
  </TouchableOpacity>
);

const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.dItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color="#888" style={{ marginRight: 15 }} />
    <Text style={styles.dLabel}>{label}</Text>
  </TouchableOpacity>
);

const LogItem = ({ icon, text, time }) => (
  <View style={styles.logRow}>
    <MaterialCommunityIcons name={icon} size={18} color="#007AFF" style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.logText}>{text}</Text>
      <Text style={styles.logTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20, paddingBottom: 20 },
  glassBtn: { width: 44, height: 44, backgroundColor: "#18181B", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#27272A" },
  badge: { 
    position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, 
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' 
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  profileBox: { flexDirection: "row", alignItems: "center" },
  profileText: { alignItems: "flex-end", marginRight: 12 },
  pName: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  pRole: { color: "#71717A", fontSize: 10, fontWeight: "800", textTransform: 'uppercase' },
  avatarContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181B', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  avatarImg: { width: '100%', height: '100%' },
  sectionTitle: { color: "#FFF", fontSize: 16, fontWeight: "800", marginTop: 25, marginBottom: 15 },
  
  // Hero Card Styling for Supplier
  heroCard: { backgroundColor: "#18181B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#27272A", marginBottom: 10 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#71717A', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroValue: { color: '#FFF', fontSize: 36, fontWeight: '200', marginVertical: 10 },
  unit: { fontSize: 16, color: '#007AFF' },
  progressTrack: { height: 4, backgroundColor: '#27272A', borderRadius: 2, marginVertical: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  heroSub: { color: '#71717A', fontSize: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", backgroundColor: "#18181B", borderRadius: 24, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: "#27272A" },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  cardValue: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  cardTitle: { color: "#E4E4E7", fontSize: 12, fontWeight: "700", marginTop: 4 },
  cardDesc: { color: "#71717A", fontSize: 10, marginTop: 2 },
  logsContainer: { backgroundColor: "#18181B", borderRadius: 24, padding: 10, borderWidth: 1, borderColor: "#27272A" },
  logRow: { flexDirection: "row", padding: 15, borderBottomWidth: 1, borderBottomColor: "#27272A" },
  logText: { color: "#E4E4E7", fontSize: 13, fontWeight: "600" },
  logTime: { color: "#71717A", fontSize: 11, marginTop: 4 },
  drawer: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#18181B", zIndex: 2000, padding: 30, paddingTop: 60, borderRightWidth: 1, borderColor: "#27272A" },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 50 },
  closeBtn: { padding: 8, backgroundColor: "#27272A", borderRadius: 12 },
  dItem: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  dLabel: { color: "#E4E4E7", fontSize: 16, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", marginTop: "auto", paddingVertical: 20 },
  logoutText: { color: "red", marginLeft: 10, fontWeight: "800" },
});