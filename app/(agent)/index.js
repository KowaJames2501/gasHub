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

export default function GasHubDashboard() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = screenWidth * 0.5; 

  // --- STATE ---
  const [suppliers, setSuppliers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-drawerWidth)).current;

  const getHeaders = async () => {
    const token = await getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchsuppliers = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/getsuppliers`, { headers });
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers || []);
    } catch (e) { console.error("Suppliers fetch error:", e); }
  };

  const fetchProfile = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/profile`, { headers });
      const data = await res.json();
  

      const role = data?.user?.role;
            if (role !== 'ag') {
              triggerLocalNotification("Error", "Access Restricted. Agent credentials required.");
              router.replace("/login");
              return;
            }

      if (data.success) setProfile(data.user);
    } catch (e) { console.error("Profile fetch error:", e); }
  };

  const fetchNotifications = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/notifications`, { headers });
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) { console.error("Notif fetch error:", e); }
  };

  const fetchOrders = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/myorders`, { headers });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (e) { console.error("Orders fetch error:", e); }
  };

  // --- MASTER FETCH ---
  const fetchData = async () => {
    try {
      await Promise.all([
        fetchsuppliers(),
        fetchProfile(),
        fetchNotifications(),
        fetchOrders()
      ]);
    } catch (error) {
      triggerLocalNotification("Update Error", error);
    } finally {
      setRefreshing(false);
    }
  };

  // --- HANDLERS ---
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
    return roles[role] || "User";
  };

  // --- UI COMPUTATIONS ---
  const unreadCount = notifications.filter(n => n.is_read === 0).length;
  const completedOrders = orders.filter(o => o.status?.toLowerCase() === 'completed').length;
  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending').length;

  return (

    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* --- SIDEBAR DRAWER --- */}
      <Animated.View style={[styles.drawer, { left: drawerAnim, width: drawerWidth }]}>
        <View style={styles.drawerHeader}>
          <MaterialCommunityIcons name="gas-cylinder" size={32} color="#FF9500" />
          <TouchableOpacity onPress={() => toggleMenu(false)} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerLinks}>
          <DrawerItem icon="view-dashboard-outline" label="Overview" onPress={() => { toggleMenu(false); router.push("/(agent)"); }} />
          <DrawerItem icon="clipboard-list-outline" label="Client Orders" onPress={() => { toggleMenu(false); router.push("/receivedorders"); }} />
          <DrawerItem icon="cart-plus" label="Make Order" onPress={() => { toggleMenu(false); router.push("/agentorder"); }} />
          <DrawerItem icon="list-box-outline" label="My Orders" onPress={() => { toggleMenu(false); router.push("/agentallorders"); }} />
          <DrawerItem icon="credit-card-outline" label="Payments" onPress={() => { toggleMenu(false); router.push("/payment"); }} />
          <DrawerItem icon="truck-outline" label="My Stocks" onPress={() => { toggleMenu(false); router.push("/mystocks"); }} />
          <DrawerItem icon="account-circle" label="Profile" onPress={() => { toggleMenu(false); router.push("/profile"); }} />
          <DrawerItem icon="cog" label="Settings" onPress={() => { toggleMenu(false); router.push("/settings"); }} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/logout")}>
          <MaterialCommunityIcons name="logout" size={20} color="red" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.container}>
        <View style={styles.topNav}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.glassBtn}>
              <MaterialCommunityIcons name="menu" size={26} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.glassBtn}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileBox}>
            <View style={styles.profileText}>
              <Text style={styles.pName}>{profile?.name || "User"}</Text>
              <Text style={styles.pRole}>{getRoleLabel(profile?.role)}</Text>
            </View>
            <View style={styles.avatarContainer}>
               {profile?.photo_url ? (
                 <Image source={{ uri: `${BASE_URL}${profile.photo_url}` }} style={styles.avatarImg} />
               ) : (
                 <MaterialCommunityIcons name="account" size={24} color="#555" />
               )}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />}
        >
          {/* FIELD AGENTS */}
          <Text style={styles.sectionTitle}>Available Suppliers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalAgentList}>
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  onPress={() => setSelectedSupplier(selectedSupplier?.id === supplier.id ? null : supplier)}
                  style={[styles.agentCard, selectedSupplier?.id === supplier.id && styles.selectedAgentCard]}
                >
                  <View style={styles.agentAvatarBox}>
                    <View style={styles.agentImgWrapper}>
                      {supplier?.profile_url ? (
                        <Image source={{ uri: `${BASE_URL}/uploads/${supplier?.profile_url}` }} style={styles.avatarImg} />
                      ) : (
                        <MaterialCommunityIcons name="account" size={30} color="#555" />
                      )}
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: supplier.status === "online" ? "#34C759" : "#FF9500" }]} />
                  </View>
                  <Text numberOfLines={1} style={styles.agentNameShort}>{supplier.name?.split(" ")[0]}</Text>
                  <Text style={styles.agentStatusText}>{supplier.status || "offline"}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Finding suppliers...</Text>
            )}
          </ScrollView>

          {/* DYNAMIC INVENTORY */}
          {selectedSupplier && (
            <View style={styles.inventoryContainer}>
              <View style={styles.inventoryHeader}>
                <Text style={styles.inventoryTitle}>{selectedSupplier.name}'s Catalog</Text>

                <TouchableOpacity onPress={() => setSelectedSupplier(null)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color="#FF9500" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                <Text style={styles.prodPrice}>{selectedSupplier.phone}</Text>
                <Text style={styles.inventoryTitle}>{selectedSupplier.location}</Text>
              </View>
              <View style={styles.productGrid}>
                {selectedSupplier.products && selectedSupplier.products.length > 0 ? (
                  selectedSupplier.products.map((prod) => (
                    <View key={prod.id} style={styles.productItem}>
                      <View style={styles.prodIconBox}>
                         <MaterialCommunityIcons name="gas-cylinder" size={20} color="#FF9500" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.prodName}>{prod.jina_la_mtungi || prod.name}</Text>
                        <Text style={styles.prodStock}>{prod.size} • {prod.stock || 0} in stock</Text>
                      </View>
                      <Text style={styles.prodPrice}>TSh {prod.price}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyStockContainer}>
                    <MaterialCommunityIcons name="package-variant" size={40} color="#333" />
                    <Text style={styles.emptyStockText}>Agent currently has no stock.</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.grid}>
            <StatCard title="Active Suppliers" value={suppliers.filter(s => s.status === 'online').length} icon="moped" color="#007AFF" desc="Ready to deliver" />
            <StatCard title="Pending" value={pendingOrders} icon="clock-outline" color="#0adaff" desc=" My Orders in queue" />
            <StatCard title="Completed" value={completedOrders} icon="check-decagram" color="#34C759" desc="Received Deliveries" />
            <StatCard title="Total Orders" value={orders.length} icon="clipboard-text" color="#5416e4" desc="All Orders" />
          </View>

          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.logsContainer}>
            {orders.length > 0 ? (
              orders.slice(0, 3).map((order) => (
                <LogItem 
                  key={order.id}
                  icon={order.status === 'completed' ? "check-circle" : "truck-delivery"} 
                  text={`Order with status ${order.status}  and payment TSh ${order.total_amount}, made on ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'unknown date'}`} 
                  time={new Date(order.created_at).toLocaleDateString()} 
                />
              ))
            ) : (
              <LogItem icon="information-outline" text="No recent activity found" time="--" />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// --- SUB-COMPONENTS ---
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
    <MaterialCommunityIcons name={icon} size={18} color="#FF9500" style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.logText}>{text}</Text>
      <Text style={styles.logTime}>{time}</Text>
    </View>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20, paddingBottom: 20 },
  glassBtn: { width: 44, height: 44, backgroundColor: "#18181B", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#27272A" },
  badge: { 
    position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, 
    backgroundColor: '#FF9500', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' 
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  profileBox: { flexDirection: "row", alignItems: "center" },
  profileText: { alignItems: "flex-end", marginRight: 12 },
  pName: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  pRole: { color: "#71717A", fontSize: 10, fontWeight: "800", textTransform: 'uppercase' },
  avatarContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181B', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  avatarImg: { width: '100%', height: '100%' },
  sectionTitle: { color: "#FFF", fontSize: 16, fontWeight: "800", marginTop: 25, marginBottom: 15 },
  horizontalAgentList: { paddingRight: 20, gap: 12 },
  agentCard: { width: 90, height: 115, backgroundColor: "#18181B", borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#27272A" },
  selectedAgentCard: { borderColor: "#FF9500", backgroundColor: "#1C1917" },
  agentAvatarBox: { position: 'relative', marginBottom: 8 },
  agentImgWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#27272A', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  statusDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#18181B' },
  agentNameShort: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  agentStatusText: { color: "#71717A", fontSize: 10, marginTop: 2, textTransform: 'capitalize' },
  inventoryContainer: { marginTop: 20, backgroundColor: "#18181B", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#27272A" },
  inventoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  inventoryTitle: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  productGrid: { gap: 10 },
  productItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#09090B", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#27272A" },
  prodIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#18181B", justifyContent: 'center', alignItems: 'center' },
  prodName: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  prodStock: { color: "#71717A", fontSize: 11, marginTop: 2 },
  prodPrice: { color: "#FF9500", fontWeight: "800", fontSize: 12 },
  emptyStockContainer: { alignItems: 'center', paddingVertical: 20 },
  emptyStockText: { color: '#71717A', fontSize: 12, marginTop: 8 },
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
  emptyText: { color: '#3F3F46', fontSize: 12 }
});