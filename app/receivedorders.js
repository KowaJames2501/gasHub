import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
  Image, Platform, Linking, LayoutAnimation 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

export default function AgentOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending'); 

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getItem("token");
      const response = await fetch(`${BASE_URL}/api/getagentorders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setOrders(result.orders);
      }
    } catch (error) {
      triggerLocalNotification("Error", "Failed to sync orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const groupedOrders = useMemo(() => {
    const groups = {};
    orders.forEach(order => {
      if (!groups[order.id]) {
        groups[order.id] = {
          ...order,
          items: []
        };
      }
      groups[order.id].items.push({
        stock_id: order.stock_id,
        jina_la_mtungi: order.jina_la_mtungi,
        size: order.size,
        quantity: order.order_qty || order.quantity,
        price: order.price
      });
    });

    return Object.values(groups).filter(o => o.status === filter);
  }, [orders, filter]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = await getItem("token");
      const response = await fetch(`${BASE_URL}/api/resolveorder`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        triggerLocalNotification("Updated", `Order No: ${orderId} is now ${newStatus}`);
        fetchOrders();
      }
    } catch (e) {
      triggerLocalNotification("Error", "Update failed.");
    }
  };

  const callCustomer = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Orders</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabContainer}>
          <FilterTab active={filter === 'pending'} label="New" count={orders.filter(o => o.status === 'pending').length} onPress={() => setFilter('pending')} />
          <FilterTab active={filter === 'processing'} label="Processing" count={orders.filter(o => o.status === 'processing').length} onPress={() => setFilter('processing')} />
          <FilterTab active={filter === 'completed'} label="Done" count={orders.filter(o => o.status === 'completed').length} onPress={() => setFilter('completed')} />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollBody}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchOrders();}} tintColor="#FF9500" />}
          >
            {groupedOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#27272A" />
                <Text style={styles.emptyText}>No {filter} orders.</Text>
              </View>
            ) : (
              groupedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdate={updateOrderStatus}
                  onCall={() => callCustomer(order.customer_phone)}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const FilterTab = ({ label, active, onPress, count }) => (
  <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.activeTab]}>
    <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    {count > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const OrderCard = ({ order, onUpdate, onCall }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Phone: {order.customer_phone}</Text>
            <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <MaterialCommunityIcons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#FF9500" 
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.customerRow}>
          <Image source={{ uri: order.customer_photo ? `${BASE_URL}${order.customer_photo}` : 'https://via.placeholder.com/50' }} style={styles.custAvatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.custName}>{order.customer_name}</Text>
            <Text style={styles.custLocation} numberOfLines={1}>
              <MaterialCommunityIcons name="map-marker" size={12} color="#71717A" /> {order.customer_location}
            </Text>
          </View>
              <Text style={styles.custLocation}>Order No:{order.id}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.itemTitle}>Order Items:</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.productBox}>
              <Text style={styles.productText}>{item.quantity}x {item.jina_la_mtungi} ({item.size})</Text>
              <Text style={styles.priceText}>TSh {parseFloat(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>TSh {parseFloat(order.total_amount).toLocaleString()}</Text>
          </View>

          <View style={styles.actionRow}>
            {order.status === 'pending' && (
              <TouchableOpacity style={styles.primaryAction} onPress={() => onUpdate(order.id, 'processing')}>
                <MaterialCommunityIcons name="moped" size={20} color="#000" />
                <Text style={styles.primaryActionText}>Dispatch Delivery</Text>
              </TouchableOpacity>
            )}
            {order.status === 'processing' && (
              <TouchableOpacity style={[styles.primaryAction, { backgroundColor: '#34C759' }]} onPress={() => onUpdate(order.id, 'completed')}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
                <Text style={[styles.primaryActionText, { color: '#FFF' }]}>Mark Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 42, height: 42, backgroundColor: '#18181B', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  activeTab: { backgroundColor: '#FF9500', borderColor: '#FF9500' },
  tabLabel: { color: '#71717A', fontWeight: '700', fontSize: 13 },
  activeTabLabel: { color: '#000' },
  badge: { backgroundColor: 'rgba(0,0,0,0.2)', marginLeft: 8, paddingHorizontal: 6, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { backgroundColor: '#121214', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#FF9500', fontSize: 16, fontWeight: '800' },
  orderTime: { color: '#52525B', fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1C1C1E', marginVertical: 15 },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  custAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1C1C1E' },
  custName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  custLocation: { color: '#71717A', fontSize: 12, marginTop: 2 },
  callBtn: { width: 40, height: 40, backgroundColor: '#27272A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expandedContent: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#1C1C1E', paddingTop: 15 },
  itemTitle: { color: '#A1A1AA', fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  productBox: { backgroundColor: '#09090B', borderRadius: 15, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  productText: { color: '#E4E4E7', fontSize: 13, fontWeight: '600' },
  priceText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingHorizontal: 5 },
  totalLabel: { color: '#71717A', fontWeight: '700' },
  totalValue: { color: '#FF9500', fontWeight: '900', fontSize: 16 },
  actionRow: { marginTop: 20 },
  primaryAction: { backgroundColor: '#FF9500', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 15, gap: 10 },
  primaryActionText: { color: '#000', fontWeight: '800', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#52525B', marginTop: 15, fontWeight: '600' }
});